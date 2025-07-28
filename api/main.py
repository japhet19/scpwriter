"""
FastAPI backend for SCP Writer with WebSocket support
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import json
import sys
import os
from pathlib import Path
from typing import Dict, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent / '.env')

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from scp_coordinator import SCPCoordinator, StoryConfig
# Import from api.utils specifically
from api.utils.text_sanitizer import sanitize_text
from api.utils.encryption import encryptor
from api.auth import router as auth_router, get_current_user
from supabase import create_client, Client

# Store active websocket connections
active_connections: Dict[str, WebSocket] = {}

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_ANON_KEY"))
supabase: Client = create_client(supabase_url, supabase_key)

def map_agent_name_to_key(agent_name: str, coordinator) -> str:
    """Map theme-specific agent names to standard keys for frontend compatibility."""
    # Get the theme-specific agent names from the coordinator
    writer_name = coordinator.theme.writer.name
    reader_name = coordinator.theme.reader.name 
    expert_name = coordinator.theme.expert.name
    
    # Map to standard keys
    if agent_name == writer_name:
        mapped_key = "Writer"
    elif agent_name == reader_name:
        mapped_key = "Reader"  
    elif agent_name == expert_name:
        mapped_key = "Expert"
    else:
        # Fallback for unknown agent names
        mapped_key = agent_name
    
    # Debug logging
    if mapped_key != agent_name:
        print(f"🔄 AGENT MAPPING: '{agent_name}' → '{mapped_key}'")
    
    return mapped_key

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting SCP Writer API...")
    yield
    # Shutdown
    print("Shutting down SCP Writer API...")

app = FastAPI(
    title="SCP Writer API",
    description="Backend API for SCP story generation with AI agents",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include auth router
app.include_router(auth_router)

@app.get("/")
async def root():
    return {"message": "SCP Writer API", "status": "operational"}

@app.websocket("/ws/generate")
async def websocket_generate(websocket: WebSocket):
    await websocket.accept()
    connection_id = id(websocket)
    active_connections[str(connection_id)] = websocket
    user_id = None
    user_api_key = None
    
    try:
        # First message should contain auth token
        auth_data = await websocket.receive_text()
        auth_params = json.loads(auth_data)
        
        if auth_params.get("type") == "auth":
            token = auth_params.get("token")
            if not token:
                await websocket.send_json({
                    "type": "error",
                    "message": "Authentication required"
                })
                await websocket.close()
                return
            
            # Verify token and get user
            try:
                from jose import jwt
                payload = jwt.get_unverified_claims(token)
                user_id = payload.get("sub")
                
                if not user_id:
                    raise Exception("Invalid token")
                
                # Get user's OpenRouter API key
                result = supabase.table("user_api_keys").select("encrypted_key").eq("user_id", user_id).eq("provider", "openrouter").eq("is_active", True).execute()
                
                if not result.data:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Please connect your OpenRouter account first"
                    })
                    await websocket.close()
                    return
                
                # Decrypt the API key
                user_api_key = encryptor.decrypt_api_key(result.data[0]["encrypted_key"])
                
                # Send auth success
                await websocket.send_json({
                    "type": "auth_success",
                    "message": "Authentication successful"
                })
                
            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Authentication failed: {str(e)}"
                })
                await websocket.close()
                return
        else:
            await websocket.send_json({
                "type": "error",
                "message": "First message must be authentication"
            })
            await websocket.close()
            return
        
        while True:
            # Receive story parameters
            data = await websocket.receive_text()
            params = json.loads(data)
            
            theme = params.get("theme", "")
            page_limit = params.get("pages", 3)
            protagonist_name = params.get("protagonist")
            model = params.get("model")
            ui_theme = params.get("uiTheme", "scp")
            theme_options = params.get("themeOptions", {})
            
            # Debug logging for theme loading
            print(f"🎭 THEME DEBUG: Received uiTheme='{ui_theme}' from frontend")
            print(f"📊 THEME OPTIONS: {theme_options}")
            
            # Send acknowledgment
            await websocket.send_json({
                "type": "status",
                "message": "Initializing story generation...",
                "phase": "initialization"
            })
            
            # Create story configuration
            story_config = StoryConfig(
                page_limit=page_limit,
                protagonist_name=protagonist_name,
                model=model,
                theme=ui_theme,
                theme_options=theme_options
            )
            
            # Create coordinator with user's API key
            coordinator = SCPCoordinator(story_config, api_key=user_api_key)
            
            # Debug logging for loaded theme
            print(f"🎯 LOADED THEME: {coordinator.theme.name} (ID: {coordinator.theme.id})")
            print(f"👥 AGENT NAMES: Writer={coordinator.theme.writer.name}, Reader={coordinator.theme.reader.name}, Expert={coordinator.theme.expert.name}")
            
            # Create custom agent wrapper for streaming
            class StreamingAgent:
                def __init__(self, original_agent, websocket, coordinator):
                    self.original_agent = original_agent
                    self.websocket = websocket
                    self.coordinator = coordinator
                    # Copy necessary attributes
                    self.name = original_agent.name
                    self.system_prompt = original_agent.system_prompt
                    self.model = getattr(original_agent, 'model', 'anthropic/claude-3.5-sonnet')
                    
                async def respond(self, prompt: str, skip_callback: bool = False):
                    # Map theme-specific agent name to standard key for frontend
                    agent_key = map_agent_name_to_key(self.name, self.coordinator)
                    
                    # Send thinking state update
                    await self.websocket.send_json({
                        "type": "agent_update",
                        "agent": agent_key,
                        "state": "thinking",
                        "activity": self._get_thinking_activity(),
                        "message": f"{self.name} is processing..."
                    })
                    
                    # Small delay to ensure state is visible
                    await asyncio.sleep(0.5)
                    
                    # Send writing state update
                    await self.websocket.send_json({
                        "type": "agent_update",
                        "agent": agent_key,
                        "state": "writing",
                        "activity": self._get_writing_activity(),
                        "message": f"{self.name} is composing response..."
                    })
                    
                    # Stream response from original agent
                    response_text = ""
                    async for chunk in self.original_agent.respond_streaming(prompt, skip_callback):
                        response_text += chunk
                        # Send chunk via WebSocket
                        await self.websocket.send_json({
                            "type": "agent_stream_chunk",
                            "agent": agent_key,
                            "chunk": sanitize_text(chunk),
                            "turn": self.coordinator.turn_count
                        })
                    
                    # Send complete message when done
                    await self.websocket.send_json({
                        "type": "agent_message",
                        "agent": agent_key,
                        "message": sanitize_text(response_text),
                        "turn": self.coordinator.turn_count,
                        "phase": self.coordinator.current_phase
                    })
                    
                    # Send milestone update if applicable
                    milestone = self._get_milestone_for_phase(self.coordinator.current_phase)
                    if milestone:
                        await self.websocket.send_json({
                            "type": "agent_update",
                            "agent": agent_key,
                            "state": "waiting",
                            "milestone": milestone,
                            "message": f"Milestone reached: {milestone}"
                        })
                    
                    return response_text
                
                def _get_thinking_activity(self):
                    activities = {
                        "Writer": "Analyzing theme and narrative structure...",
                        "Reader": "Preparing to review story elements...",
                        "Expert": "Checking SCP database and protocols..."
                    }
                    return activities.get(self.name, f"{self.name} is thinking...")
                
                def _get_writing_activity(self):
                    activities = {
                        "Writer": "Crafting SCP narrative...",
                        "Reader": "Providing detailed feedback...",
                        "Expert": "Documenting containment procedures..."
                    }
                    return activities.get(self.name, f"{self.name} is writing...")
                
                def _get_milestone_for_phase(self, phase):
                    if not phase:
                        return None
                    phase_lower = phase.lower()
                    milestones = {
                        "brainstorming": "theme_selected",
                        "initial_draft": "initial_draft",
                        "feedback": "feedback_received",
                        "revision": "revision_complete",
                        "expert_review": "expert_review",
                        "final_polish": "final_polish"
                    }
                    return milestones.get(phase_lower)
            
            # Override run_conversation to wrap agents after initialization
            original_run_conversation = coordinator.run_conversation
            
            async def wrapped_run_conversation(opening_speaker: str, opening_prompt: str):
                # Wrap agents with streaming capability
                for agent_name in coordinator.agents:
                    coordinator.agents[agent_name] = StreamingAgent(
                        coordinator.agents[agent_name], 
                        websocket, 
                        coordinator
                    )
                # Call original method
                return await original_run_conversation(opening_speaker, opening_prompt)
            
            coordinator.run_conversation = wrapped_run_conversation
            
            # Run story generation
            try:
                await coordinator.run_story_creation(theme)
                
                # Send completion message
                story_path = Path("output/story_output.md")
                if story_path.exists():
                    story_content = story_path.read_text(encoding='utf-8', errors='replace')
                    
                    # Save story to database
                    try:
                        # Extract title from story (usually first line after #)
                        lines = story_content.split('\n')
                        title = "Untitled Story"
                        for line in lines:
                            if line.strip().startswith('#') and not line.strip().startswith('##'):
                                title = line.strip('#').strip()
                                break
                        
                        # Save to database
                        story_record = supabase.table("stories").insert({
                            "user_id": user_id,
                            "title": title,
                            "theme": ui_theme,
                            "protagonist_name": protagonist_name,
                            "content": story_content,
                            "agent_logs": {
                                "conversation_history": coordinator.conversation_history,
                                "turn_count": coordinator.turn_count,
                                "phases": coordinator.current_phase
                            },
                            "model_used": model or "default",
                            "tokens_used": None  # TODO: Track token usage
                        }).execute()
                        
                        print(f"Story saved to database with ID: {story_record.data[0]['id']}")
                    except Exception as e:
                        print(f"Error saving story to database: {e}")
                    
                    # Send final milestone
                    await websocket.send_json({
                        "type": "agent_update",
                        "agent": "System",
                        "state": "completed",
                        "milestone": "story_complete",
                        "message": "Story generation complete!"
                    })
                    
                    await websocket.send_json({
                        "type": "completed",
                        "story": sanitize_text(story_content),
                        "message": "Story generation complete!"
                    })
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Story generation completed but no output file found"
                    })
                    
            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Error during story generation: {str(e)}"
                })
    
    except WebSocketDisconnect:
        del active_connections[str(connection_id)]
        print(f"Client {connection_id} disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        if str(connection_id) in active_connections:
            del active_connections[str(connection_id)]

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "active_connections": len(active_connections)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
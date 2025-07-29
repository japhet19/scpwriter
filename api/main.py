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

from scp_coordinator_session import SCPCoordinatorSession, StoryConfig as SessionStoryConfig
# Import from utils specifically
from utils.text_sanitizer import sanitize_text
from utils.encryption import encryptor
from auth import router as auth_router, get_current_user
from supabase import create_client, Client
from utils.story_session_manager import StorySessionManager

# Store active websocket connections
active_connections: Dict[str, WebSocket] = {}

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_ANON_KEY"))
supabase: Client = create_client(supabase_url, supabase_key)

# Story session manager
story_session_manager = StorySessionManager(supabase)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting SCP Writer API...")
    # Start session cleanup task
    await story_session_manager.start_cleanup_task()
    yield
    # Shutdown
    print("Shutting down SCP Writer API...")
    # Stop session cleanup task
    await story_session_manager.stop_cleanup_task()

app = FastAPI(
    title="SCP Writer API",
    description="Backend API for SCP story generation with AI agents",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
# Get allowed origins from environment variable, default to localhost for development
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
            story_config = SessionStoryConfig(
                page_limit=page_limit,
                protagonist_name=protagonist_name,
                model=model,
                theme=ui_theme,
                theme_options=theme_options
            )
            
            # Create a new session for this story generation
            session_id = await story_session_manager.create_session(
                user_id=user_id,
                config={
                    "theme": ui_theme,
                    "page_limit": page_limit,
                    "protagonist_name": protagonist_name,
                    "model": model,
                    "theme_options": theme_options,
                    "user_request": theme
                }
            )
            
            # Send session ID to frontend
            await websocket.send_json({
                "type": "session_created",
                "session_id": session_id,
                "message": "Story generation session created"
            })
            
            # Create coordinator with session support
            coordinator = SCPCoordinatorSession(
                story_config=story_config,
                api_key=user_api_key,
                session_manager=story_session_manager,
                session_id=session_id
            )
            
            # Debug logging for loaded theme
            print(f"🎯 LOADED THEME: {coordinator.theme.name} (ID: {coordinator.theme.id})")
            print(f"👥 AGENT SYSTEM: Writer, Reader, Expert")
            
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
                    # Send thinking state update
                    await self.websocket.send_json({
                        "type": "agent_update",
                        "agent": self.name,
                        "state": "thinking",
                        "activity": self._get_thinking_activity(),
                        "message": f"{self.name} is processing..."
                    })
                    
                    # Small delay to ensure state is visible
                    await asyncio.sleep(0.5)
                    
                    # Send writing state update
                    await self.websocket.send_json({
                        "type": "agent_update",
                        "agent": self.name,
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
                            "agent": self.name,
                            "chunk": sanitize_text(chunk),
                            "turn": self.coordinator.turn_count
                        })
                    
                    # Send complete message when done
                    await self.websocket.send_json({
                        "type": "agent_message",
                        "agent": self.name,
                        "message": sanitize_text(response_text),
                        "turn": self.coordinator.turn_count,
                        "phase": self.coordinator.current_phase
                    })
                    
                    # Send milestone update if applicable
                    milestone = self._get_milestone_for_phase(self.coordinator.current_phase)
                    if milestone:
                        await self.websocket.send_json({
                            "type": "agent_update",
                            "agent": self.name,
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
                
                # Get final story from session
                story_content = story_session_manager.extract_story_from_draft(session_id)
                
                if story_content:
                    # Save story to database
                    try:
                        # Extract title from story (usually first line after #)
                        lines = story_content.split('\n')
                        title = "Untitled Story"
                        for line in lines:
                            if line.strip().startswith('#') and not line.strip().startswith('##'):
                                title = line.strip('#').strip()
                                break
                        
                        # Save to database with session reference
                        story_record = supabase.table("stories").insert({
                            "user_id": user_id,
                            "title": title,
                            "theme": ui_theme,
                            "protagonist_name": protagonist_name,
                            "content": story_content,
                            "session_id": session_id,  # Link to session
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
                        "session_id": session_id,
                        "message": "Story generation complete!"
                    })
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Story generation completed but no story found in session"
                    })
                    
            except Exception as e:
                # Mark session as failed
                if 'session_id' in locals():
                    await story_session_manager.fail_session(session_id, str(e))
                
                await websocket.send_json({
                    "type": "error",
                    "message": f"Error during story generation: {str(e)}"
                })
    
    except WebSocketDisconnect:
        del active_connections[str(connection_id)]
        print(f"Client {connection_id} disconnected")
        # Mark any active session as failed on disconnect
        if 'session_id' in locals():
            await story_session_manager.fail_session(session_id, "WebSocket disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        if str(connection_id) in active_connections:
            del active_connections[str(connection_id)]
        # Mark any active session as failed
        if 'session_id' in locals():
            await story_session_manager.fail_session(session_id, f"WebSocket error: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "active_connections": len(active_connections),
        "active_sessions": len(story_session_manager.active_sessions)
    }

@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    """Get information about a specific story generation session."""
    try:
        # Try to get from active sessions first
        session = story_session_manager.get_session(session_id)
        if session:
            return {
                "session_id": session_id,
                "status": session.status,
                "config": session.config,
                "current_version": session.current_version,
                "message_count": len(session.messages),
                "created_at": session.created_at.isoformat(),
                "updated_at": session.updated_at.isoformat()
            }
        
        # Try to recover from database
        session = await story_session_manager.recover_session(session_id)
        if session:
            return {
                "session_id": session_id,
                "status": session.status,
                "config": session.config,
                "current_version": session.current_version,
                "message_count": len(session.messages),
                "created_at": session.created_at.isoformat(),
                "updated_at": session.updated_at.isoformat()
            }
        
        return {"error": "Session not found"}, 404
        
    except Exception as e:
        return {"error": str(e)}, 500

@app.get("/api/sessions/{session_id}/story")
async def get_session_story(session_id: str):
    """Get the current story content from a session."""
    try:
        # Try to get from active sessions first
        session = story_session_manager.get_session(session_id)
        if not session:
            # Try to recover from database
            session = await story_session_manager.recover_session(session_id)
        
        if session:
            story_content = story_session_manager.extract_story_from_draft(session_id)
            if story_content:
                return {
                    "session_id": session_id,
                    "story": story_content,
                    "version": session.current_version,
                    "status": session.status
                }
            else:
                return {"error": "No story content found in session"}, 404
        
        return {"error": "Session not found"}, 404
        
    except Exception as e:
        return {"error": str(e)}, 500

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
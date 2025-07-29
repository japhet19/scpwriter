import asyncio
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
import os
import re
from openai import AsyncOpenAI
from dotenv import load_dotenv
from utils.text_sanitizer import sanitize_text

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class BaseAgent:
    """Base class for all agents in the SCP writer system using OpenRouter."""
    
    def __init__(self, name: str, system_prompt: str, orchestrator_callback=None, model: Optional[str] = None, api_key: Optional[str] = None):
        self.name = name
        self.system_prompt = system_prompt
        self.conversation_history: List[Dict[str, str]] = []
        self.logger = logging.getLogger(f"agent.{name}")
        self.orchestrator_callback = orchestrator_callback
        
        # Initialize OpenAI client with OpenRouter configuration
        # Use provided API key or fall back to environment variable
        self.client = AsyncOpenAI(
            api_key=api_key or os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://plotcraft.up.railway.app",
                "X-Title": "PlotCraft"
            }
        )
        
        # Use provided model or fall back to environment variable or default
        if model:
            self.model = model
        else:
            self.model = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")
        
    def _format_timestamp(self) -> str:
        """Generate a formatted timestamp for messages."""
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    def _read_discussion_file(self) -> str:
        """Read the current discussion file contents."""
        discussion_path = Path("discussions/story_discussion.md")
        if discussion_path.exists():
            return discussion_path.read_text(encoding='utf-8', errors='replace')
        return ""
    
    def _read_output_file(self) -> str:
        """Read the current story output file contents."""
        output_path = Path("output/story_output.md")
        if output_path.exists():
            return output_path.read_text(encoding='utf-8', errors='replace')
        return ""
    
    async def _append_to_discussion(self, message: str):
        """Append a message to the discussion file."""
        discussion_path = Path("discussions/story_discussion.md")
        timestamp = self._format_timestamp()
        
        # Sanitize the message before writing
        sanitized_message = sanitize_text(message)
        formatted_message = f"\n## [{self.name}] - [{timestamp}]\n{sanitized_message}\n---\n"
        
        with open(discussion_path, 'a', encoding='utf-8') as f:
            f.write(formatted_message)
        
        self.logger.info(f"Appended message to discussion file")
    
    def _build_messages(self, trigger_message: str, include_output: bool = False) -> List[Dict[str, str]]:
        """Build the message history for the API call."""
        messages = []
        
        # Add system prompt
        messages.append({
            "role": "system",
            "content": self.system_prompt
        })
        
        # Add conversation history
        for msg in self.conversation_history:
            messages.append(msg)
        
        # Build context from discussion and optionally output file
        discussion_content = self._read_discussion_file()
        context = f"Current discussion:\n{discussion_content}"
        
        if include_output:
            output_content = self._read_output_file()
            context += f"\n\nCurrent story output:\n{output_content}"
        
        # Create the user message with context and trigger
        user_content = f"""
{context}

The latest message triggering your response:
{trigger_message}

Based on your role and the current context, provide an appropriate response.
Remember to include the complete story text when sharing drafts or revisions.
Use ---BEGIN STORY--- and ---END STORY--- markers when sharing story content.
"""
        
        messages.append({
            "role": "user",
            "content": user_content
        })
        
        return messages
    
    async def respond(self, trigger_message: str, include_output: bool = False, skip_callback: bool = False, stream_output: bool = True) -> str:
        """
        Generate a response based on the trigger message and current context.
        
        Args:
            trigger_message: The message that triggered this response
            include_output: Whether to include the story output file in context
            skip_callback: Whether to skip triggering the orchestrator callback
            stream_output: Whether to print response in real-time as it streams
            
        Returns:
            The agent's response
        """
        try:
            # Build messages for the API call
            messages = self._build_messages(trigger_message, include_output)
            
            # Print agent name if streaming
            if stream_output:
                print(f"\n{self.name}: ", end="", flush=True)
            
            response_text = ""
            
            # Make the API call with streaming
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True,
                temperature=0.7,
                max_tokens=4000
            )
            
            # Process the stream
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    text = chunk.choices[0].delta.content
                    if stream_output:
                        print(text, end="", flush=True)
                    response_text += text
            
            if stream_output:
                print()  # New line after streaming completes
            
            # Clean up response text
            response_text = response_text.strip()
            
            # Add to conversation history
            self.conversation_history.append({
                "role": "user",
                "content": trigger_message
            })
            self.conversation_history.append({
                "role": "assistant",
                "content": response_text
            })
            
            # Limit conversation history to prevent token overflow
            # Keep system prompt + last 10 exchanges (20 messages)
            if len(self.conversation_history) > 20:
                self.conversation_history = self.conversation_history[-20:]
            
            # Log the interaction
            self.logger.info(f"Generated response of {len(response_text)} characters")
            
            # Only write non-empty responses to discussion file
            if response_text:
                await self._append_to_discussion(response_text)
                
                # Notify orchestrator if callback is set and not skipped
                if self.orchestrator_callback and not skip_callback:
                    await self.orchestrator_callback(self.name, response_text)
            
            return response_text
            
        except Exception as e:
            self.logger.error(f"Error generating response: {e}")
            raise
    
    async def respond_streaming(self, trigger_message: str, include_output: bool = False, skip_callback: bool = False):
        """
        Generate a streaming response based on the trigger message and current context.
        Yields chunks of text as they arrive from the API.
        
        Args:
            trigger_message: The message that triggered this response
            include_output: Whether to include the story output file in context
            skip_callback: Whether to skip triggering the orchestrator callback
            
        Yields:
            Text chunks as they arrive
        """
        try:
            # Build messages for the API call
            messages = self._build_messages(trigger_message, include_output)
            
            # Make the API call with streaming
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True,
                temperature=0.7,
                max_tokens=4000
            )
            
            response_text = ""
            
            # Process and yield chunks
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    text = chunk.choices[0].delta.content
                    response_text += text
                    yield text
            
            # Clean up response text
            response_text = response_text.strip()
            
            # Add to conversation history
            self.conversation_history.append({
                "role": "user",
                "content": trigger_message
            })
            self.conversation_history.append({
                "role": "assistant",
                "content": response_text
            })
            
            # Limit conversation history to prevent token overflow
            if len(self.conversation_history) > 20:
                self.conversation_history = self.conversation_history[-20:]
            
            # Log the interaction
            self.logger.info(f"Generated streaming response of {len(response_text)} characters")
            
            # Only write non-empty responses to discussion file
            if response_text:
                await self._append_to_discussion(response_text)
                
                # Notify orchestrator if callback is set and not skipped
                if self.orchestrator_callback and not skip_callback:
                    await self.orchestrator_callback(self.name, response_text)
            
        except Exception as e:
            self.logger.error(f"Error generating streaming response: {e}")
            raise
    
    async def continue_session(self, new_prompt: str) -> str:
        """Continue the conversation with a new prompt."""
        # Since we maintain conversation history, this is just a regular respond call
        return await self.respond(new_prompt)
    
    def get_conversation_summary(self) -> Dict[str, Any]:
        """Get a summary of the agent's conversation history."""
        return {
            "agent_name": self.name,
            "model": self.model,
            "message_count": len(self.conversation_history),
            "history": self.conversation_history
        }
"""Session Manager for handling story generation sessions with Supabase backend."""
import asyncio
import json
import logging
from typing import Dict, Optional, List, Any
from datetime import datetime, timedelta, timezone
from uuid import uuid4
import re

from supabase import Client

logger = logging.getLogger(__name__)


class StorySession:
    """Represents an active story generation session."""
    
    def __init__(self, session_id: str, user_id: str, config: dict):
        self.id = session_id
        self.user_id = user_id
        self.config = config
        self.status = "active"
        self.drafts: List[dict] = []
        self.messages: List[dict] = []
        self.current_draft = ""
        self.current_version = 0
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)
        
    def to_dict(self) -> dict:
        """Convert session to dictionary for storage."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "config": self.config,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


class StorySessionManager:
    """Manages story generation sessions with Supabase persistence."""
    
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
        self.active_sessions: Dict[str, StorySession] = {}
        self._cleanup_task = None
        
    async def create_session(self, user_id: str, config: dict) -> str:
        """Create a new story generation session."""
        session_id = str(uuid4())
        
        # Create session in database
        try:
            result = self.supabase.table("story_sessions").insert({
                "id": session_id,
                "user_id": user_id,
                "config": config,
                "status": "active",
                "expires_at": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
            }).execute()
            
            # Create in-memory session
            session = StorySession(session_id, user_id, config)
            self.active_sessions[session_id] = session
            
            logger.info(f"Created session {session_id} for user {user_id}")
            return session_id
            
        except Exception as e:
            logger.error(f"Failed to create session: {e}")
            raise
    
    def get_session(self, session_id: str) -> Optional[StorySession]:
        """Get an active session by ID."""
        return self.active_sessions.get(session_id)
    
    async def save_draft(self, session_id: str, content: str, metadata: Optional[dict] = None) -> int:
        """Save a new draft version for the session."""
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        # Increment version
        session.current_version += 1
        session.current_draft = content
        session.updated_at = datetime.now(timezone.utc)
        
        # Save to database
        try:
            draft_data = {
                "session_id": session_id,
                "version": session.current_version,
                "content": content,
                "agent_feedback": metadata or {}
            }
            
            result = self.supabase.table("session_drafts").insert(draft_data).execute()
            
            # Update in-memory
            session.drafts.append(draft_data)
            
            # Update session updated_at
            self.supabase.table("story_sessions").update({
                "updated_at": session.updated_at.isoformat()
            }).eq("id", session_id).execute()
            
            logger.info(f"Saved draft v{session.current_version} for session {session_id}")
            return session.current_version
            
        except Exception as e:
            logger.error(f"Failed to save draft: {e}")
            raise
    
    def get_latest_draft(self, session_id: str) -> Optional[str]:
        """Get the latest draft content for a session."""
        session = self.get_session(session_id)
        if not session:
            return None
        return session.current_draft
    
    def extract_story_from_draft(self, session_id: str) -> Optional[str]:
        """Extract story content from draft between markers."""
        draft = self.get_latest_draft(session_id)
        if not draft:
            return None
            
        # Find story between markers
        pattern = r'---BEGIN STORY---\s*(.*?)\s*---END STORY---'
        matches = re.findall(pattern, draft, re.DOTALL)
        
        if matches:
            # Return the last (most recent) story
            return matches[-1].strip()
        
        return None
    
    async def save_message(self, session_id: str, agent_name: str, message: str, 
                          turn: int, phase: Optional[str] = None) -> None:
        """Save an agent message to the session."""
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        try:
            message_data = {
                "session_id": session_id,
                "agent_name": agent_name,
                "message": message,
                "turn": turn,
                "phase": phase
            }
            
            result = self.supabase.table("session_messages").insert(message_data).execute()
            
            # Update in-memory
            session.messages.append(message_data)
            session.updated_at = datetime.now(timezone.utc)
            
            logger.info(f"Saved message from {agent_name} (turn {turn}) for session {session_id}")
            
        except Exception as e:
            logger.error(f"Failed to save message: {e}")
            raise
    
    async def complete_session(self, session_id: str, final_story: str) -> None:
        """Mark a session as completed with the final story."""
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        try:
            # Update session status
            session.status = "completed"
            completed_at = datetime.now(timezone.utc)
            
            self.supabase.table("story_sessions").update({
                "status": "completed",
                "completed_at": completed_at.isoformat(),
                "updated_at": completed_at.isoformat()
            }).eq("id", session_id).execute()
            
            # Save final draft
            await self.save_draft(session_id, final_story, {"is_final": True})
            
            logger.info(f"Completed session {session_id}")
            
            # Remove from active sessions after a delay
            asyncio.create_task(self._remove_session_after_delay(session_id, 300))  # 5 minutes
            
        except Exception as e:
            logger.error(f"Failed to complete session: {e}")
            raise
    
    async def fail_session(self, session_id: str, error: str) -> None:
        """Mark a session as failed."""
        session = self.get_session(session_id)
        if not session:
            return
        
        try:
            session.status = "failed"
            
            self.supabase.table("story_sessions").update({
                "status": "failed",
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "config": {**session.config, "error": error}
            }).eq("id", session_id).execute()
            
            logger.info(f"Failed session {session_id}: {error}")
            
            # Remove from active sessions
            del self.active_sessions[session_id]
            
        except Exception as e:
            logger.error(f"Failed to mark session as failed: {e}")
    
    async def recover_session(self, session_id: str) -> Optional[StorySession]:
        """Recover a session from database."""
        try:
            # Get session from database
            result = self.supabase.table("story_sessions").select("*").eq("id", session_id).execute()
            
            if not result.data:
                return None
            
            session_data = result.data[0]
            
            # Check if session is expired
            expires_at = datetime.fromisoformat(session_data["expires_at"].replace("Z", "+00:00"))
            if expires_at < datetime.now(timezone.utc):
                logger.warning(f"Session {session_id} has expired")
                return None
            
            # Create session object
            session = StorySession(
                session_id,
                session_data["user_id"],
                session_data["config"]
            )
            session.status = session_data["status"]
            
            # Load drafts
            drafts_result = self.supabase.table("session_drafts").select("*").eq(
                "session_id", session_id
            ).order("version", desc=False).execute()
            
            if drafts_result.data:
                session.drafts = drafts_result.data
                last_draft = drafts_result.data[-1]
                session.current_draft = last_draft["content"]
                session.current_version = last_draft["version"]
            
            # Load messages
            messages_result = self.supabase.table("session_messages").select("*").eq(
                "session_id", session_id
            ).order("turn", desc=False).execute()
            
            if messages_result.data:
                session.messages = messages_result.data
            
            # Add to active sessions
            self.active_sessions[session_id] = session
            
            logger.info(f"Recovered session {session_id}")
            return session
            
        except Exception as e:
            logger.error(f"Failed to recover session: {e}")
            return None
    
    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions from database."""
        try:
            # Update expired sessions
            result = self.supabase.table("story_sessions").update({
                "status": "expired",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }).eq("status", "active").lt("expires_at", datetime.now(timezone.utc).isoformat()).execute()
            
            expired_count = len(result.data) if result.data else 0
            
            if expired_count > 0:
                logger.info(f"Marked {expired_count} sessions as expired")
            
            # Remove expired sessions from memory
            expired_in_memory = []
            for session_id, session in self.active_sessions.items():
                if session.status == "expired" or (
                    session.created_at + timedelta(hours=2) < datetime.now(timezone.utc)
                ):
                    expired_in_memory.append(session_id)
            
            for session_id in expired_in_memory:
                del self.active_sessions[session_id]
            
            return expired_count
            
        except Exception as e:
            logger.error(f"Failed to cleanup expired sessions: {e}")
            return 0
    
    async def _remove_session_after_delay(self, session_id: str, delay: int) -> None:
        """Remove a session from memory after a delay."""
        await asyncio.sleep(delay)
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
            logger.info(f"Removed session {session_id} from memory")
    
    async def start_cleanup_task(self) -> None:
        """Start the periodic cleanup task."""
        async def cleanup_loop():
            while True:
                try:
                    await asyncio.sleep(1800)  # Run every 30 minutes
                    await self.cleanup_expired_sessions()
                except Exception as e:
                    logger.error(f"Error in cleanup task: {e}")
        
        self._cleanup_task = asyncio.create_task(cleanup_loop())
    
    async def stop_cleanup_task(self) -> None:
        """Stop the cleanup task."""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
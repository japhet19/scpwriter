"""
Story management API endpoints for PlotCraft
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import json
from supabase import create_client, Client
from jose import jwt
import os

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_ANON_KEY"))
supabase: Client = create_client(supabase_url, supabase_key)

router = APIRouter(prefix="/api/stories", tags=["stories"])
security = HTTPBearer()

# Pydantic models
class StoryResponse(BaseModel):
    id: int
    title: str
    theme: str
    protagonist_name: Optional[str]
    content: str
    agent_logs: Optional[Dict[str, Any]]
    tokens_used: Optional[int]
    model_used: Optional[str]
    is_public: bool
    created_at: datetime
    updated_at: datetime
    session_id: Optional[str]
    word_count: int
    preview: str

class StoryListItem(BaseModel):
    id: int
    title: str
    theme: str
    protagonist_name: Optional[str]
    tokens_used: Optional[int]
    model_used: Optional[str]
    created_at: datetime
    updated_at: datetime
    session_id: Optional[str]
    word_count: int
    preview: str

class StoryUpdateRequest(BaseModel):
    title: Optional[str] = None
    is_public: Optional[bool] = None

class StoriesListResponse(BaseModel):
    stories: List[StoryListItem]
    total_count: int
    page: int
    page_size: int
    has_next: bool

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract user ID from JWT token"""
    try:
        token = credentials.credentials
        print(f"[DEBUG] Received token: {token[:50]}...") # Log first 50 chars for debugging
        payload = jwt.get_unverified_claims(token)
        print(f"[DEBUG] Token payload: {payload}")
        user_id = payload.get("sub")
        print(f"[DEBUG] Extracted user_id: {user_id}")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except Exception as e:
        print(f"[DEBUG] Token validation error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

def calculate_word_count(content: str) -> int:
    """Calculate approximate word count"""
    if not content or not isinstance(content, str):
        return 0
    try:
        return len(content.split())
    except Exception:
        return 0

def create_preview(content: str, max_length: int = 150) -> str:
    """Create a preview snippet from story content"""
    if not content or not isinstance(content, str):
        return ""
    
    try:
        # Remove markdown formatting and get clean text
        preview = content.replace("---BEGIN STORY---", "").replace("---END STORY---", "")
        preview = preview.replace("#", "").replace("*", "").replace("_", "")
        preview = " ".join(preview.split())  # Normalize whitespace
        
        if len(preview) <= max_length:
            return preview
        
        # Truncate at word boundary
        truncated = preview[:max_length]
        last_space = truncated.rfind(" ")
        if last_space > 0:
            truncated = truncated[:last_space]
        
        return truncated + "..."
    except Exception:
        return "Preview unavailable"

@router.get("", response_model=StoriesListResponse)
async def list_stories(
    user_id: str = Depends(get_current_user_id),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    theme: Optional[str] = Query(None, description="Filter by theme"),
    search: Optional[str] = Query(None, description="Search in title and content"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)")
):
    """List user's stories with pagination and filtering"""
    try:
        print(f"[DEBUG] Fetching stories for user: {user_id}")
        
        # Build query
        query = supabase.table("stories").select("*").eq("user_id", user_id)
        
        # Apply filters
        if theme:
            query = query.eq("theme", theme)
            print(f"[DEBUG] Applied theme filter: {theme}")
        
        if search:
            query = query.or_(f"title.ilike.%{search}%,content.ilike.%{search}%")
            print(f"[DEBUG] Applied search filter: {search}")
        
        # Apply sorting - fix the sort order syntax
        ascending = sort_order.lower() == "asc"
        query = query.order(sort_by, desc=not ascending)
        print(f"[DEBUG] Applied sorting: {sort_by} {sort_order}")
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.range(offset, offset + page_size - 1)
        print(f"[DEBUG] Applied pagination: offset={offset}, limit={page_size}")
        
        # Execute query
        response = query.execute()
        stories_data = response.data or []
        print(f"[DEBUG] Retrieved {len(stories_data)} stories from database")
        
        # Convert to response format
        stories = []
        for i, story in enumerate(stories_data):
            try:
                print(f"[DEBUG] Processing story {i+1}: ID={story.get('id')}, title='{story.get('title')}'")
                
                # Safe field extraction with defaults
                content = story.get("content") or ""
                title = story.get("title") or "Untitled Story"
                theme_val = story.get("theme") or ""
                protagonist_name = story.get("protagonist_name")
                tokens_used = story.get("tokens_used")
                model_used = story.get("model_used")
                session_id = story.get("session_id")
                
                # Safe datetime handling
                created_at = story.get("created_at")
                updated_at = story.get("updated_at")
                
                print(f"[DEBUG] Story {i+1} - content length: {len(content)}")
                
                # Calculate word count and preview safely
                word_count = calculate_word_count(content)
                preview = create_preview(content)
                
                print(f"[DEBUG] Story {i+1} - calculated word_count: {word_count}")
                
                story_item = StoryListItem(
                    id=story["id"],
                    title=title,
                    theme=theme_val,
                    protagonist_name=protagonist_name,
                    tokens_used=tokens_used,
                    model_used=model_used,
                    created_at=created_at,
                    updated_at=updated_at,
                    session_id=session_id,
                    word_count=word_count,
                    preview=preview
                )
                
                stories.append(story_item)
                print(f"[DEBUG] Story {i+1} successfully processed")
                
            except Exception as story_error:
                print(f"[ERROR] Failed to process story {i+1}: {story_error}")
                print(f"[ERROR] Story data: {story}")
                import traceback
                print(f"[ERROR] Story processing traceback: {traceback.format_exc()}")
                # Continue processing other stories
                continue
        
        print(f"[DEBUG] Successfully processed {len(stories)} stories")
        
        # Get total count for pagination (separate query)
        try:
            count_query = supabase.table("stories").select("id", count="exact").eq("user_id", user_id)
            if theme:
                count_query = count_query.eq("theme", theme)
            if search:
                count_query = count_query.or_(f"title.ilike.%{search}%,content.ilike.%{search}%")
            
            count_response = count_query.execute()
            total_count = count_response.count or 0
            has_next = offset + page_size < total_count
            print(f"[DEBUG] Total count: {total_count}, has_next: {has_next}")
        except Exception as count_error:
            print(f"[ERROR] Failed to get total count: {count_error}")
            total_count = len(stories_data)  # Fallback to current data length
            has_next = False
        
        response_data = StoriesListResponse(
            stories=stories,
            total_count=total_count,
            page=page,
            page_size=page_size,
            has_next=has_next
        )
        
        print(f"[DEBUG] Returning response with {len(stories)} stories")
        return response_data
        
    except Exception as e:
        print(f"[ERROR] Failed to fetch stories: {str(e)}")
        print(f"[ERROR] Exception type: {type(e)}")
        import traceback
        print(f"[ERROR] Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch stories: {str(e)}")

@router.get("/{story_id}", response_model=StoryResponse)
async def get_story(
    story_id: int,
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific story by ID"""
    try:
        result = supabase.table("stories").select("*").eq("id", story_id).eq("user_id", user_id).single().execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Story not found")
        
        story = result.data
        word_count = calculate_word_count(story.get("content", ""))
        preview = create_preview(story.get("content", ""))
        
        return StoryResponse(
            id=story["id"],
            title=story["title"],
            theme=story["theme"],
            protagonist_name=story.get("protagonist_name"),
            content=story["content"],
            agent_logs=story.get("agent_logs"),
            tokens_used=story.get("tokens_used"),
            model_used=story.get("model_used"),
            is_public=story.get("is_public", False),
            created_at=story["created_at"],
            updated_at=story["updated_at"],
            session_id=story.get("session_id"),
            word_count=word_count,
            preview=preview
        )
        
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Story not found")
        raise HTTPException(status_code=500, detail=f"Failed to fetch story: {str(e)}")

@router.put("/{story_id}")
async def update_story(
    story_id: int,
    update_data: StoryUpdateRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Update story metadata (title, public status)"""
    try:
        # Verify story belongs to user
        story_check = supabase.table("stories").select("id").eq("id", story_id).eq("user_id", user_id).single().execute()
        if not story_check.data:
            raise HTTPException(status_code=404, detail="Story not found")
        
        # Build update data
        update_dict = {}
        if update_data.title is not None:
            update_dict["title"] = update_data.title
        if update_data.is_public is not None:
            update_dict["is_public"] = update_data.is_public
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        update_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("stories").update(update_dict).eq("id", story_id).eq("user_id", user_id).execute()
        
        return {"message": "Story updated successfully", "updated_fields": list(update_dict.keys())}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update story: {str(e)}")

@router.delete("/{story_id}")
async def delete_story(
    story_id: int,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a story"""
    try:
        # Verify story belongs to user
        story_check = supabase.table("stories").select("id").eq("id", story_id).eq("user_id", user_id).single().execute()
        if not story_check.data:
            raise HTTPException(status_code=404, detail="Story not found")
        
        # Delete the story
        result = supabase.table("stories").delete().eq("id", story_id).eq("user_id", user_id).execute()
        
        return {"message": "Story deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete story: {str(e)}")

@router.get("/themes/stats")
async def get_theme_stats(user_id: str = Depends(get_current_user_id)):
    """Get story count by theme for the user"""
    try:
        result = supabase.table("stories").select("theme").eq("user_id", user_id).execute()
        
        theme_counts = {}
        for story in result.data:
            theme = story.get("theme", "unknown")
            theme_counts[theme] = theme_counts.get(theme, 0) + 1
        
        return {
            "total_stories": len(result.data),
            "themes": theme_counts
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch theme stats: {str(e)}")
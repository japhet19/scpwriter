"""
Authentication and OpenRouter OAuth endpoints
"""
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import Optional
import httpx
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv(Path(__file__).parent / '.env')
from jose import jwt, JWTError
from datetime import datetime

from utils.encryption import encryptor

router = APIRouter(prefix="/auth", tags=["authentication"])

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_ANON_KEY"))  # Fallback to anon key
supabase: Client = create_client(supabase_url, supabase_key)

class OpenRouterCallback(BaseModel):
    code: str
    code_verifier: str

class OpenRouterKeyResponse(BaseModel):
    success: bool
    message: str

async def get_current_user(authorization: Optional[str] = Header(None)):
    """Extract user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Decode the Supabase JWT
        # Note: In production, verify the JWT signature properly
        payload = jwt.get_unverified_claims(token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/openrouter/callback", response_model=OpenRouterKeyResponse)
async def openrouter_callback(
    data: OpenRouterCallback,
    user_id: str = Depends(get_current_user)
):
    """Exchange OpenRouter authorization code for API key"""
    try:
        # Exchange code for API key with OpenRouter
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/auth/keys",
                json={
                    "code": data.code,
                    "code_verifier": data.code_verifier
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to exchange code: {response.text}"
                )
            
            result = response.json()
            api_key = result.get("key")
            
            if not api_key:
                raise HTTPException(
                    status_code=400,
                    detail="No API key returned from OpenRouter"
                )
        
        # Encrypt the API key
        encrypted_key = encryptor.encrypt_api_key(api_key)
        key_hint = encryptor.get_key_hint(api_key)
        
        # Check if user already has a key
        existing = supabase.table("user_api_keys").select("id").eq("user_id", user_id).eq("provider", "openrouter").execute()
        
        if existing.data:
            # Update existing key
            supabase.table("user_api_keys").update({
                "encrypted_key": encrypted_key,
                "key_hint": key_hint,
                "is_active": True,
                "last_used_at": datetime.utcnow().isoformat()
            }).eq("user_id", user_id).eq("provider", "openrouter").execute()
        else:
            # Insert new key
            supabase.table("user_api_keys").insert({
                "user_id": user_id,
                "provider": "openrouter",
                "encrypted_key": encrypted_key,
                "key_hint": key_hint,
                "is_active": True
            }).execute()
        
        return OpenRouterKeyResponse(
            success=True,
            message="OpenRouter account connected successfully"
        )
        
    except Exception as e:
        print(f"Error in OpenRouter callback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class StoreKeyRequest(BaseModel):
    api_key: str

@router.post("/openrouter/store-key", response_model=OpenRouterKeyResponse)
async def store_openrouter_key(
    data: StoreKeyRequest,
    user_id: str = Depends(get_current_user)
):
    """Store an OpenRouter API key for the user"""
    try:
        # Encrypt the API key
        encrypted_key = encryptor.encrypt_api_key(data.api_key)
        key_hint = encryptor.get_key_hint(data.api_key)
        
        # Check if user already has a key
        existing = supabase.table("user_api_keys").select("id").eq("user_id", user_id).eq("provider", "openrouter").execute()
        
        if existing.data:
            # Update existing key
            supabase.table("user_api_keys").update({
                "encrypted_key": encrypted_key,
                "key_hint": key_hint,
                "is_active": True,
                "last_used_at": datetime.utcnow().isoformat()
            }).eq("user_id", user_id).eq("provider", "openrouter").execute()
        else:
            # Insert new key
            supabase.table("user_api_keys").insert({
                "user_id": user_id,
                "provider": "openrouter",
                "encrypted_key": encrypted_key,
                "key_hint": key_hint,
                "is_active": True
            }).execute()
        
        return OpenRouterKeyResponse(
            success=True,
            message="OpenRouter API key stored successfully"
        )
        
    except Exception as e:
        print(f"Error storing OpenRouter key: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check-key")
async def check_openrouter_key(user_id: str = Depends(get_current_user)):
    """Check if user has an active OpenRouter key"""
    try:
        result = supabase.table("user_api_keys").select("id, is_active, key_hint").eq("user_id", user_id).eq("provider", "openrouter").execute()
        
        if result.data and result.data[0]["is_active"]:
            return {
                "has_key": True,
                "key_hint": result.data[0]["key_hint"]
            }
        else:
            return {"has_key": False}
            
    except Exception as e:
        print(f"Error checking key: {e}")
        return {"has_key": False}

@router.delete("/openrouter/key", response_model=OpenRouterKeyResponse)
async def unlink_openrouter(
    user_id: str = Depends(get_current_user)
):
    """Unlink OpenRouter account by deactivating the stored API key"""
    try:
        print(f"Unlinking OpenRouter for user: {user_id}")
        
        # First, check if user has an active key
        check_result = supabase.table("user_api_keys").select("*").eq("user_id", user_id).eq("provider", "openrouter").eq("is_active", True).execute()
        print(f"Active keys found: {len(check_result.data) if check_result.data else 0}")
        
        # Find and deactivate the user's OpenRouter key
        result = supabase.table("user_api_keys").update({
            "is_active": False
        }).eq("user_id", user_id).eq("provider", "openrouter").eq("is_active", True).execute()
        
        print(f"Update result: {result.data}")
        
        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="No active OpenRouter key found for this user"
            )
        
        return OpenRouterKeyResponse(
            success=True,
            message="OpenRouter account unlinked successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to unlink OpenRouter account: {str(e)}")
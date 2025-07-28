"""
Encryption utilities for API keys
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from cryptography.fernet import Fernet
from typing import Optional

# Load environment variables
load_dotenv(Path(__file__).parent.parent / '.env')

class APIKeyEncryption:
    def __init__(self):
        # Get or generate encryption key
        encryption_key = os.getenv('ENCRYPTION_KEY')
        if not encryption_key:
            # Generate a new key if none exists (for development)
            encryption_key = Fernet.generate_key().decode()
            print(f"WARNING: No ENCRYPTION_KEY found. Generated temporary key: {encryption_key}")
            print("Please add this to your .env file for production")
        
        # Ensure the key is properly formatted
        if isinstance(encryption_key, str):
            encryption_key = encryption_key.encode()
        
        self.fernet = Fernet(encryption_key)
    
    def encrypt_api_key(self, api_key: str) -> str:
        """Encrypt an API key"""
        return self.fernet.encrypt(api_key.encode()).decode()
    
    def decrypt_api_key(self, encrypted_key: str) -> str:
        """Decrypt an API key"""
        return self.fernet.decrypt(encrypted_key.encode()).decode()
    
    def get_key_hint(self, api_key: str) -> str:
        """Get last 4 characters of key for display"""
        return f"****{api_key[-4:]}" if len(api_key) > 4 else "****"

# Global instance
encryptor = APIKeyEncryption()
"""Base theme class for story themes."""

from typing import Dict, Optional
from dataclasses import dataclass


@dataclass
class AgentPersona:
    """Defines an agent's personality and role in a theme."""
    name: str
    role_description: str
    communication_style: str
    focus_areas: list[str]
    terminology: Dict[str, str]  # Theme-specific terminology


@dataclass
class UITheme:
    """Visual theme configuration for the frontend."""
    id: str
    name: str
    main_title: str
    tagline: str
    status_text: str
    boot_messages: list[str]
    colors: Dict[str, str]
    fonts: Dict[str, str]
    effects: list[str]
    background_type: str


class StoryTheme:
    """Base class for story themes."""
    
    def __init__(self):
        self.id: str = ""
        self.name: str = ""
        self.description: str = ""
        self.story_format: str = ""
        
        # Agent configurations
        self.writer: AgentPersona = None
        self.reader: AgentPersona = None
        self.expert: AgentPersona = None
        
        # UI configuration
        self.ui_theme: UITheme = None
        
        # Common terminology mappings
        self.terminology: Dict[str, str] = {}
        
    def get_writer_prompt(self, user_request: str, story_config) -> str:
        """Generate the writer agent prompt for this theme."""
        raise NotImplementedError
        
    def get_reader_prompt(self, user_request: str, story_config) -> str:
        """Generate the reader agent prompt for this theme."""
        raise NotImplementedError
        
    def get_expert_prompt(self, user_request: str, story_config) -> str:
        """Generate the expert agent prompt for this theme."""
        raise NotImplementedError
        
    def translate_term(self, term: str) -> str:
        """Translate a term to theme-specific vocabulary."""
        return self.terminology.get(term, term)
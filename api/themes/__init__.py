# Story Themes Package
"""
This package contains theme configurations for different story genres.
Each theme includes:
- Agent personalities and prompts
- UI visual design elements
- Terminology mappings
- Story format specifications
"""

from .base_theme import StoryTheme, AgentPersona
from .scp_theme import SCPTheme
from .fantasy_theme import FantasyTheme
from .cyberpunk_theme import CyberpunkTheme
from .romance_theme import RomanceTheme
from .noir_theme import NoirTheme
from .scifi_theme import SciFiTheme

# Theme registry
THEMES = {
    "scp": SCPTheme(),
    "fantasy": FantasyTheme(),
    "cyberpunk": CyberpunkTheme(),
    "romance": RomanceTheme(),
    "noir": NoirTheme(),
    "scifi": SciFiTheme(),
}

def get_theme(theme_id: str) -> StoryTheme:
    """Get a theme by its ID."""
    return THEMES.get(theme_id, THEMES["scp"])
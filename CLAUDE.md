# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PlotCraft (formerly SCP Writer) is a multi-agent story writing system that uses three specialized AI agents to collaboratively write narrative stories. The system supports multiple themes (SCP, Fantasy, Romance, Cyberpunk, Noir, Sci-Fi) and integrates with OpenRouter for AI model access and Supabase for authentication and data persistence.

## Development Commands

### Backend Development
```bash
# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r api/requirements.txt

# Start backend API (FastAPI with WebSocket support)
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
# OR use the helper script:
./start_backend.sh

# Run tests
python test_session_integration.py
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# OR use the helper script (from root):
./start_frontend.sh

# Build for production
npm run build

# Run linting
npm run lint
```

### Environment Setup
Create `.env` files in both root and `api/` directories with required keys:
- `OPENROUTER_API_KEY` - Required for AI model access
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service key (backend only)
- `ENCRYPTION_KEY` - For encrypting user API keys

## Architecture Overview

### Session-Based Architecture
The system uses a session-based architecture (migrated from file-based) for multi-user support:

1. **Story Sessions**: Each story generation creates a unique session (UUID) stored in Supabase
2. **Session Manager** (`utils/story_session_manager.py`): Handles session lifecycle, draft storage, and message persistence
3. **Agent Communication**: Agents communicate through session storage instead of files
4. **Session Recovery**: Stories can be retrieved using session ID even after disconnect

### Core Components

#### Backend (`api/`)
- **FastAPI WebSocket Server** (`api/main.py`): Handles real-time communication with frontend
- **Session Coordinator** (`scp_coordinator_session.py`): Orchestrates agent interactions using sessions
- **Agent System** (`agents/base_agent.py`): Base class for AI agents with OpenRouter integration
- **Authentication** (`api/auth.py`): Supabase auth and OpenRouter key management

#### Frontend (`frontend/`)
- **Next.js App Router**: React 19 with TypeScript
- **WebSocket Hook** (`hooks/useWebSocket.ts`): Manages real-time connection and message streaming
- **Theme System** (`themes/`, `contexts/ThemeContext.tsx`): Dynamic theming for different story genres
- **Terminal UI**: Custom CSS modules for authentic terminal aesthetic

#### Agent System
Three specialized agents collaborate on stories:
1. **Writer**: Creates story outlines and drafts
2. **Reader**: Reviews for quality, coherence, and word count
3. **Expert**: Arbitrates disagreements and ensures technical accuracy

### Database Schema (Supabase)
- `story_sessions`: Active generation sessions
- `session_drafts`: Story versions with agent feedback
- `session_messages`: Complete conversation history
- `stories`: Final stories linked to sessions
- `user_api_keys`: Encrypted OpenRouter API keys
- `profiles`: User profiles

### Key Workflows

1. **Story Generation Flow**:
   - User authenticates and connects OpenRouter account
   - WebSocket connection established with session creation
   - Agents collaborate through multiple drafts
   - Story saved to database with session reference
   - Session ID displayed for future retrieval

2. **Agent Communication Pattern**:
   - Agents use `[@AgentName]` to pass control
   - Story drafts wrapped in `---BEGIN STORY---` / `---END STORY---` markers
   - Checkpoints at 1/3 and 2/3 progress for pacing adjustments

3. **Theme Support**:
   - Each theme has custom agent personalities and terminology
   - UI dynamically adjusts colors, fonts, and animations
   - Background components provide immersive visuals

## Important Implementation Details

### WebSocket Message Types
- `auth`: Initial authentication
- `session_created`: New session ID
- `agent_message`: Complete agent response
- `agent_stream_chunk`: Streaming text chunk
- `agent_update`: State changes (thinking/writing/waiting)
- `completed`: Story generation finished
- `error`: Error messages

### Session Management
- Sessions expire after 2 hours
- Automatic cleanup task runs every 30 minutes
- In-memory cache for active sessions
- Database persistence for recovery

### Theme Configuration
Each theme defines:
- Agent names and personalities
- UI colors and styles
- Background visuals
- Terminology translations (e.g., "anomaly" → "enchantment" for fantasy)

### Security Considerations
- User API keys encrypted before storage
- Row-level security (RLS) on all Supabase tables
- Session isolation ensures user data privacy
- Service key only used server-side

## Testing Approach
- `test_session_integration.py`: Validates session-based architecture
- Manual testing through UI for agent interactions
- Check Supabase dashboard for data persistence
- Monitor WebSocket messages in browser DevTools
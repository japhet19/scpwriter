# Railway Deployment Guide

This project has been restructured for deployment on Railway with separate frontend and backend services.

## Project Structure

```
/
├── api/                    # Backend API (FastAPI)
│   ├── agents/            # Agent system
│   ├── themes/            # Story themes
│   ├── utils/             # Utilities
│   ├── main.py            # Main API server
│   ├── auth.py            # Authentication
│   ├── requirements.txt   # Python dependencies
│   ├── railway.json       # Railway configuration
│   └── .env.example       # Environment variables template
│
├── frontend/              # Frontend (Next.js)
│   ├── src/              # Source code
│   ├── public/           # Static assets
│   ├── package.json      # Node dependencies
│   ├── railway.json      # Railway configuration
│   └── .env.example      # Environment variables template
│
└── utils/                # Shared utilities (not deployed)
```

## Deployment Steps

### 1. Backend API Deployment

1. Create a new Railway project
2. Create a new service from the `api` directory
3. Set the root directory to `/api`
4. Configure environment variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   ENCRYPTION_KEY=your_32_byte_hex_key
   ALLOWED_ORIGINS=https://your-frontend-url.railway.app
   ```
5. Deploy the service
6. Note the deployed API URL

### 2. Frontend Deployment

1. In the same Railway project, create another service
2. Create a new service from the `frontend` directory
3. Set the root directory to `/frontend`
4. Configure environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-api-url.railway.app
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
5. Deploy the service

### 3. Post-Deployment Configuration

1. Update the backend's `ALLOWED_ORIGINS` to include your frontend URL
2. Configure custom domains if needed
3. Set up monitoring and logging

## Key Changes Made

1. **Moved all backend dependencies into `/api`**:
   - `scp_coordinator_session.py`
   - `agents/` directory
   - `themes/` directory
   - Required `utils/` files

2. **Updated all import paths** to use `api.` prefix

3. **Created deployment configurations**:
   - `api/railway.json` for backend
   - `frontend/railway.json` for frontend

4. **Made URLs configurable**:
   - Frontend uses `NEXT_PUBLIC_API_URL` environment variable
   - Backend uses `ALLOWED_ORIGINS` for CORS

5. **Removed file-based dependencies**:
   - System now uses Supabase for all data persistence
   - No shared file system required between instances

## Environment Variables

### Backend (API)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_KEY`: Supabase service key (backend only)
- `ENCRYPTION_KEY`: 32-byte hex key for encrypting user API keys
- `ALLOWED_ORIGINS`: Comma-separated list of allowed frontend URLs
- `PORT`: (Set automatically by Railway)

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

## Testing Locally

1. Backend:
   ```bash
   cd api
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Notes

- The system is now fully session-based and multi-user ready
- All story generation happens through WebSocket connections
- User API keys are encrypted before storage
- Sessions are automatically cleaned up after 2 hours
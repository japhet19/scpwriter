#!/bin/bash

echo "Starting PlotCraft Local Test Setup"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend setup
echo -e "${YELLOW}Setting up Backend API...${NC}"
cd api

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}Please edit api/.env with your actual values${NC}"
fi

echo "Installing Python dependencies..."
cd ..
source venv/bin/activate
pip install -r api/requirements.txt

echo -e "${GREEN}Backend setup complete!${NC}"
echo ""

# Frontend setup
echo -e "${YELLOW}Setting up Frontend...${NC}"
cd frontend

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
    echo -e "${YELLOW}Note: Frontend will use existing Supabase env vars${NC}"
fi

echo "Installing Node dependencies..."
npm install

echo -e "${GREEN}Frontend setup complete!${NC}"
echo ""

echo "=================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo ""
echo "To start the services:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd api"
echo "  source ../venv/bin/activate"
echo "  uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo -e "${YELLOW}Make sure to update api/.env with your actual values!${NC}"
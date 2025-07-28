#!/bin/bash
# Script to start the frontend server

# Navigate to the project root
cd "$(dirname "$0")"

# Navigate to frontend directory and start server
cd frontend
npm run dev
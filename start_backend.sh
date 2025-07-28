#!/bin/bash
# Script to start the backend server

# Navigate to the project root
cd "$(dirname "$0")"

# Activate virtual environment
source venv/bin/activate

# Navigate to api directory and start server
cd api
python main.py
#!/bin/bash

# Terminal colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${GREEN}=== Hush Poll App ===${NC}"
echo -e "${BLUE}Starting development environment...${NC}"

# Initialize the database if needed
cd backend
echo -e "${BLUE}Initializing database...${NC}"
npm run init-db

# Start backend and frontend using concurrently if it exists
if command -v concurrently &> /dev/null; then
  cd ..
  echo -e "${BLUE}Starting backend and frontend servers...${NC}"
  concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
else
  # Start backend in the background
  echo -e "${BLUE}Starting backend server...${NC}"
  npm run dev &
  BACKEND_PID=$!
  
  # Start frontend
  cd ../frontend
  echo -e "${BLUE}Starting frontend server...${NC}"
  npm run dev
  
  # When frontend stops, kill the backend
  kill $BACKEND_PID
fi 
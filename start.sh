#!/usr/bin/env bash
# setup.sh - Project initialization and run script
# Run this from the repo root: bash setup.sh
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo ""
echo -e "${BOLD}${CYAN}==================================================${NC}"
echo -e "${BOLD}${CYAN}      Rental Property Management System (RPMS)    ${NC}"
echo -e "${BOLD}${CYAN}==================================================${NC}"
echo ""

# Client .env
if [ ! -f "client/.env" ]; then
  cp client/.env.example client/.env
  echo -e "${GREEN}✔${NC} Created client/.env from .env.example"
else
  echo -e "${YELLOW}ℹ${NC} client/.env already exists"
fi

# Server .env
if [ ! -f "server/.env" ]; then
  cp server/.env.example server/.env
  echo -e "${GREEN}✔${NC} Created server/.env from .env.example"
  
  # Auto-generate unique JWT secrets
  echo -e "${YELLOW}⚙ Generating unique JWT secrets...${NC}"
  ACCESS_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" 2>/dev/null || echo "")
  REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" 2>/dev/null || echo "")
  
  if [ ! -z "$ACCESS_SECRET" ] && [ ! -z "$REFRESH_SECRET" ]; then
    node -e "
      const fs = require('fs');
      let env = fs.readFileSync('server/.env', 'utf8');
      env = env.replace(/JWT_ACCESS_SECRET=.*/, 'JWT_ACCESS_SECRET=$ACCESS_SECRET');
      env = env.replace(/JWT_REFRESH_SECRET=.*/, 'JWT_REFRESH_SECRET=$REFRESH_SECRET');
      fs.writeFileSync('server/.env', env);
    "
    echo -e "${GREEN}✔${NC} Generated unique JWT secrets and saved to server/.env"
  fi
else
  echo -e "${YELLOW}ℹ${NC} server/.env already exists"
fi

# Flutter dependencies
echo ""
echo -e "${BOLD}Installing Flutter dependencies...${NC}"
(cd client && flutter pub get)
echo -e "${GREEN}✔${NC} Flutter dependencies installed successfully."

echo ""
echo -e "${BOLD}${CYAN}--------------------------------------------------${NC}"
echo -e "${BOLD}${GREEN}Setup complete! Starting applications...${NC}"
echo -e "${BOLD}${CYAN}--------------------------------------------------${NC}"
echo ""

# Temporarily disable exit on error for the runtime execution phase
set +e

# Start Server in Background
echo -e "${YELLOW}🚀 Starting backend server in the background...${NC}"
cd server
node index.js > ../server.log 2>&1 &
SERVER_PID=$!
cd ..

# Cleanup function to kill the backend server when client exits or script is interrupted
cleanup() {
  echo ""
  if kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${YELLOW}🛑 Stopping backend server (PID $SERVER_PID)...${NC}"
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null
    echo -e "${GREEN}✔ Backend server stopped.${NC}"
  fi
  echo -e "${GREEN}👋 Exiting setup and run script.${NC}"
}

# Trap exit signals to ensure cleanup is run
trap cleanup EXIT INT TERM

# Wait for server to become healthy
echo -n "⏳ Waiting for backend server to become healthy..."
SERVER_UP=false

for i in {1..30}; do
  # Check if backend process died early
  if ! kill -0 $SERVER_PID 2>/dev/null; then
    break
  fi
  
  if command -v curl >/dev/null 2>&1; then
    if curl -s http://localhost:3000/health | grep -q "OK"; then
      SERVER_UP=true
      break
    fi
  else
    # Fallback if curl is missing
    sleep 3
    SERVER_UP=true
    break
  fi
  
  echo -n "."
  sleep 1
done

if [ "$SERVER_UP" = true ]; then
  echo -e " ${GREEN}Online!${NC}"
  echo -e "${GREEN}✔ Server is responding on http://localhost:3000/health${NC}"
  echo ""
  echo -e "${YELLOW}💡 Note: Backend output is being saved to ${BOLD}server.log${NC}"
  echo -e "${YELLOW}💡 Note: If you need to edit database credentials, modify ${BOLD}server/.env${NC}"
  echo ""
  echo -e "${CYAN}🚀 Launching Flutter app...${NC}"
  echo "----------------------------------------"
  cd client
  flutter run
else
  echo -e " ${RED}Failed!${NC}"
  echo -e "${RED}❌ Error: Server failed to start or didn't become healthy in time.${NC}"
  echo -e "${RED}Check ${BOLD}server.log${RED} for detailed error logs:${NC}"
  echo "----------------------------------------"
  if [ -f "server.log" ]; then
    tail -n 25 server.log
  else
    echo "No server.log file found."
  fi
  echo "----------------------------------------"
  exit 1
fi

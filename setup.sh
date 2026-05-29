#!/usr/bin/env bash
# setup.sh - One-time project setup for new clones
# Run this from the repo root: bash setup.sh
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "RPMS Project Setup"
echo "----------------------------------------"

# Client .env
if [ ! -f "client/.env" ]; then
  cp client/.env.example client/.env
  echo -e "${GREEN}OK${NC} Created client/.env from .env.example"
else
  echo -e "${YELLOW}SKIP${NC} client/.env already exists"
fi

# Server .env
if [ ! -f "server/.env" ]; then
  cp server/.env.example server/.env
  echo -e "${GREEN}OK${NC} Created server/.env from .env.example"
  echo ""
  echo -e "  ${YELLOW}Action required:${NC} Edit server/.env and fill in:"
  echo "    - DB_PASSWORD - your PostgreSQL password"
  echo "    - JWT_ACCESS_SECRET - generate with:"
  echo "      node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  echo "    - JWT_REFRESH_SECRET - run the command again for a different value"
else
  echo -e "${YELLOW}SKIP${NC} server/.env already exists"
fi

# Flutter dependencies
echo ""
echo "Installing Flutter dependencies..."
(cd client && flutter pub get)
echo -e "${GREEN}OK${NC} Flutter dependencies installed"

echo ""
echo "----------------------------------------"
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "  Start the server: cd server && node index.js"
echo "  Start the client: cd client && flutter run"
echo ""

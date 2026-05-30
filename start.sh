#!/usr/bin/env bash
# start.sh - Project initialization and run script
# Run this from the repo root: bash start.sh
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

# Copy environment file if not exists
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo -e "${GREEN}✔${NC} Created .env from .env.example"
  else
    echo -e "${RED}❌ Error: .env.example not found. Please create a .env file in the root.${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}ℹ${NC} .env already exists"
fi

# Install Flutter dependencies
echo ""
echo -e "${BOLD}Installing Flutter dependencies...${NC}"
flutter pub get
echo -e "${GREEN}✔${NC} Flutter dependencies installed successfully."

echo ""
echo -e "${BOLD}${CYAN}--------------------------------------------------${NC}"
echo -e "${BOLD}${GREEN}Setup complete! Starting application...${NC}"
echo -e "${BOLD}${CYAN}--------------------------------------------------${NC}"
echo ""

echo -e "${CYAN}🚀 Launching Flutter app...${NC}"
echo "----------------------------------------"
flutter run

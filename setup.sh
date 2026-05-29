#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup.sh — One-time project setup for new clones
# Run this from the repo root: bash setup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "🚀  RPMS Project Setup"
echo "────────────────────────────────────────"

# ── Frontend .env ──────────────────────────────────────────────────────────
if [ ! -f "frontend/.env" ]; then
  cp frontend/.env.example frontend/.env
  echo -e "${GREEN}✓${NC}  Created frontend/.env from .env.example"
else
  echo -e "${YELLOW}⚠${NC}   frontend/.env already exists — skipping"
fi

# ── Backend .env ───────────────────────────────────────────────────────────
if [ ! -f "backend/.env" ]; then
  cp backend/.env.example backend/.env
  echo -e "${GREEN}✓${NC}  Created backend/.env from .env.example"
  echo ""
  echo -e "  ${YELLOW}Action required:${NC} Edit backend/.env and fill in:"
  echo "    • DB_PASSWORD   — your PostgreSQL password"
  echo "    • JWT_ACCESS_SECRET  — generate with:"
  echo "      node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  echo "    • JWT_REFRESH_SECRET — run the command again for a different value"
else
  echo -e "${YELLOW}⚠${NC}   backend/.env already exists — skipping"
fi

# ── Flutter dependencies ───────────────────────────────────────────────────
echo ""
echo "📦  Installing Flutter dependencies..."
(cd frontend && flutter pub get)
echo -e "${GREEN}✓${NC}  Flutter dependencies installed"

# ── Node.js dependencies ───────────────────────────────────────────────────
echo ""
echo "📦  Installing Node.js dependencies..."
(cd backend && npm install)
echo -e "${GREEN}✓${NC}  Node.js dependencies installed"

echo ""
echo "────────────────────────────────────────"
echo -e "${GREEN}✅  Setup complete!${NC}"
echo ""
echo "  Start the backend:   cd backend && npm run dev"
echo "  Start the frontend:  cd frontend && flutter run"
echo ""

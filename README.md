# Property Rentals Management System (RPMS)

A full-stack property rental management app built with **Flutter** (frontend) and **Express.js / Node.js** (backend).

---

## Project Structure

```
project Rpms/
├── frontend/   # Flutter mobile app
└── backend/    # Express.js REST API (TypeScript)
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Flutter SDK | ≥ 3.x |
| Dart SDK | ≥ 3.x |
| Node.js | ≥ 18.x |
| PostgreSQL | ≥ 14 |

---

### ⚡ Quick Setup (recommended)

After cloning, run the one-shot setup script from the repo root:

```bash
git clone git@github.com:yeabisra-b/Mobile-App-Project-.git
cd "Mobile-App-Project-"
bash setup.sh
```

This script will:
- Copy `.env.example → .env` for both `frontend/` and `backend/`
- Run `flutter pub get` and `npm install` automatically

Then edit `backend/.env` to fill in your real PostgreSQL password and JWT secrets (see [Environment Variables Reference](#environment-variables-reference) below).

---

### Manual Setup

#### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — fill in DB_PASSWORD, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
```

**Generate JWT secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Run twice — use the two outputs as `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

```bash
npm run dev   # API available at http://localhost:3000
```

#### 2. Frontend

```bash
cd frontend
flutter pub get
cp .env.example .env   # adjust API_BASE_URL if needed
flutter run
```

---

## Environment Variables Reference

### `backend/.env`

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `rpms` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | *(set yours)* |
| `JWT_ACCESS_SECRET` | Secret for access tokens | *(generate)* |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | *(generate)* |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `PORT` | Backend server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3001` |

### `frontend/.env`

| Variable | Description | Default |
|----------|-------------|---------|
| `API_BASE_URL` | Backend API base URL | `http://localhost:3000/api/v1` |
| `APP_NAME` | Application name | `Property Rentals` |
| `APP_ENV` | App environment | `development` |

---

> **Note:** Never commit `.env` files. They are listed in `.gitignore`. Always use `.env.example` as the template.

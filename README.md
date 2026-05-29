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

### 1. Clone the Repository

```bash
git clone git@github.com:yeabisra-b/Mobile-App-Project-.git
cd "Mobile-App-Project-"
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and fill in your PostgreSQL credentials and JWT secrets
```

**Generate JWT secrets** (run once):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output into `JWT_ACCESS_SECRET` and run again for `JWT_REFRESH_SECRET`.

**Start the backend dev server:**
```bash
npm run dev
# API will be available at http://localhost:3000
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install Flutter dependencies
flutter pub get

# Set up environment variables
cp .env.example .env
# Edit .env if your backend runs on a different host/port
```

**Run the Flutter app:**
```bash
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

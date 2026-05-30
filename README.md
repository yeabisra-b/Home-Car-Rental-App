# Property Rentals Management System

This project is a rental property management app for owners, tenants, and admins. It includes a Flutter client for browsing properties, managing rentals, messaging, maintenance requests, leases, invoices, and profiles, plus a Node/Express server that exposes the API and stores data in PostgreSQL.

## Project Structure

- `client/` - Flutter mobile/web app
- `server/` - Node/Express API server
- `api_doc.md` - API contract and endpoint reference

## Prerequisites

- Flutter SDK
- Node.js
- PostgreSQL

## Quick Setup

Get the entire stack up and running with a single command from the repo root:

### Linux / macOS
```sh
bash start.sh
```

### Windows (PowerShell)
```powershell
.\start.ps1
```

This command automatically:
1. Configures environment files (`.env`) for both client and server if they don't exist.
2. Generates and injects unique, cryptographically secure 64-byte JWT secrets into `server/.env`.
3. Installs Flutter client dependencies (`flutter pub get`).
4. Launches the backend Node server in the background (routing output to `server.log`).
5. Polls the server's health status until it is online.
6. Boots the Flutter client in the foreground, ready for development.
7. Gracefully stops the background server process when you quit the client or stop the script.

---

## Manual Setup & Run (Optional)

If you prefer to run the components separately:

### 1. Environment Files
Create local environment files from the examples:
```sh
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Update `server/.env` with your PostgreSQL credentials and JWT secrets.

### 2. Run The Server
```sh
cd server
node index.js
```

### 3. Run The Client
```sh
cd client
flutter run
```

For web development, use:

```sh
flutter run -d chrome
```

If you run the app on a physical device or emulator, update `client/.env` so `API_BASE_URL` points to an address the device can reach.

## Environment Variables

`server/.env`:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL connection settings
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` - authentication token secrets
- `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` - token lifetimes
- `PORT` - server port, default `3000`
- `NODE_ENV` - runtime environment
- `FRONTEND_URL` - allowed client origin

`client/.env`:

- `API_BASE_URL` - server API base URL
- `APP_NAME` - display name used by the client
- `APP_ENV` - client environment name

Never commit real `.env` files. Use the `.env.example` files as templates.

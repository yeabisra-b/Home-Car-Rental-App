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

From the repo root:

```sh
bash setup.sh
```

This creates local `.env` files from the examples and runs `flutter pub get` in `client/`.

## Manual Setup

Create local environment files from the examples:

```sh
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Update `server/.env` with your PostgreSQL credentials and JWT secrets. By default, the server listens on port `3000`, and the client points to:

```txt
http://localhost:3000/api/v1
```

You can generate JWT secrets with:

```sh
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Run The Server

```sh
cd server
node index.js
```

When it starts successfully, the API is available at `http://localhost:3000/api/v1`, API docs are at `http://localhost:3000/api-docs`, and the health check is at `http://localhost:3000/health`.

## Run The Client

```sh
cd client
flutter pub get
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

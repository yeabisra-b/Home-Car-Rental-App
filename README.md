# Rental Property Management System

This project is a rental property management app for owners, tenants, and admins. It includes a Flutter client for browsing properties, managing rentals, messaging, maintenance requests, leases, invoices, and profiles, plus a Node/Express server that exposes the API and stores data in PostgreSQL.

## Project Structure

- `client/` - Flutter mobile/web app
- `server/` - Node/Express API server
- `api_doc.md` - API contract and endpoint reference

## Prerequisites

- Flutter SDK
- Node.js
- PostgreSQL

## Environment Setup

Create local environment files from the examples:

```sh
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Update `server/.env` with your PostgreSQL credentials. By default, the server listens on port `3000`, and the client points to:

```txt
http://localhost:3000/api/v1
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

# College Bus Tracking System

A production-quality college bus tracking system with real-time GPS tracking, bus route management, trip tracking, and role-based dashboards for admin, drivers, and students.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + Prisma + PostgreSQL
- Realtime: Socket.IO
- Auth: JWT + bcrypt

## Repositories

- `client/`: React frontend
- `server/`: Express API and realtime server

## Getting started

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables

Copy the example files and update values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 3. Run the app

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
cd client
npm run dev
```

## Default roles

- Admin
- Driver
- Student

## Notes

This project is intentionally scaffolded for rapid development and easy extension with real-time bus tracking and route management.

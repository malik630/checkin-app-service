# ✈️ Skywire Check-In API

Backend REST API for TDM project, Check-In mobile app.  
Built with **Node.js + Express + TypeScript + Prisma + PostgreSQL**.

## Stack

| Layer      | Technology            |
| ---------- | --------------------- |
| Runtime    | Node.js 20+ (ESM)     |
| Framework  | Express 4             |
| Language   | TypeScript 5 (strict) |
| ORM        | Prisma 6              |
| Database   | PostgreSQL 16         |
| Auth       | JWT (jsonwebtoken)    |
| Validation | express-validator     |
| Dev server | tsx                   |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create env file and set vars like this example

DATABASE_URL="your-postgres-connection-string"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=
NODE_ENV=

# 3. Push schema to DB (dev)
npm run db:push

# 4. Seed with mock data
npm run db:seed

# 5. Start dev server (auto-restarts on save)
npm run dev
```

## Project Structure

```
src/
├── server.ts              # Entry point : starts HTTP server
├── app.ts                 # Express app setup (middleware, routes)
├── router.ts              # Root API router : mounts all modules
│
├── config/
│   └── env.ts             # Validated environment variables
│
├── middleware/
│   ├── auth.middleware.ts  # JWT Bearer token verification
│   ├── error.middleware.ts # Global error + 404 handler
│   └── validate.middleware.ts # express-validator error formatter
│
├── modules/               # Feature modules
│   ├── auth/              # Register, Login, Me
│   ├── flights/           # Flight list, detail, itinerary search (PNR)
│   ├── bookings/          # User bookings, booking by ref
│   ├── seats/             # Seat map, seat reservation
│   ├── checkin/           # Session CRUD + step advancement
│   ├── boarding/          # Boarding pass get + generate
│   └── notifications/     # List, unread count, mark read
│
├── prisma/
│   └── client.ts          # Prisma singleton
│
├── types/
│   └── index.ts           # AuthenticatedRequest, ApiResponse
│
└── utils/
    ├── response.ts         # ok(), created(), notFound()... helpers (common json response format)
    └── jwt.ts              # signToken(), verifyToken() helpers for jwt handling
```

## Response Format

All responses follow this envelope:

```json
{ "success": true, "data": { ... }, "message": "Optional message" }
{ "success": false, "message": "Error description" }
```

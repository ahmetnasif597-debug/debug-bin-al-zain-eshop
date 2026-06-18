# بن الزين — Bin Al-Zain Coffee Shop

Arabic e-commerce web application for Bin Al-Zain coffee and food products. Customers browse products, add items to cart, and place orders. Admins manage products, categories, orders, customers, and send notifications — all from a dedicated admin panel.

---

## Project Structure

```
bin-alzain/
├── backend/              ← Express API server (self-contained)
│   ├── src/
│   │   ├── db/           ← PostgreSQL schema (Drizzle ORM)
│   │   │   └── schema/   ← all table definitions
│   │   ├── schemas/      ← Zod validation schemas (request/response)
│   │   ├── routes/       ← API route handlers
│   │   ├── lib/          ← logger, object storage helpers
│   │   ├── app.ts        ← Express app setup
│   │   └── index.ts      ← server entry point (default port: 4000)
│   ├── build.mjs         ← esbuild bundler script
│   ├── drizzle.config.ts ← DB migration config
│   └── package.json      ← all backend dependencies
│
├── frontend/             ← React + Vite frontend (self-contained)
│   ├── src/
│   │   ├── components/   ← UI components (admin, layout, shared)
│   │   ├── pages/        ← route pages (home, cart, admin/*)
│   │   ├── context/      ← React context providers
│   │   ├── hooks/        ← custom hooks
│   │   └── lib/
│   │       └── api-client/ ← generated React Query API hooks
│   ├── public/           ← static assets (logo, images, favicon)
│   ├── index.html
│   ├── vite.config.ts    ← Vite config (proxies /api → backend:4000)
│   └── package.json      ← all frontend dependencies
│
├── package.json          ← root: installs both + starts both with concurrently
├── start.sh              ← one-click startup script
├── .env.example          ← all required environment variables
└── .replit               ← Replit configuration
```

---

## Quick Start (New Environment)

### 1. Set environment variables
Copy `.env.example` to `.env` and fill in:
- `DATABASE_URL` — PostgreSQL connection string
- `ADMIN_PASSWORD_HASH` — bcrypt hash of admin password (see below)

### 2. Generate admin password hash
```bash
node -e "const b=require('bcryptjs'); b.hash('yourpassword',12).then(h=>console.log(h))"
```

### 3. Install and run
```bash
npm install      # installs root + backend + frontend automatically
npm run dev      # starts API (port 4000) + Frontend (port 3000) together
```

Or simply:
```bash
./start.sh
```

### 4. Push database schema (first time only)
```bash
cd backend && DATABASE_URL=<your_url> npx drizzle-kit push --config drizzle.config.ts
```

---

## NPM Scripts (root)

| Command | Description |
|---------|-------------|
| `npm install` | Installs root + backend + frontend deps automatically |
| `npm run dev` | Start both API (port 4000) and frontend (port 3000) |
| `npm run build` | Build both for production |
| `npm run start` | Run production builds of both services |
| `npm run db:push` | Push schema changes to database |

---

## Stack

- **Frontend**: React 18, Vite 7, TypeScript, TailwindCSS v4, React Query, Wouter, Framer Motion, Radix UI
- **Backend**: Express 5, TypeScript, esbuild (bundled)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (schemas in `backend/src/schemas/`)
- **Images**: Replit Object Storage (GCS-backed presigned URLs)
- **Auth**: session-based (express-session), bcrypt for admin, SHA-256 for customers

---

## Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `ADMIN_PASSWORD_HASH` | ✅ | bcrypt hash of admin panel password |
| `SESSION_SECRET` | optional | random string for session encryption |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | optional | Replit Object Storage bucket ID |
| `PRIVATE_OBJECT_DIR` | optional | private storage dir for uploads |
| `PUBLIC_OBJECT_SEARCH_PATHS` | optional | public image search paths |

---

## Admin Panel

Access at `/admin`. Default password: `binalzain2024` (change via `ADMIN_PASSWORD_HASH`).

Features: Dashboard stats, Products, Categories, Orders, Customers, Notifications, Store Settings.

---

## User Preferences

- UI language: Arabic (RTL), text in Arabic throughout
- Currency: Syrian Pound (ل.س)
- Auth: phone number (not email) for customer login/register
- Design: warm beige/brown color palette matching brand

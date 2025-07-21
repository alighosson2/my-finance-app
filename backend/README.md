# My Finance Backend

A robust backend API for personal and small business finance management, built with Node.js, Express, TypeScript, and Prisma. This backend powers the My Finance App, supporting user authentication, bank integrations (including Open Bank Project), budgeting, transactions, tax management, and more.

---

## Features

- **User Authentication**: Secure login, registration, JWT-based sessions, and role management (admin, user, manager).
- **Bank Integrations**: Connect real bank accounts using OAuth 1.0a via the Open Bank Project (OBP) sandbox or real banks. Manage bank tokens, sync accounts and transactions.
- **Financial Accounts**: CRUD for accounts, balances, account types (checking, savings, credit card, investment, loan), and statistics.
- **Transactions**: CRUD, search, stats, account-specific queries, and OBP sync.
- **Budgets**: Create/manage budgets, categories, recommendations, auto-assign transactions, and spending analysis.
- **Tax Records**: Track tax years, calculate estimates, generate reports, and manage tax data.
- **Alerts**: Custom financial alerts and notifications.
- **Admin Tools**: OBP data import and internal admin endpoints.
- **Secure & Modern**: Uses Helmet, CORS, rate limiting, and robust error handling.
- **TypeScript**: Full type safety and modern JavaScript features.
- **Prisma ORM**: PostgreSQL database with a clear, extensible schema.

---

## Tech Stack

- **Node.js** + **Express**
- **TypeScript**
- **Prisma ORM** (PostgreSQL)
- **Open Bank Project (OBP) API**
- **JWT Authentication**
- **Winston Logging**
- **Docker** (optional, for DB)

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- PostgreSQL database

### Installation

1. **Clone the repo:**
   ```bash
   git clone <your-repo-url>
   cd my-finance-app/backend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your secrets (see below).
4. **Set up the database:**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```
5. **Run the server (dev mode):**
   ```bash
   npm run dev
   ```

---

## Environment Variables

Create a `.env` file in `/backend` with the following (see `src/config/index.ts`):

```
DATABASE_URL=postgresql://user:password@localhost:5432/myfinance
JWT_SECRET_KEY=your_jwt_secret
TOKEN_EXPIRATION=1h
REFRESH_TOKEN_EXPIRATION=7d
LOG_DIR=./logs
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
# Open Bank Project (OBP) API
OBP_CONSUMER_KEY=your_obp_key
OBP_CONSUMER_SECRET=your_obp_secret
OBP_BASE_URL=https://apisandbox.openbankproject.com
OBP_CALLBACK_URL=http://localhost:3000/api/bank/callback
```

---

## Scripts

- `npm run dev` — Start server in development mode (with hot reload)
- `npm run build` — Compile TypeScript to JS
- `npm start` — Run compiled server
- `npm run db:migrate` — Run Prisma migrations
- `npm run db:generate` — Generate Prisma client

---

## API Modules

- **/api/auth** — Login, logout, register (web & mobile)
- **/api/users** — User management
- **/api/bank** — OBP OAuth, connect/revoke bank accounts, sync data
- **/api/bank/api** — Bank token management, OBP sync endpoints
- **/api/accounts** — Financial account CRUD & stats
- **/api/transactions** — Transaction CRUD, search, stats, account-specific
- **/api/budgets** — Budget CRUD, recommendations, analysis
- **/api/tax** — Tax record CRUD, calculations, reports
- **/api/admin** — Admin-only endpoints (e.g., OBP data import)

All endpoints (except auth/register/login) require authentication via JWT (in cookies or headers).

---

## Database

- **Prisma ORM** manages migrations and models (see `prisma/schema.prisma`).
- Main entities: `users`, `bank_tokens`, `financial_accounts`, `transactions`, `budgets`, `tax_records`, `alerts`.
- Enums for roles, account types, transaction types.

---

## Open Bank Project (OBP) Integration

- OAuth 1.0a flow for secure bank account linking.
- Sync accounts and transactions from OBP sandbox or real banks.
- See `/api/bank` and `/api/bank/api` endpoints.

---

## Development Notes

- TypeScript config: see `tsconfig.json` (strict mode, ES2020, rootDir: src, outDir: dist)
- Logs are written to `/logs` (configurable)
- Ignore files: `node_modules`, `dist`, `.env`, `logs`, IDE files, etc. (see `.gitignore`)

---

## Contributing

1. Fork and clone the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push and open a pull request

---

## License

MIT (or your license here)

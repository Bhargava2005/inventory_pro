# 📦 Inventory Pro — Enterprise Inventory Management System

A full-stack, industry-grade inventory management PWA built with React + Node.js + MongoDB.

---

## 🏗 Project Structure

```
inventory-pro/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── api/         # Axios API clients
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route-level page components
│   │   ├── store/       # Zustand global state
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   └── styles/      # Global CSS
│   └── ...
└── server/          # Node.js + Express backend
    ├── src/
    │   ├── config/      # DB connection
    │   ├── controllers/ # Route handlers
    │   ├── middleware/  # Auth, error handling
    │   ├── models/      # Mongoose models
    │   ├── routes/      # Express routers
    │   └── utils/       # JWT helpers
    └── ...
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Git

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd inventory-pro

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure Environment Variables

```bash
# In /server directory
cp .env.example .env
```

Edit `server/.env` and fill in:
- `MONGODB_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — a long random secret (generate with command in the file)
- `CLIENT_URL` — `http://localhost:5173` for development

### 3. Run in Development

```bash
# Terminal 1 — Start backend
cd server && npm run dev

# Terminal 2 — Start frontend
cd client && npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

---

## 🔐 Auth Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login (email or username) |
| GET | `/api/auth/me` | Private | Get current user |
| PUT | `/api/auth/profile` | Private | Update profile |
| PUT | `/api/auth/change-password` | Private | Change password |

---

## 👤 User Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full access — manage users, stores, all products |
| `manager` | Store-level access — manage their store's inventory |
| `staff` | View and add stock only |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| State | Zustand + React Query |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Deployment | Vercel + MongoDB Atlas |

---

## 📋 Development Phases

- [x] **Phase 1** — Foundation: Auth system, JWT, MongoDB, React setup
- [x] **Phase 2** — Product & Category CRUD, Stock tracking
- [x] **Phase 3** — Multi-store management, User Roles
- [x] **Phase 4** — POS Sales Engine, Analytics Dashboard
- [x] **Phase 5** — PDF Invoices, Excel Exports, Reporting

---

## 🔒 Security Features

- Passwords hashed with bcrypt (12 salt rounds)
- JWT tokens with expiry
- Rate limiting on auth routes (10 req/15min)
- Helmet.js for HTTP security headers
- CORS configured for specific origins
- Input validation with express-validator + Zod
- Mongoose schema validation

---

## 📦 Deployment

### Push to Your GitHub
1. Create a new empty repository on GitHub.
2. Run the following in your terminal:
```bash
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

### Frontend (Vercel)
1. Import the repository into Vercel.
2. Set Root Directory to `client`.
3. Build command: `npm run build`.
4. Output Directory: `dist`.

### Backend (Render)
1. Create a new Web Service on Render.
2. Root Directory: `server`.
3. Build command: `npm install`.
4. Start command: `node src/index.js`.
5. Set environment variables in the dashboard.

### Database
Use MongoDB Atlas free tier — M0 cluster supports up to 512MB.

---

© 2026 Inventory Pro · Powered by WinWin

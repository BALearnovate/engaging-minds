# Engaging Minds

Engaging Minds is a web application designed for teachers and students. This project is structured as a monorepo containing a modern React frontend powered by Vite, a NestJS backend API, and a PostgreSQL database using Prisma ORM with role-based authentication (**ADMIN**, **TEACHER**, **STUDENT**).

---

## 📁 Repository Structure

```
engaging-minds/
├── frontend/             # React + TypeScript single-page application built with Vite
│   ├── src/              # React components, auth context, pages, & API client
│   ├── Dockerfile        # Multi-stage Dockerfile for React frontend
│   └── package.json
│
├── backend/              # NestJS REST server with Prisma ORM & Passport JWT auth
│   ├── src/              # Modules, controllers, services, guards, decorators
│   ├── prisma/           # Schema definition (Role enum & User model) & seed script
│   ├── Dockerfile        # Multi-stage Dockerfile with automated DB push/seed
│   └── package.json
│
├── docker-compose.yaml   # Orchestrates PostgreSQL 16, NestJS backend, & React frontend
├── package.json          # Monorepo root package configuration (npm workspaces)
├── .dockerignore         # Docker build context exclusions
├── .gitignore            # Root Git ignore definitions
└── README.md             # Project documentation
```

---

## 🐳 Quick Start with Docker (Recommended)

Run the entire application stack (PostgreSQL + NestJS Backend + React Frontend) with a single command:

```bash
docker compose up --build
```

This command automatically:
1. Starts **PostgreSQL 16** on port `5432` with a health check.
2. Waits for PostgreSQL to become healthy before launching the **NestJS Backend**.
3. Pushes the Prisma schema to the database (`npx prisma db push`) and seeds demo accounts (`npx prisma db seed`).
4. Starts the **React Frontend** on `http://localhost:5173`.

### Access URLs:
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3000](http://localhost:3000)
- **PostgreSQL Database:** `localhost:5432` (`user: postgres`, `pass: postgres`, `db: engaging_minds`)

---

## 🔑 Pre-Seeded Test Accounts

When running via Docker or seeding manually, the database is populated with the following demo accounts for testing Role-Based Access Control (RBAC):

| Role | Email | Password | Allowed Dashboards & APIs |
| :--- | :--- | :--- | :--- |
| **👑 ADMIN** | `admin@example.com` | `Admin123!` | Admin, Teacher, Student |
| **👩‍🏫 TEACHER** | `teacher@example.com` | `Teacher123!` | Teacher, Student |
| **🎓 STUDENT** | `student@example.com` | `Student123!` | Student |

---

## 🚀 Local Development (Without Docker)

### Prerequisites
- **Node.js** >= v18.0.0
- **PostgreSQL** running locally on `localhost:5432`

### Installation & Setup

```bash
# 1. Install workspace dependencies
npm install

# 2. Configure Backend Environment
# Edit backend/.env if needed to match your local PostgreSQL credentials:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/engaging_minds?schema=public"

# 3. Generate Prisma Client & Seed Database
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
cd ..
```

### Running Applications

```bash
# Run both frontend and backend concurrently from root
npm run dev:frontend   # Starts React on http://localhost:5173
npm run dev:backend    # Starts NestJS on http://localhost:3000
```

---

## 📜 NPM Workspace Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev:frontend` | Start React (Vite) frontend development server |
| `npm run dev:backend` | Start NestJS backend API in watch mode |
| `npm run build:frontend` | Build React frontend production bundle |
| `npm run build:backend` | Build NestJS backend TypeScript |
| `npm run build` | Build both frontend and backend for production |

---

## 📄 License
UNLICENSED

# 🚀 StockPilot

> **A multi-tenant SaaS for inventory & point-of-sale, with an AI assistant that answers questions about your business data.**
> Small businesses sign up, manage products, stock and sales in real time, and chat with an AI copilot that tells them what to reorder, their real margins, and sales trends.

[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions&logoColor=white)](#)
[![API](https://img.shields.io/badge/API-NestJS_+_TypeScript-E0234E?logo=nestjs&logoColor=white)](#)
[![Web](https://img.shields.io/badge/Web-Next.js_+_TypeScript-000000?logo=nextdotjs&logoColor=white)](#)
[![DB](https://img.shields.io/badge/DB-PostgreSQL_+_Prisma-4169E1?logo=postgresql&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Live demo](https://img.shields.io/badge/Live_demo-juanmaya25.github.io/stockpilot-22c55e?logo=githubpages&logoColor=white)](https://juanmaya25.github.io/stockpilot/)

> ▶️ **Live demo:** **https://juanmaya25.github.io/stockpilot/** — click _“Entrar a la demo”_ and explore the dashboard, inventory, POS and AI assistant. (This is the frontend running as a static SPA with seeded sample data in your browser; the full NestJS + PostgreSQL backend lives in this repo and runs locally via Docker.)

> ⚙️ **Status:** working full-stack app — backend, frontend, AI assistant and seeded demo data all running. See the [Roadmap](#-roadmap).

### 🔑 Demo login

```
email:    demo@stockpilot.dev
password: demo1234
```

Seeded with 8 products, low-stock alerts and a week of sales.

---

## 🎯 Why this project

This isn't a UI mockup with fake data. **StockPilot is a real full-stack product**: a typed REST API, a relational database with a multi-tenant schema, JWT authentication with roles, real business logic (stock transactions, sales that decrement inventory), an AI assistant grounded in each tenant's data, subscription billing, automated tests, and one-command Docker deployment.

The goal: a system a real small business could sign up for and use today.

## ✨ Features

- 🔐 **Auth & multi-tenancy** — register a business, log in (JWT + refresh), roles (Owner / Staff). Each business only sees its own data.
- 📦 **Inventory** — products with SKU, barcode, cost/sale price, automatic margin, stock with min-stock alerts.
- 💰 **Point of sale** — register sales that atomically decrement stock; full audit trail of stock movements.
- 🏭 **Suppliers & customers** — manage relationships, purchase history, totals.
- 🤖 **AI assistant** — ask in natural language ("what should I reorder?", "my top product this month?") and get answers computed from your real data.
- 📊 **Dashboard & reports** — live KPIs, sales trends, low-stock alerts, CSV export.
- 💳 **Billing** — subscription plans via Stripe (test mode).
- 📈 **Quality** — automated tests, OpenAPI/Swagger docs, CI/CD, Docker.

## 🏗️ Architecture

```
stockpilot/
├── apps/
│   ├── api/        # NestJS + TypeScript REST API  (controllers → services → Prisma)
│   │   └── prisma/ # PostgreSQL schema & migrations
│   └── web/        # Next.js + TypeScript frontend (App Router, Tailwind)
├── docker-compose.yml   # Postgres + Adminer for local dev
└── .github/workflows/   # CI: lint, test, build
```

**Backend layering:** `Controller` (HTTP, validation via DTOs) → `Service` (business logic) → `Prisma` (data). Auth via Passport JWT guards. Every request is scoped to the authenticated user's `businessId` (tenant isolation).

## 🛠️ Tech stack

| Layer | Tech |
|---|---|
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS, Recharts |
| **Backend** | NestJS, TypeScript, class-validator, Passport JWT |
| **Database** | PostgreSQL, Prisma ORM (typed queries + migrations) |
| **AI** | Groq (free, OpenAI-compatible LLM) — answers grounded in the tenant's real data |
| **Payments** | Stripe (subscriptions, test mode) |
| **Infra** | Docker, docker-compose, GitHub Actions CI |
| **Testing** | Jest (unit + e2e) |
| **Docs** | OpenAPI / Swagger UI |

## 🚀 Run locally

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. API
cd apps/api
cp .env.example .env        # fill in your secrets (DB URL, JWT secret, Anthropic key)
npm install
npx prisma migrate dev      # create the schema
npm run start:dev           # http://localhost:3000  (Swagger at /docs)

# 3. Web
cd ../web
npm install
npm run dev                 # http://localhost:3001
```

## 🌐 Deploy

- **Database + API** → [Render](https://render.com) Blueprint: New → Blueprint → pick this repo (`render.yaml` provisions PostgreSQL + the Dockerized API). Set `GROQ_API_KEY` and `WEB_ORIGIN` in the dashboard.
- **Frontend** → [Vercel](https://vercel.com): import the repo, set root directory to `apps/web` and env `NEXT_PUBLIC_API_URL` to your Render API URL.

## 🗺️ Roadmap

- [x] Project foundation, multi-tenant DB schema, Docker, CI
- [x] Auth: register business + JWT login + role guards
- [x] Inventory CRUD + stock movements
- [x] Sales / POS with atomic stock decrement
- [x] Dashboard & reports API
- [x] AI assistant (Groq, grounded in tenant data)
- [x] Next.js frontend (login, dashboard, products, POS, AI chat)
- [x] Seed script with demo data
- [ ] Stripe subscription billing
- [ ] Deploy (API on Railway/Render, Web on Vercel)

## 👨‍💻 Author

**Juan José Maya** — Full-Stack Developer · Colombia (remote, GMT-5)

- 🌐 Portfolio: [juanmaya25.github.io](https://juanmaya25.github.io)
- 💼 GitHub: [@Juanmaya25](https://github.com/Juanmaya25)
- ✉️ juanjosemorales2510@gmail.com

## 📄 License

MIT © Juan José Maya

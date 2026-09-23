# 🌀 RIZO — Web3 Beauty Platform for the Latin Curly Hair Community

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Stellar](https://img.shields.io/badge/Stellar-Network-7B7BF7?style=flat-square&logo=stellar)](https://stellar.org/)
[![Vercel Deployment](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)](https://rizo-dao.vercel.app)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Resend](https://img.shields.io/badge/Email-Resend-black?style=flat-square&logo=resend)](https://resend.com/)

> Beauty meets Web3. Shop, connect with professionals, and earn  
> on-chain loyalty tokens — powered by Stellar Network, invisibly.

🌐 **Demo en vivo (Vercel):** [https://rizo-dao.vercel.app](https://rizo-dao.vercel.app)

---

## 🌟 What is RIZO?

RIZO is a full-stack Web3 platform built exclusively for the **50M+ Latin women with curly, wavy, and afro-textured hair** across Mexico and Latin America.

The platform brings together three core pillars:

- **Community** — A social feed where users share curl routines, transformations, follow creators, and write reviews. Every action earns $RIZO tokens.
- **Marketplace** — A curated store with products from Mexican and Latin American brands, specifically selected for curly hair. Pay with USDC on Stellar Network.
- **Professionals** — A directory of certified curl specialists and stylists with on-chain verification. Book appointments and pay with $RIZO tokens.

---

## ✨ Key Features

- 🔐 **Invisible Blockchain** — Users register with email only. A Stellar wallet is created automatically in the background — no crypto knowledge or seed phrases required.
- ⚡ **Real Stellar Payments** — USDC transactions confirmed in ~3 seconds with negligible fees ($0.00001).
- 🪙 **$RIZO Token System** — On-chain loyalty built on Stellar Soroban contracts. Earn tokens by engaging, reviewing, and shopping.
- 📜 **Stylist Soulbound Tokens (SBT)** — Non-transferable on-chain credentials issued via Soroban smart contracts to verify curl specialist expertise.
- 💌 **Transactional Email System** — Asynchronous notifications powered by Resend (order confirmations, receipts, and secure password recovery).
- 👥 **Social Relations & Follow System** — Follow and discover favorite community members and stylists with custom feed views.
- 💇 **Curl Type Matching** — Products and routines filtered by curl pattern (2A–4C), porosity, thickness, and length.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, React 19, Tailwind CSS |
| Backend & API | Next.js API Routes, Zod Validation, In-memory Rate Limiting |
| Database & ORM | PostgreSQL ([Neon](https://neon.tech) in production, Docker Compose local), Prisma ORM |
| Blockchain & Contracts | Stellar Horizon SDK + Soroban Smart Contracts (`rizo-sbt`, `rizo-loyalty` in Rust) |
| Payments & Tokens | USDC on Stellar Testnet + Custom Soulbound Tokens (SBT) |
| Auth & Security | NextAuth v4, Accesly, bcrypt password hashing |
| Communications | Resend (React Email components) |
| Deployment | [Vercel Demo](https://rizo-dao.vercel.app) (CI/CD with Webpack build pipeline) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, pnpm, or yarn
- Docker & Docker Compose (for local database & cache) OR a remote PostgreSQL instance ([Neon](https://neon.tech))
- Rust & Cargo (to run Soroban smart contract tests)
- Stellar Testnet account

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/nallely-lopez/RizoDAO.git](https://github.com/nallely-lopez/RizoDAO.git)
   cd RizoDAO

# FinZ Backend — API Server

**FinZ Backend** adalah RESTful API server untuk aplikasi FinZ yang menangani autentikasi, manajemen data keuangan, dan integrasi dengan AI service.

## 🚀 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Sequelize v6
- **Cache**: Redis
- **Authentication**: JWT (JSON Web Token)
- **AI Proxy**: Axios → Python AI Service
- **Deployment**: Vercel (Serverless)

## ✨ Fitur API

- 🔐 **Auth** — Register, Login, JWT token management
- 💰 **Transactions** — CRUD transaksi dengan kategorisasi AI
- 📋 **Budgets** — Manajemen anggaran bulanan
- 📊 **Dashboard** — Aggregasi data keuangan & prediksi AI
- 🤖 **AI Chat** — Proxy ke AI inference service
- 👤 **Profile** — Manajemen profil pengguna

## 📦 Instalasi

```bash
# Clone repository
git clone https://github.com/PRU452-Finz/finz-backend.git

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env sesuai konfigurasi

# Jalankan development server
npm run dev
```

## 🌐 Environment Variables

Lihat `.env.example` untuk daftar lengkap environment variables yang diperlukan.

## 📁 Struktur Project

```
src/
├── config/         # Database & app configuration
├── controllers/    # Route handlers
├── database/       # Migrations & seeders
├── middlewares/     # Auth & validation middleware
├── models/         # Sequelize models
├── routes/         # API route definitions
├── services/       # Business logic & AI integration
└── index.js        # Entry point
```

## 🔗 Related Repositories

- [finz-frontend](https://github.com/PRU452-Finz/finz-frontend) — React Frontend
- [AI-Deploy](https://github.com/PRU452-Finz/AI-Deploy) — Python AI Inference Service

## 📄 License

This project is developed as a capstone project for PRU452.

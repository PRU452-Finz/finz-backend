# 🔍 FinZ Application — Full Audit Report (Updated)

**Tanggal Audit**: 21 Mei 2026  
**Auditor**: AI Code Auditor  
**Scope**: finz-backend (Express.js), FinZ frontend (React/Vite), AI-master (Flask/TF)

---

## 📋 Executive Summary

Sejak audit pertama (18 Mei), **semua 3 cacat kritikal dan 4 masalah keamanan telah diperbaiki**. Sistem autentikasi JWT sudah aktif, fitur income berfungsi end-to-end, dan bug dashboard sudah ditangani. Integrasi AI (Flask ↔ Backend) sudah berjalan termasuk fitur Budget Alert. Saat ini fokus pengembangan beralah ke **optimasi performa, skalabilitas, dan kesiapan produksi**.

---

## ✅ STATUS PERBAIKAN BUG SEBELUMNYA

| ID | Issue | Status Lama | Status Sekarang |
|----|-------|------------|----------------|
| BUG-001 | Autentikasi tidak berfungsi | ❌ BROKEN | ✅ **FIXED** — authController, JWT, bcrypt, middleware semua aktif |
| BUG-002 | Income tidak tersimpan | ❌ BROKEN | ✅ **FIXED** — `transaction_type` disimpan & dikembalikan |
| BUG-003 | Dashboard division by zero | ⚠️ ERROR | ✅ **FIXED** — safe guard di FinanceContext |
| SEC-001 | Endpoint terbuka tanpa auth | ❌ | ✅ **FIXED** — semua route dilindungi `verifyToken` / `authMiddleware` |
| SEC-002 | Tidak ada rate limiting | ❌ | ✅ **FIXED** — `express-rate-limit` aktif (auth: 10/15min, api: 200/15min) |
| SEC-003 | Password tidak di-hash | ❌ | ✅ **FIXED** — bcrypt via `User.beforeCreate` hook |
| SEC-004 | JWT Secret tidak ada | ❌ | ✅ **FIXED** — `JWT_SECRET` di `.env` |
| GAP-001 | Auth system | ❌ | ✅ **FIXED** — register/login/me endpoints |
| GAP-002 | User data isolation | ❌ | ✅ **FIXED** — `req.user.id` dari JWT |
| GAP-003 | Budget alerts tidak tampil | ❌ | ✅ **FIXED** — NotificationBell + on-the-fly generation |
| GAP-005 | Edit transaction | ❌ | ✅ **FIXED** — EditTransactionModal.jsx |
| GAP-007 | Seeder hanya expense | ❌ | ✅ **FIXED** — seeder include income data |

---

## 🏗️ ARSITEKTUR SISTEM SAAT INI

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│    Frontend      │ ───▶ │    Backend       │ ───▶ │    AI Server     │
│  React 19/Vite   │      │  Express/MySQL   │      │  Flask/TF/SKL    │
│  Port 5173       │      │  Port 8000       │      │  Port 5000       │
│                  │      │                  │      │                  │
│ ✅ Auth UI       │      │ ✅ Auth Routes   │      │ ✅ /predict/*    │
│ ✅ Income/Expense│      │ ✅ JWT + bcrypt  │      │ ✅ /alerts/*     │
│ ✅ Dashboard     │      │ ✅ Rate Limit    │      │ ✅ /health       │
│ ✅ Budget Mgmt   │      │ ✅ CORS          │      │ ✅ Rule Engine   │
│ ✅ Notifications │      │ ✅ Validators    │      │ ✅ Pred Cache    │
│ ✅ Charts        │      │ ✅ AI Integration│      │ ✅ Pred Logs     │
│ ✅ Edit/Delete   │      │ ✅ Budget CRUD   │      │                  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

---

## 📊 FITUR YANG SUDAH BERFUNGSI

### Frontend (FinZ)
| # | Fitur | File | Status |
|---|-------|------|--------|
| 1 | Landing Page | `LandingPage.jsx` | ✅ Berfungsi |
| 2 | Register | `Register.jsx` | ✅ Terhubung ke backend |
| 3 | Login + JWT | `Login.jsx` + `AuthContext.jsx` | ✅ Token tersimpan di localStorage |
| 4 | Protected Routes | `ProtectedRoute.jsx` | ✅ Redirect ke /login jika belum auth |
| 5 | Dashboard Overview | `Dashboard.jsx` | ✅ 4 stat cards, 4 charts |
| 6 | Prediksi Saldo AI | Dashboard → prediction card | ✅ Terhubung ke AI |
| 7 | Financial Health Score | Dashboard → score donut | ✅ Breakdown 4 metrik |
| 8 | Rekomendasi AI | Dashboard → recommendation cards | ✅ Dinamis berdasarkan data |
| 9 | Tambah Transaksi | `AddTransaction.jsx` | ✅ Income + Expense |
| 10 | Riwayat Transaksi | `Transactions.jsx` | ✅ Filter, search, pagination |
| 11 | Edit Transaksi | `EditTransactionModal.jsx` | ✅ Modal edit |
| 12 | Hapus Transaksi | `Transactions.jsx` | ✅ Delete dengan konfirmasi |
| 13 | Manajemen Budget | `Budget.jsx` | ✅ CRUD + progress bar |
| 14 | Notifikasi Budget | `NotificationBell.jsx` | ✅ AI Insight (🤖) + budget alert |
| 15 | Profil & Settings | `Profile.jsx` | ✅ Update profil + budget per kategori |
| 16 | Sidebar + Navbar | `Sidebar.jsx`, `Navbar.jsx` | ✅ Responsive |
| 17 | Search Modal | `SearchModal.jsx` | ✅ Pencarian transaksi |
| 18 | Charts | `SpendingPieChart`, `DailyLineChart`, `MonthlyBarChart` | ✅ Recharts |

### Backend (finz-backend)
| # | Endpoint | Method | Auth | Status |
|---|----------|--------|------|--------|
| 1 | `/api/auth/register` | POST | 🔓 | ✅ |
| 2 | `/api/auth/login` | POST | 🔓 | ✅ |
| 3 | `/api/auth/me` | GET | 🔒 | ✅ |
| 4 | `/api/transactions` | GET | 🔒 | ✅ |
| 5 | `/api/transactions` | POST | 🔒 | ✅ |
| 6 | `/api/transactions/:id` | PUT | 🔒 | ✅ |
| 7 | `/api/transactions/:id` | DELETE | 🔒 | ✅ |
| 8 | `/api/dashboard` | GET | 🔒 | ✅ |
| 9 | `/api/predict/balance` | POST | 🔒 | ✅ |
| 10 | `/api/predict/category` | POST | 🔒 | ✅ |
| 11 | `/api/recommendation/:uid` | GET | 🔒 | ✅ |
| 12 | `/api/financial-score/:uid` | GET | 🔒 | ✅ |
| 13 | `/api/budget-alert/:uid/:month` | GET | 🔒 | ✅ (auto-generate) |
| 14 | `/api/budget-alert/generate` | POST | 🔒 | ✅ |
| 15 | `/api/budget-alert/:uid/history` | GET | 🔒 | ✅ |
| 16 | `/api/budget-alert/:uid/:bulan/read` | POST | 🔒 | ✅ |
| 17 | `/api/users/:id` | GET/PUT | 🔒 | ✅ |
| 18 | `/api/users/:id/budgets` | GET/POST | 🔒 | ✅ |
| 19 | `/api/users/:id/budgets/:bid` | DELETE | 🔒 | ✅ |
| 20 | `/api/ai/health` | GET | 🔓 | ✅ |

### AI Server (AI-master)
| # | Endpoint | Method | Fungsi | Status |
|---|----------|--------|--------|--------|
| 1 | `/predict/kategori` | POST | Klasifikasi kategori (TF-IDF + MLP) | ✅ |
| 2 | `/predict/saldo` | POST | Prediksi saldo akhir bulan (DNN) | ✅ |
| 3 | `/predict/batch` | POST | Batch klasifikasi + prediksi saldo | ✅ |
| 4 | `/alerts/generate` | POST | Generate budget alerts (Rule Engine) | ✅ |
| 5 | `/alerts/:uid/:bulan` | GET | Ambil alerts per bulan | ✅ |
| 6 | `/alerts/:uid/:bulan/read` | POST | Mark alert dibaca | ✅ |
| 7 | `/alerts/:uid/history` | GET | Riwayat semua bulan | ✅ |
| 8 | `/health` | GET | Health check + artifact status | ✅ |
| 9 | `/logs` | GET | Prediction logs | ✅ |
| 10 | `/logs/stats` | GET | Statistik prediksi | ✅ |

---

## 🔗 STATUS INTEGRASI AI ↔ BACKEND

| Alur | Backend File | AI Endpoint | Status |
|------|-------------|-------------|--------|
| Klasifikasi kategori transaksi | `aiService.predictCategory()` | `POST /predict/kategori` | ✅ Terhubung + fallback keyword |
| Prediksi saldo akhir bulan | `aiService.predictBalance()` | `POST /predict/saldo` | ✅ Terhubung + sanity check |
| Generate budget alerts | `aiService.generateBudgetAlerts()` | `POST /alerts/generate` | ✅ Terhubung |
| Ambil alert per bulan | `aiService.getBudgetAlerts()` | `GET /alerts/:uid/:bulan` | ✅ Terhubung |
| Mark alert dibaca | `aiService.markAlertRead()` | `POST /alerts/:uid/:bulan/read` | ✅ Terhubung |
| Riwayat alert | `aiService.getAlertHistory()` | `GET /alerts/:uid/history` | ✅ Terhubung |
| Health check | `aiClient.healthCheck()` | `GET /health` | ✅ Terhubung |
| Kategori mapping | `aiClient.mapAiCategory()` | — | ✅ 10 kategori AI ↔ 8 backend |

**Fallback saat AI down:**
- Klasifikasi → rule-based keyword matching (7 kategori, 100+ keyword)
- Prediksi saldo → rata-rata pengeluaran harian × sisa hari
- Budget alerts → hanya standard budget comparison (tanpa AI insight)

---

## ⚠️ ISU YANG MASIH ADA

### ISU-001: Alert Store In-Memory (Flask)
**Severity**: Medium  
AI Server menyimpan alert di `_alert_store` (dictionary Python in-memory). Jika Flask restart, semua alert hilang.

### ISU-002: Saldo Awal Hardcoded
**Severity**: Low  
`dashboardService.js` line 30: `const initialBalance = 2000000;` — saldo awal hardcoded Rp 2 juta.

### ISU-003: Rate Limit Terlalu Ketat
**Severity**: Medium  
Dashboard memicu banyak API call sekaligus. Limit 200/15min bisa terlampaui.

---

## 🛠️ SARAN PENGEMBANGAN

### 1. Pre-Processing Teks Deskripsi (High Priority)
Buat helper `sanitizeText()` sebelum kirim ke AI:
- Lowercase
- Hapus angka dan karakter spesial
- Trim whitespace
**File**: `src/services/aiService.js`

### 2. Naikkan Rate Limit API (High Priority)
Ubah `max: 200` → `max: 1000` di `src/app.js`. Pertimbangkan whitelist `/api/dashboard`.

### 3. Persistent Alert Storage (Medium Priority)
Pindahkan alert store dari in-memory dict ke SQLite/database agar tidak hilang saat restart.

### 4. Transaksi Recurring (Low Priority)
Tambah toggle "Pengeluaran Rutin" di AddTransaction. Field `is_recurring` sudah ada di model.

---

## ☁️ REKOMENDASI LAYANAN AWS

### Arsitektur Produksi yang Direkomendasikan

```
                    ┌─────────────┐
                    │ CloudFront  │  ← CDN untuk frontend
                    │   (CDN)     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
     ┌────────────────┐      ┌──────────────────┐
     │   S3 Bucket    │      │  ALB (Load       │
     │ (Frontend SPA) │      │   Balancer)      │
     └────────────────┘      └────────┬─────────┘
                                      │
                         ┌────────────┼────────────┐
                         ▼                         ▼
              ┌──────────────────┐      ┌──────────────────┐
              │   ECS Fargate    │      │   ECS Fargate    │
              │  (Backend API)   │      │  (AI Server)     │
              │   Node.js        │      │   Flask/TF       │
              └────────┬─────────┘      └──────────────────┘
                       │
              ┌────────┼────────┐
              ▼                 ▼
     ┌────────────────┐  ┌──────────────┐
     │   RDS MySQL    │  │ ElastiCache  │
     │  (Database)    │  │   (Redis)    │
     └────────────────┘  └──────────────┘
```

### Detail Layanan

| Layanan AWS | Fungsi untuk FinZ | Estimasi Biaya |
|-------------|-------------------|---------------|
| **S3 + CloudFront** | Hosting frontend React (SPA) sebagai static site. CloudFront sebagai CDN global untuk kecepatan akses | $1-5/bulan |
| **ECS Fargate (Backend)** | Menjalankan Express.js tanpa kelola server. Auto-scale berdasarkan traffic | $15-30/bulan |
| **ECS Fargate (AI)** | Menjalankan Flask AI server. Bisa scale terpisah dari backend karena beban AI lebih berat | $20-50/bulan |
| **RDS MySQL** | Database managed. Auto backup, failover, dan patching otomatis. Gunakan `db.t3.micro` untuk awal | $15-25/bulan |
| **ElastiCache (Redis)** | Cache untuk: rate limiting (ganti in-memory), session store, cache prediksi AI, alert store | $13-25/bulan |
| **ALB** | Load balancer untuk distribusi traffic ke backend + AI. Health check otomatis | $16-20/bulan |
| **ECR** | Container registry untuk simpan Docker image backend dan AI | $1-3/bulan |
| **CloudWatch** | Monitoring, logging, dan alerting untuk semua service | $5-10/bulan |
| **Secrets Manager** | Simpan JWT_SECRET, DB_PASSWORD, dan credentials lain secara aman | $1-2/bulan |
| **WAF** | Web Application Firewall di depan ALB untuk proteksi DDoS dan SQL injection | $5-10/bulan |

### Alternatif Hemat (Untuk Awal)

| Layanan | Alternatif Murah | Biaya |
|---------|-----------------|-------|
| ECS Fargate | **EC2 t3.small** (1 instance untuk backend + AI) | $15/bulan |
| RDS MySQL | **MySQL di EC2** (self-managed) | $0 (sudah di EC2) |
| ElastiCache | **Redis di EC2** (self-managed) | $0 |
| S3 + CF | **Vercel/Netlify** (free tier) | Gratis |

**Total estimasi minimum**: ~$15-20/bulan (1 EC2 + Vercel)  
**Total estimasi produksi**: ~$90-175/bulan (full AWS managed)

### Prioritas Implementasi AWS

| Fase | Layanan | Alasan |
|------|---------|--------|
| **Fase 1** | S3 + CloudFront | Frontend deploy cepat, murah |
| **Fase 1** | EC2 t3.small | Backend + AI dalam 1 server |
| **Fase 2** | RDS MySQL | Database managed, auto backup |
| **Fase 2** | ElastiCache Redis | Cache + rate limit distributed |
| **Fase 3** | ECS Fargate | Pisahkan backend dan AI ke container terpisah |
| **Fase 3** | ALB + WAF | Load balancing + keamanan produksi |

---

*© 2026 FinZ — CC26-PRU452*

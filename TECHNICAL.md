# TECHNICAL DOCUMENTATION
## FinZ — AI-Powered Personal Financial Advisor
**Version:** 1.0.0 | **Date:** 2026-06-01 | **Team:** CC26-PRU452

---

## 1. PROJECT OVERVIEW

FinZ adalah aplikasi manajemen keuangan pribadi berbasis AI yang dirancang untuk Gen-Z Indonesia. Sistem terdiri dari tiga layanan independen yang saling terhubung.

### 1.1 Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│   React 19 + Vite (SPA) — Deployed: Vercel                  │
│   Route: / → Landing | /login | /register | /dashboard      │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS / REST API (JWT Bearer)
┌──────────────────────▼──────────────────────────────────────┐
│                  BACKEND LAYER (Node.js)                     │
│   Express 4 + Sequelize 6 + Redis — Deployed: Vercel        │
│   Port: 8000 | Base: /api                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP (internal)
┌──────────────────────▼──────────────────────────────────────┐
│                   AI SERVICE LAYER (Python)                  │
│   Flask 3 + TensorFlow + Scikit-learn — Deployed: HuggingFace│
│   Port: 7860 | Docker Container                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. REPOSITORY STRUCTURE

### 2.1 Frontend — `/PROJECT/FinZ`
```
FinZ/
├── src/
│   ├── App.jsx              # Router utama (BrowserRouter)
│   ├── main.jsx             # Entry point React
│   ├── index.css            # Global styles (26KB)
│   ├── pages/
│   │   ├── LandingPage.jsx  # Halaman publik (32KB)
│   │   ├── Login.jsx        # Auth login
│   │   ├── Register.jsx     # Auth register
│   │   ├── Dashboard.jsx    # Dashboard utama (20KB)
│   │   ├── Transactions.jsx # Daftar transaksi (15KB)
│   │   ├── AddTransaction.jsx # Form tambah transaksi (14KB)
│   │   ├── Budget.jsx       # Manajemen budget (12KB)
│   │   ├── Profile.jsx      # Profil user (11KB)
│   │   └── Statistik.jsx    # Statistik keuangan
│   ├── components/
│   │   ├── ChatbotUI.jsx    # AI Chatbot floating (18KB)
│   │   ├── Sidebar.jsx      # Navigasi desktop
│   │   ├── Navbar.jsx       # Top navigation
│   │   ├── BottomNav.jsx    # Mobile navigation
│   │   ├── MobileHeader.jsx # Header mobile
│   │   ├── NotificationBell.jsx # Budget alerts
│   │   ├── SearchModal.jsx  # Global search
│   │   ├── EditTransactionModal.jsx # Edit transaksi
│   │   ├── ProtectedRoute.jsx # Auth guard
│   │   ├── Card.jsx         # UI card
│   │   ├── charts/          # Recharts components
│   │   └── ui/              # UI primitives
│   ├── context/
│   │   ├── AuthContext.jsx  # Global auth state
│   │   └── FinanceContext.jsx # Global finance state
│   ├── services/
│   │   └── api.js           # Axios instance + API modules
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Helper functions
│   └── data/                # Static data
├── public/
├── index.html
├── vite.config.js
├── vercel.json              # SPA rewrite rules
└── package.json
```

### 2.2 Backend — `/PROJECT/finz-backend`
```
finz-backend/
├── src/
│   ├── server.js            # Entry point (DB + server boot)
│   ├── app.js               # Express config + middleware
│   ├── controllers/
│   │   ├── authController.js      # Register/Login/Me
│   │   ├── transactionController.js # CRUD transaksi
│   │   ├── budgetController.js    # CRUD budget
│   │   ├── budgetAlertController.js # Alert management
│   │   ├── dashboardController.js # Dashboard summary
│   │   ├── aiController.js        # AI predict proxy
│   │   ├── chatController.js      # AI chatbot proxy
│   │   ├── userController.js      # User profile CRUD
│   │   └── adminController.js     # Admin utilities
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── budgetRoutes.js
│   │   ├── budgetAlertRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── aiRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── userRoutes.js
│   │   └── adminRoutes.js
│   ├── models/
│   │   ├── index.js         # Sequelize init + associations
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   ├── Budget.js
│   │   └── PredictionLog.js
│   ├── services/
│   │   ├── aiService.js     # AI logic + fallback (25KB)
│   │   ├── aiClient.js      # Flask API HTTP client (10KB)
│   │   ├── geminiService.js # Google Gemini (disabled)
│   │   ├── dashboardService.js
│   │   ├── transactionService.js
│   │   ├── budgetService.js
│   │   ├── cacheService.js  # Redis wrapper
│   │   └── circuitBreaker.js # Opossum circuit breaker
│   ├── middlewares/
│   │   ├── authMiddleware.js  # JWT verify
│   │   ├── ownershipCheck.js  # IDOR prevention
│   │   ├── validators.js      # express-validator rules
│   │   ├── requestLogger.js   # Winston HTTP logger
│   │   └── errorHandler.js    # Global error handler
│   ├── migrations/
│   │   ├── 20260522-001-create-users.js
│   │   ├── 20260522-002-create-transactions.js
│   │   ├── 20260522-003-create-budgets.js
│   │   └── 20260522-004-create-prediction-logs.js
│   ├── config/
│   │   ├── redis.js
│   │   └── logger.js
│   └── utils/
├── .env.example
├── .sequelizerc
├── vercel.json
└── package.json
```

### 2.3 AI Service — `/PROJECT/AI-Deploy`
```
AI-Deploy/
├── app.py                   # Flask main app (24KB, 616 lines)
├── rule_engine.py           # Rule Matrix Engine (11KB)
├── ai_chat.py               # Chat konsultasi AI (7KB)
├── budget_alert.py          # Budget alert system (8KB)
├── financial_health.py      # Financial health engine (13KB)
├── prediction_logs.py       # SQLite prediction logging (6KB)
├── feedback_pipeline.py     # Feedback & retraining (11KB)
├── users_budgets.py         # User budget management (9KB)
├── Dockerfile               # Docker image (python:3.11-slim)
├── docker-compose.yml
├── docker-entrypoint.sh
├── requirements-prod.txt
├── *.keras                  # TF/Keras trained models
└── *.pkl                    # Scikit-learn artifacts
```

---

## 3. TECHNOLOGY STACK

### 3.1 Frontend
| Komponen | Teknologi | Versi |
|---|---|---|
| Framework | React | 19.2.5 |
| Build Tool | Vite | 8.0.4 |
| Routing | React Router DOM | 7.14.0 |
| HTTP Client | Axios | 1.15.0 |
| Charts | Recharts | 3.8.1 |
| Icons | Phosphor Icons | 2.1.10 |
| Styling | Vanilla CSS + Tailwind | CSS Modules |
| Deployment | Vercel (SPA) | — |

### 3.2 Backend
| Komponen | Teknologi | Versi |
|---|---|---|
| Runtime | Node.js | LTS |
| Framework | Express | 4.19.2 |
| ORM | Sequelize | 6.37.3 |
| Database | PostgreSQL | — |
| Cache | Redis (ioredis) | 5.10.1 |
| Auth | JWT (jsonwebtoken) | 9.0.3 |
| Password | bcryptjs | 3.0.3 |
| Security | Helmet, HPP, CORS | — |
| Rate Limit | express-rate-limit + Redis | 8.5.2 |
| Circuit Breaker | Opossum | 9.0.0 |
| Logging | Winston | 3.19.0 |
| Validation | express-validator | 7.2.0 |
| Deployment | Vercel (Serverless) | — |

### 3.3 AI Service
| Komponen | Teknologi | Versi |
|---|---|---|
| Runtime | Python | 3.11 |
| Framework | Flask | ≥3.0.0 |
| ML Framework | TensorFlow/Keras | ≥2.13.0 |
| ML Tools | Scikit-learn | ≥1.3.0 |
| Data | Pandas, NumPy | ≥2.0.0, ≥1.24.0 |
| WSGI Server | Gunicorn | ≥21.0.0 |
| Container | Docker (python:3.11-slim) | — |
| Deployment | HuggingFace Spaces | — |

---

## 4. DATABASE SCHEMA

### 4.1 Tabel: `users`
| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | UUID | PK, NOT NULL | gen_random_uuid() |
| name | STRING | NOT NULL | Nama lengkap |
| email | STRING | NOT NULL, UNIQUE | Email login |
| password | STRING | NOT NULL | bcrypt hash |
| monthly_income | DECIMAL(15,2) | DEFAULT 0 | Pemasukan bulanan |
| initial_balance | DECIMAL(15,2) | DEFAULT 0 | Saldo awal |
| age | INTEGER | NULL | Usia |
| occupation | ENUM | DEFAULT 'karyawan' | mahasiswa/karyawan/freelancer/wirausaha/lainnya |
| financial_goal | ENUM | DEFAULT 'dana_darurat' | hemat/investasi/bebas_utang/dana_darurat |
| risk_profile | ENUM | DEFAULT 'konservatif' | konservatif/moderat/agresif |
| created_at | DATE | NOT NULL | Timestamp |
| updated_at | DATE | NOT NULL | Timestamp |

### 4.2 Tabel: `transactions`
| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | UUID | PK, NOT NULL | gen_random_uuid() |
| user_id | UUID | FK → users.id | CASCADE DELETE |
| amount | DECIMAL(15,2) | NOT NULL | Nominal (Rp) |
| category | ENUM | NOT NULL | makanan/transport/hiburan/belanja/tagihan/pendidikan/kesehatan/pemasukan/gaji/bonus/investasi/lainnya |
| description | STRING(255) | DEFAULT '' | Deskripsi |
| payment_method | ENUM | DEFAULT 'cash' | cash/debit/credit/ewallet/transfer/qris |
| transaction_type | ENUM | DEFAULT 'expense' | expense/income |
| hour_of_day | SMALLINT | NULL | Jam transaksi (0-23) |
| is_recurring | BOOLEAN | DEFAULT false | Transaksi rutin |
| date | DATEONLY | NOT NULL | YYYY-MM-DD |
| created_at | DATE | NOT NULL | Timestamp |

**Indexes:** user_id, category, date, transaction_type

### 4.3 Tabel: `budgets`
| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | UUID | PK, NOT NULL | gen_random_uuid() |
| user_id | UUID | FK → users.id | CASCADE DELETE |
| category | ENUM | NOT NULL | makanan/transport/hiburan/belanja/tagihan/pendidikan/kesehatan/lainnya |
| limit_amount | DECIMAL(15,2) | DEFAULT 0 | Batas budget |
| month | STRING(7) | NOT NULL | Format YYYY-MM |
| created_at | DATE | NOT NULL | Timestamp |
| updated_at | DATE | NOT NULL | Timestamp |

### 4.4 Tabel: `prediction_logs`
| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | UUID | PK, NOT NULL | gen_random_uuid() |
| user_id | UUID | FK → users.id | CASCADE DELETE |
| input_text | STRING(500) | NOT NULL | Deskripsi input |
| predicted_category | STRING(50) | NOT NULL | Hasil prediksi AI |
| confidence | DECIMAL(3,2) | NULL | Skor 0.00–1.00 |
| model_version | STRING(20) | DEFAULT 'rule-v1' | Versi model |
| user_overridden | BOOLEAN | DEFAULT false | User koreksi prediksi? |
| final_category | STRING(50) | NULL | Kategori final |
| created_at | DATE | NOT NULL | Timestamp |

**Indexes:** user_id, predicted_category, created_at

---

## 5. API REFERENCE

### 5.1 Authentication (`/api/auth`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | /api/auth/register | ❌ | Registrasi user baru |
| POST | /api/auth/login | ❌ | Login, return JWT |
| GET | /api/auth/me | ✅ | Data user aktif |

**Rate Limit Auth:** 10 req / 15 menit per IP

### 5.2 Transactions (`/api/transactions`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/transactions | ✅ | List + filter transaksi |
| GET | /api/transactions/:id | ✅ | Detail transaksi |
| POST | /api/transactions | ✅ | Buat transaksi baru |
| PUT | /api/transactions/:id | ✅ | Update transaksi |
| DELETE | /api/transactions/:id | ✅ | Hapus transaksi |

### 5.3 Dashboard (`/api/dashboard`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/dashboard | ✅ | Summary keuangan bulan ini |

### 5.4 AI & Prediction (`/api/predict`, `/api/recommendation`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/ai/health | ❌ | Status koneksi AI service |
| POST | /api/predict/balance | ✅ | Prediksi saldo akhir bulan |
| POST | /api/predict/category | ✅ | Klasifikasi kategori transaksi |
| GET | /api/recommendation/:user_id | ✅ | Rekomendasi finansial |
| GET | /api/financial-score/:user_id | ✅ | Financial health score |

### 5.5 Budget Alert (`/api/budget-alert`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | /api/budget-alert/generate | ✅ | Generate alerts bulanan |
| GET | /api/budget-alert/:user_id/:bulan | ✅ | Ambil alerts |
| POST | /api/budget-alert/:user_id/:bulan/read | ✅ | Tandai dibaca |
| GET | /api/budget-alert/:user_id/history | ✅ | Riwayat alerts |

### 5.6 Budget (`/api/budgets`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/users/:id/budgets | ✅ | List budget user |
| POST | /api/users/:id/budgets | ✅ | Buat/update budget |
| DELETE | /api/users/:id/budgets/:budgetId | ✅ | Hapus budget |

### 5.7 User (`/api/users`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/users/:id | ✅ | Profil user |
| PUT | /api/users/:id | ✅ | Update profil |

### 5.8 Chat (`/api/chat`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | /api/chat/ask | ✅ | Tanya AI chatbot |

**Rate Limit API:** 500 req / 15 menit per IP (Redis-backed)

---

## 6. AI SERVICE ENDPOINTS

### Flask API (HuggingFace, Port 7860)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | / | Health + endpoint list |
| GET | /health | Cek artifacts (model files) |
| POST | /predict/kategori | Klasifikasi kategori (TF-IDF + MLP) |
| POST | /predict/saldo | Prediksi saldo akhir bulan (DNN Timeseries) |
| POST | /predict/batch | Batch klasifikasi multi-transaksi |
| POST | /alerts/generate | Generate budget alerts (Rule Engine) |
| GET | /alerts/:user_id/:bulan | Ambil alerts |
| POST | /alerts/:user_id/:bulan/read | Tandai alert dibaca |
| GET | /alerts/:user_id/history | Riwayat alerts |
| POST | /chat | AI konsultasi keuangan |
| POST | /health/score | Financial health score |
| GET | /logs | Prediction logs |
| GET | /logs/stats | Log statistics |

---

## 7. AI/ML MODELS

### 7.1 Transaction Classifier
- **File:** `finz_transaction_classifier.keras`
- **Arsitektur:** Multi-input (Text + Numeric)
  - Text: TF-IDF vectorizer → custom AttentionPooling layer
  - Numeric: 7 fitur → StandardScaler → Dense
- **Output:** Klasifikasi ke 12 kategori transaksi
- **Confidence:** Softmax probability score

### 7.2 Balance Forecasting (Timeseries)
- **File:** `finz_timeseries_forecasting.keras`
- **Arsitektur:** DNN Regressor dengan custom `CustomHuberLoss`
- **Input:** Sequence 30 hari × 5 fitur (income, pengeluaran, saldo, hari_di_bulan, hari_di_minggu)
- **Output:** Prediksi saldo akhir bulan (IDR)
- **Scaler:** RobustScaler (X), MinMaxScaler/RobustScaler (Y)

### 7.3 Rule Matrix Engine
- **File:** `rule_engine.py`
- **Rules:**
  - R01: Rasio pengeluaran vs income (threshold: 80%, 100%)
  - R02: Prediksi saldo akhir negatif / < 20% saldo awal
  - R03: Budget per kategori terlampaui (80%, 100%)
  - R04: Tidak ada alokasi investasi/tabungan
  - R05: Pengeluaran hiburan dominan (>25% total)
  - R06: Penurunan saldo drastis (>30%, >50%)
- **Skor:** 100 - (danger×25) - (warning×10), range 0–100

### 7.4 Financial Health Engine
- **File:** `financial_health.py`
- **Komponen:** Saving Ratio, Spending Consistency, Category Diversity, Bill Payment
- **Bobot:** 35% / 30% / 20% / 15%
- **Grade:** A (≥85) / B (≥70) / C (≥55) / D (≥40) / E (<40)

---

## 8. SECURITY

### 8.1 Authentication & Authorization
- **JWT:** Bearer token, expires 7d, stored in localStorage
- **Password:** bcrypt hash (salt rounds: default)
- **IDOR Protection:** `ownershipCheck` middleware validasi user_id === token user_id

### 8.2 API Security
- **Helmet.js:** HTTP security headers (CSP, XSS, HSTS, dll)
- **HPP:** HTTP Parameter Pollution protection
- **CORS:** Whitelist origin (Vercel URL + localhost)
- **Rate Limiting:** Redis-backed, dual tier (auth: 10/15min, api: 500/15min)
- **Body Limit:** 1MB max JSON payload
- **Validation:** express-validator pada semua input endpoint

### 8.3 AI Service
- **CORS:** Flask-CORS (all origins — internal service)
- **Input Validation:** Type checking, shape validation sebelum model inference

---

## 9. CACHING STRATEGY

### Redis Cache Keys & TTL
| Key Pattern | TTL | Deskripsi |
|---|---|---|
| `finz:pred:{userId}:balance` | 5 menit | Hasil prediksi saldo |
| `finz:rec:{userId}` | 1 jam | Rekomendasi finansial |
| `finz:score:{userId}` | 30 menit | Financial health score |
| `finz:dash:{userId}` | 5 menit | Dashboard summary |
| `finz:rl:auth:{ip}` | 15 menit | Auth rate limit counter |
| `finz:rl:api:{ip}` | 15 menit | API rate limit counter |

### AI Service Cache
- **In-process model cache:** Model Keras & artifacts (.pkl) di-load sekali, cached dalam dict Python `_cache`
- **Prediction result cache:** MD5 hash payload → hasil prediksi, max 500 entries

---

## 10. FRONTEND ARCHITECTURE

### 10.1 State Management
- **AuthContext:** User session, token, login/logout actions
- **FinanceContext:** Transactions, dashboard data, budgets

### 10.2 Routing
| Path | Komponen | Auth |
|---|---|---|
| / | LandingPage | ❌ |
| /login | Login | ❌ |
| /register | Register | ❌ |
| /dashboard | Dashboard | ✅ |
| /transactions | Transactions | ✅ |
| /add | AddTransaction | ✅ |
| /budget | Budget | ✅ |
| /profile | Profile | ✅ |
| /statistik | Statistik | ✅ |

### 10.3 API Service Layer (`src/services/api.js`)
- Axios instance dengan baseURL dari env
- Request interceptor: auto-attach JWT Bearer
- Response interceptor: auto-logout pada 401
- API modules: `authAPI`, `transactionAPI`, `dashboardAPI`, `userAPI`, `budgetAPI`, `budgetAlertAPI`, `predictionAPI`, `recommendationAPI`, `chatAPI`

### 10.4 Layout
- **Desktop:** Sidebar + Navbar + main content
- **Mobile:** MobileHeader + main content + BottomNav
- **Global:** ChatbotUI (floating), NotificationBell

---

## 11. DEPLOYMENT

### 11.1 Frontend (Vercel)
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
- Build: `npm run build` → `dist/`
- SPA routing via Vercel rewrite rules

### 11.2 Backend (Vercel Serverless)
```json
{
  "builds": [{ "src": "src/app.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/app.js" }]
}
```
- Entry: `src/app.js` (Express)
- Requires: PostgreSQL + Redis external (Supabase/Upstash)

### 11.3 AI Service (HuggingFace Spaces)
```dockerfile
FROM python:3.11-slim
EXPOSE 7860
ENV PORT=7860
HEALTHCHECK CMD curl -f http://localhost:7860/health || exit 1
ENTRYPOINT ["/app/docker-entrypoint.sh"]
```
- WSGI: Gunicorn
- Health check: GET /health → artifacts readiness

---

## 12. ENVIRONMENT VARIABLES

### Backend (`.env`)
```env
PORT=8000
NODE_ENV=production
DB_HOST=<postgres-host>
DB_PORT=5432
DB_NAME=<db-name>
DB_USER=<db-user>
DB_PASSWORD=<db-password>
REDIS_HOST=<redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>
REDIS_DB=0
CLIENT_URL=https://<frontend-url>
AI_API_URL=https://<huggingface-space-url>
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
APP_NAME=FinZ Backend API
GEMINI_API_KEY=<optional>
```

### Frontend (`.env`)
```env
VITE_API_BASE_URL=https://<backend-url>/api
```

---

## 13. DEVELOPMENT SETUP

### Prerequisites
- Node.js ≥ 18, Python ≥ 3.9, PostgreSQL, Redis

### Backend
```bash
cd finz-backend
cp .env.example .env   # isi konfigurasi
npm install
npm run migrate        # jalankan migrasi DB
npm run seed           # opsional: seed data
npm run dev            # port 8000
```

### Frontend
```bash
cd FinZ
npm install
npm run dev            # port 5173
```

### AI Service
```bash
cd AI-Deploy
pip install -r requirements-prod.txt
python app.py          # port 5000 (dev) / 7860 (docker)
# atau
docker build -t finz-ai . && docker run -p 7860:7860 finz-ai
```

---

## 14. ERROR HANDLING

### Backend
- `errorHandler.js`: Global Express error handler (last middleware)
- Format: `{ success: false, message: string, errors?: [] }`
- 404 handler untuk route tidak ditemukan
- Winston logger: console + file transport

### AI Service
- HTTP 400: Input validation error
- HTTP 500: Model inference error
- HTTP 206: Degraded (artifact missing)
- Fallback: Rule-based logic jika ML model gagal

### Frontend
- Axios response interceptor: pesan error dari API
- Auto-redirect ke /login pada 401
- Toast/alert untuk error user-facing

---

## 15. KNOWN LIMITATIONS & NOTES

1. **AI Models:** `.keras` model files placeholder (133 bytes) — model asli di HuggingFace
2. **Gemini Integration:** Kode ada di `geminiService.js` namun di-disable; AI utama via HuggingFace
3. **Vercel Backend:** Serverless — Redis & PostgreSQL harus external service
4. **Prediction Logs:** Disimpan di SQLite (`finz.db`) di AI service, terpisah dari PostgreSQL backend
5. **CORS AI Service:** Semua origin diizinkan (internal service), tidak untuk public exposure

---

*Generated: 2026-06-01 | FinZ CC26-PRU452*

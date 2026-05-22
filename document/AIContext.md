# 🤖 AIContext — FinZ Backend Overhaul

> **Tujuan dokumen ini**: Memberikan konteks lengkap kepada AI Agent agar dapat menyelesaikan task rombak backend FinZ dengan benar, tanpa ambigu, dan tanpa bertanya ulang.

---

## 📌 PROJECT IDENTITY

- **Nama**: FinZ — AI-Powered Personal Financial Advisor
- **Stack saat ini**: Node.js + Express.js + Sequelize ORM + MySQL + Flask AI API
- **Stack target**: Node.js + Express.js + Sequelize ORM + **PostgreSQL** + **Redis** + Flask AI API
- **Root path backend**: `/home/masbay/PROJECT/finz-backend`
- **Root path AI server**: `/home/masbay/PROJECT/AI-master`
- **Root path frontend**: `/home/masbay/PROJECT/FinZ`

---

## 🎯 OBJECTIVE

Rombak backend dari arsitektur MVP menjadi **production-grade** dengan:
1. **Migrasi database MySQL → PostgreSQL**
2. **Migrasi primary key Integer AUTO_INCREMENT → UUID v4**
3. **Integrasi Redis** untuk caching, rate limiting, dan session
4. **Optimasi kode**: hapus duplikasi, fix anti-pattern, tambah pagination
5. **Penguatan AI integration**: circuit breaker, caching, text sanitizer
6. **Production hardening**: migrations, Docker, logging, security headers

---

## 📂 CURRENT FILE MAP

```
finz-backend/
├── .env                          # ⚠️ Contains secrets, committed to git
├── package.json                  # Dependencies: mysql2, sequelize, express, etc.
├── src/
│   ├── app.js                    # Express config, middleware, routing (127 lines)
│   ├── server.js                 # Entry point, DB connect, sync() (52 lines)
│   ├── config/
│   │   └── database.js           # Sequelize MySQL config (27 lines)
│   ├── controllers/
│   │   ├── authController.js     # Register, login, me (164 lines)
│   │   ├── transactionController.js  # CRUD transactions (145 lines)
│   │   ├── dashboardController.js    # Proxy to dashboardService (17 lines)
│   │   ├── budgetAlertController.js  # Complex: 6+ DB queries (213 lines)
│   │   ├── budgetController.js   # ⚠️ NOT REGISTERED in app.js (dead code)
│   │   ├── userController.js     # Profile + budget CRUD (222 lines)
│   │   ├── aiController.js       # All AI endpoints (275 lines)
│   │   └── adminController.js    # ⚠️ NOT REGISTERED in app.js (dead code)
│   ├── middlewares/
│   │   ├── authMiddleware.js     # JWT verify + DB user check (74 lines)
│   │   ├── verifyToken.js        # ⚠️ DUPLICATE of authMiddleware (61 lines) — DELETE
│   │   ├── errorHandler.js       # Global error handler (30 lines)
│   │   ├── requestLogger.js      # Console request logger (20 lines)
│   │   └── validators.js         # express-validator rules (163 lines)
│   ├── models/
│   │   ├── index.js              # Model registry + associations (56 lines)
│   │   ├── User.js               # id:INT, bcrypt hooks (94 lines)
│   │   ├── Transaction.js        # ⚠️ HAS DUPLICATE FIELDS (136 lines)
│   │   ├── Budget.js             # id:INT, category ENUM (57 lines)
│   │   └── PredictionLog.js      # ⚠️ NO user_id FK (75 lines)
│   ├── services/
│   │   ├── aiClient.js           # Axios HTTP wrapper to Flask (232 lines)
│   │   ├── aiService.js          # Business logic + fallback (573 lines)
│   │   ├── dashboardService.js   # Dashboard aggregation (139 lines)
│   │   └── transactionService.js # Transaction CRUD (121 lines)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── budgetAlertRoutes.js
│   │   ├── budgetRoutes.js       # ⚠️ NOT REGISTERED
│   │   ├── userRoutes.js
│   │   ├── aiRoutes.js
│   │   └── adminRoutes.js        # ⚠️ NOT REGISTERED
│   └── database/
│       ├── seeder.js
│       └── customSeeder.js
```

---

## 🐛 KNOWN BUGS & ANTI-PATTERNS TO FIX

### CRITICAL
| ID | Issue | File | Line(s) | Fix |
|----|-------|------|---------|-----|
| BUG-01 | **Duplicate auth middleware** | `verifyToken.js` + `authMiddleware.js` | All | DELETE `verifyToken.js`, use only `authMiddleware.js` |
| BUG-02 | **Duplicate fields in Transaction model** | `Transaction.js` | L72-88 dan L94-114 | Remove second definition (L94-114) |
| BUG-03 | **IDOR vulnerability** | `userController.js` | L11-31 | Add `req.user.id === req.params.id` check |
| BUG-04 | **`sequelize.sync()` in production** | `server.js` | L24 | Replace with Sequelize migrations |
| BUG-05 | **Hardcoded `initialBalance = 2000000`** | `dashboardService.js` L30, `budgetAlertController.js` L88 | Calculate from data |
| BUG-06 | **`user_id` default 1** | `Transaction.js` L23, `transactionService.js` L72 | Remove default, require from JWT |
| BUG-07 | **Different JWT fallback secrets** | `authMiddleware.js` L14, `verifyToken.js` L27 | Single config, throw if missing |
| BUG-08 | **Redundant `Op` import inside function** | `aiService.js` L350, L402 | Remove inner imports, use top-level |
| BUG-09 | **No pagination** | `transactionService.js` L50-53 | Add `findAndCountAll` with limit/offset |
| BUG-10 | **Dead routes not registered** | `app.js` | Add `budgetRoutes` and `adminRoutes` |
| BUG-11 | **PredictionLog no user_id** | `PredictionLog.js` | Add `user_id` UUID FK |
| BUG-12 | **Health check exposes AI URL** | `app.js` L83 | Remove from public response |
| BUG-13 | **No body size limit** | `app.js` L66 | Add `{ limit: '1mb' }` |
| BUG-14 | **Fire-and-forget no tracking** | `dashboardService.js` L63-92 | Add error tracking via logger |

---

## 🔄 MIGRATION RULES

### Database: MySQL → PostgreSQL

| MySQL | PostgreSQL (via Sequelize) |
|-------|---------------------------|
| `dialect: 'mysql'` | `dialect: 'postgres'` |
| Port `3306` | Port `5432` |
| `mysql2` package | `pg` + `pg-hstore` packages |
| `INT UNSIGNED AUTO_INCREMENT` | `UUID` with `UUIDV4` default |
| `TINYINT` | `SMALLINT` |
| `ENUM(...)` | PostgreSQL native ENUM (Sequelize handles) |
| `DECIMAL(15,2)` | Same (native support) |
| `DATEONLY` | Same |
| `BOOLEAN` (tinyint) | Native `BOOLEAN` |

### Primary Key: Integer → UUID

**Every model** must change:
```javascript
// BEFORE
id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }

// AFTER
id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }
```

**Every FK** must change:
```javascript
// BEFORE
user_id: { type: DataTypes.INTEGER.UNSIGNED, ... }

// AFTER  
user_id: { type: DataTypes.UUID, ... }
```

**Every controller/service** parsing IDs:
```javascript
// BEFORE
const userId = parseInt(req.params.user_id);

// AFTER
const userId = req.params.user_id; // UUID is already a string
```

**Add UUID validation middleware**:
```javascript
const { param } = require('express-validator');
const validateUUID = (paramName) => param(paramName).isUUID(4).withMessage(`${paramName} harus berupa UUID valid`);
```

---

## 🔴 ARCHITECTURE FLOW (TARGET)

```
Client (React)
    │
    ▼
┌─────────────────────────────────────────────┐
│  Express.js Backend                         │
│  ┌──────────────────────────────────────┐   │
│  │  Middleware Chain                     │   │
│  │  CORS → Helmet → Compression →       │   │
│  │  BodyParser(1mb) → Logger →          │   │
│  │  RateLimiter(Redis) → Auth(JWT)      │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  Routes → Controllers → Services    │   │
│  │                │                     │   │
│  │         ┌──────┴──────┐              │   │
│  │         ▼             ▼              │   │
│  │    ┌─────────┐  ┌──────────┐         │   │
│  │    │ Cache   │  │ Circuit  │         │   │
│  │    │ Service │  │ Breaker  │         │   │
│  │    │ (Redis) │  │(opossum) │         │   │
│  │    └────┬────┘  └────┬─────┘         │   │
│  │         │             │              │   │
│  │    ┌────▼────┐  ┌────▼─────┐         │   │
│  │    │  Redis  │  │ Flask AI │         │   │
│  │    │  Cache  │  │   API    │         │   │
│  │    └─────────┘  └──────────┘         │   │
│  └──────────────────────────────────────┘   │
│                    │                        │
│             ┌──────▼──────┐                 │
│             │ PostgreSQL  │                 │
│             │ (UUID PKs)  │                 │
│             └─────────────┘                 │
└─────────────────────────────────────────────┘
```

### Redis Cache Strategy (KEY → TTL)

| Key Pattern | TTL | Invalidated By |
|-------------|-----|----------------|
| `cache:ai:health` | 30s | Auto-expire |
| `cache:dashboard:{userId}` | 60s | Transaction CRUD |
| `cache:prediction:{userId}:balance` | 300s | Transaction CRUD |
| `cache:prediction:{userId}:category` | 300s | N/A (per-request) |
| `cache:score:{userId}` | 300s | Transaction CRUD |
| `cache:reco:{userId}` | 600s | Transaction CRUD |
| `cache:alerts:{userId}:{month}` | 120s | Budget CRUD, Transaction CRUD |

---

## 📦 PACKAGE CHANGES

### Add
```
pg pg-hstore ioredis rate-limit-redis opossum helmet compression winston hpp uuid sequelize-cli
```

### Remove
```
mysql2
```

---

## 🗃️ NEW FILES TO CREATE

| File | Purpose |
|------|---------|
| `src/config/redis.js` | Redis client (ioredis) |
| `src/config/logger.js` | Winston structured logger |
| `src/services/cacheService.js` | Redis cache get/set/del with TTL |
| `src/services/circuitBreaker.js` | Opossum circuit breaker for AI |
| `src/services/budgetService.js` | Consolidated budget logic |
| `src/middlewares/ownershipCheck.js` | IDOR protection |
| `src/utils/textSanitizer.js` | Clean text before AI |
| `src/migrations/001-create-users.js` | PostgreSQL migration |
| `src/migrations/002-create-transactions.js` | PostgreSQL migration |
| `src/migrations/003-create-budgets.js` | PostgreSQL migration |
| `src/migrations/004-create-prediction-logs.js` | PostgreSQL migration |
| `Dockerfile` | Container build |
| `docker-compose.yml` | PostgreSQL + Redis + Backend |
| `.env.example` | Template env (no secrets) |
| `.sequelizerc` | Sequelize CLI paths config |

## 🗑️ FILES TO DELETE

| File | Reason |
|------|--------|
| `src/middlewares/verifyToken.js` | Duplicate of authMiddleware.js |
| `finz_db_structure.sql` | Replaced by migrations |
| `finz_db_backup.sql` | Replaced by seeders |

---

## 📐 MODEL SCHEMAS (TARGET — PostgreSQL + UUID)

### User
```javascript
{
  id: UUID (PK, default UUIDV4),
  name: STRING(255),
  email: STRING(255) UNIQUE,
  password: STRING(255),       // bcrypt hashed
  monthly_income: DECIMAL(15,2) DEFAULT 0,
  initial_balance: DECIMAL(15,2) DEFAULT 0,  // NEW: replaces hardcoded 2000000
  age: INTEGER NULL,
  occupation: ENUM('mahasiswa','karyawan','freelancer','wirausaha','lainnya'),
  financial_goal: ENUM('hemat','investasi','bebas_utang','dana_darurat'),
  risk_profile: ENUM('konservatif','moderat','agresif'),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
}
```

### Transaction
```javascript
{
  id: UUID (PK),
  user_id: UUID (FK → users.id, CASCADE),
  amount: DECIMAL(15,2) NOT NULL,
  category: ENUM('makanan','transport','hiburan','belanja','tagihan','pendidikan','kesehatan','pemasukan','gaji','bonus','investasi','lainnya'),
  description: STRING(255) DEFAULT '',
  payment_method: ENUM('cash','debit','credit','ewallet','transfer','qris') DEFAULT 'cash',
  transaction_type: ENUM('expense','income') DEFAULT 'expense',  // HANYA SATU KALI
  date: DATEONLY NOT NULL,
  hour_of_day: SMALLINT NULL (0-23),  // HANYA SATU KALI
  is_recurring: BOOLEAN DEFAULT false, // HANYA SATU KALI
  created_at: TIMESTAMP,
}
```

### Budget
```javascript
{
  id: UUID (PK),
  user_id: UUID (FK → users.id, CASCADE),
  category: ENUM('makanan','transport','hiburan','belanja','tagihan','pendidikan','kesehatan','lainnya'),
  limit_amount: DECIMAL(15,2) DEFAULT 0,
  month: STRING(7),  // 'YYYY-MM'
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
}
```

### PredictionLog
```javascript
{
  id: UUID (PK),
  user_id: UUID (FK → users.id, CASCADE),  // NEW FIELD
  input_text: STRING(500),
  predicted_category: STRING(50),
  confidence: DECIMAL(5,4) NULL,  // Extended precision
  model_version: STRING(20) DEFAULT 'rule-v1',
  user_overridden: BOOLEAN DEFAULT false,
  final_category: STRING(50) NULL,
  created_at: TIMESTAMP,
}
```

---

## 🔗 AI INTEGRATION CONTEXT

### Flask AI API Endpoints (Port 5000)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/predict/kategori` | Classify transaction category |
| POST | `/predict/saldo` | Predict end-of-month balance |
| POST | `/predict/batch` | Batch classify + predict |
| POST | `/alerts/generate` | Generate budget alerts |
| GET | `/alerts/:uid/:bulan` | Get alerts per month |
| POST | `/alerts/:uid/:bulan/read` | Mark alert as read |
| GET | `/alerts/:uid/history` | Alert history all months |
| GET | `/health` | Health check + artifact status |

### Category Mapping (AI ↔ Backend)
```javascript
const AI_TO_BACKEND = {
  'Tagihan': 'tagihan',
  'Makan & Minum': 'makanan',
  'Transportasi': 'transport',
  'Hiburan': 'hiburan',
  'Belanja Online': 'belanja',
  'Pendidikan': 'pendidikan',
  'Kesehatan': 'kesehatan',
  'Perawatan Diri': 'lainnya',
  'Investasi & Tabungan': 'lainnya',
  'Keluarga & Sosial': 'lainnya',
};
```

### Fallback Strategy (When AI is Down)
- **Category classification** → Rule-based keyword matching (7 categories, 100+ keywords)
- **Balance prediction** → Average daily spending × remaining days
- **Budget alerts** → Simple budget comparison (no AI insight)
- **Recommendations** → Template-based threshold logic
- **Financial score** → Weighted formula (saving_ratio, consistency, diversity, bills)

### Circuit Breaker Config
```javascript
{
  timeout: 10000,                  // 10s per call
  errorThresholdPercentage: 50,    // Open at 50% failure
  resetTimeout: 30000,             // Try again after 30s
  volumeThreshold: 5,              // Min 5 calls before evaluation
}
```

---

## ⚠️ IMPORTANT CONSTRAINTS

1. **DO NOT change AI Server** (Flask/Python) — only change Node.js backend
2. **DO NOT change Frontend** (React) API contracts — response shape must stay compatible
3. **Preserve all existing endpoint paths** — frontend depends on these URLs
4. **UUID format**: Use UUID v4 (e.g., `finz:51d03873-9455-457b-910e-a50d4786c42c`)
5. **Redis key prefix**: Always use `finz:` prefix for namespacing
6. **Timezone**: All dates in WIB (+07:00)
7. **Category ENUMs**: Must match exactly — no renaming
8. **Sequelize version**: Stay on v6.x (don't upgrade to v7)
9. **`.env` must NOT be committed** — add to `.gitignore` properly, create `.env.example`
10. **All `console.*` calls** must be replaced with Winston logger

---

## 🧪 VERIFICATION CHECKLIST

After completing the overhaul, verify:

- [ ] `docker-compose up` starts PostgreSQL + Redis + Backend
- [ ] `npx sequelize-cli db:migrate` creates all tables with UUID PKs
- [ ] `npm run seed` populates test data with UUID IDs
- [ ] POST `/api/auth/register` creates user with UUID
- [ ] POST `/api/auth/login` returns JWT token
- [ ] GET `/api/auth/me` returns user profile
- [ ] GET `/api/transactions` returns paginated results
- [ ] POST `/api/transactions` creates with UUID, invalidates cache
- [ ] GET `/api/dashboard` returns cached result on second call
- [ ] POST `/api/predict/balance` uses circuit breaker
- [ ] POST `/api/predict/category` sanitizes text before AI
- [ ] GET `/api/budget-alert/:uid/:month` queries DB only 3 times (not 6+)
- [ ] Rate limiting uses Redis store (survives restart)
- [ ] Helmet security headers present in response
- [ ] User A cannot access User B's data (IDOR fixed)
- [ ] No `console.log` in codebase — all Winston
- [ ] `verifyToken.js` deleted
- [ ] Transaction model has NO duplicate fields
- [ ] PredictionLog has `user_id` FK
- [ ] Graceful shutdown closes Redis + PostgreSQL

---

## 📋 EXECUTION ORDER

```
FASE 1 (Foundation):
  1. Install new packages, remove mysql2
  2. Create docker-compose.yml (PostgreSQL + Redis)
  3. Update database.js → PostgreSQL
  4. Create redis.js config
  5. Update ALL models → UUID primary keys
  6. Create Sequelize migrations
  7. Update server.js → remove sync()
  8. Add initial_balance field to User model

FASE 2 (Redis):
  9. Create cacheService.js
  10. Update app.js → Redis rate limiting
  11. Add cache to dashboardService
  12. Add cache to aiService (predictions)
  13. Add cache invalidation in transactionService

FASE 3 (Code Cleanup):
  14. DELETE verifyToken.js
  15. Update all routes to use authMiddleware only
  16. Fix Transaction model duplicate fields
  17. Create ownershipCheck.js middleware
  18. Apply ownership check to user routes
  19. Create budgetService.js, refactor controllers
  20. Add pagination to transactionService
  21. Remove all hardcoded values
  22. Register budgetRoutes and adminRoutes
  23. Remove redundant Op imports

FASE 4 (AI Enhancement):
  24. Create circuitBreaker.js
  25. Wrap all aiClient methods with circuit breaker
  26. Create textSanitizer.js
  27. Apply sanitizer in predictCategory
  28. Cache AI health check (30s in-memory)
  29. Optimize budgetAlertController → parallel queries

FASE 5 (Production):
  30. Add helmet, compression, hpp, body limit
  31. Create logger.js (Winston)
  32. Replace ALL console.* with logger
  33. Create Dockerfile
  34. Fix graceful shutdown (SIGINT + SIGTERM + Redis)
  35. Create .env.example, fix .gitignore
  36. Move docs to /docs folder
  37. Update seeder for PostgreSQL + UUID
  38. Run full test suite
```

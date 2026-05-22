# 🔧 PLAN: Rombak Besar Backend FinZ

**Tanggal**: 22 Mei 2026  
**Scope**: finz-backend — Full Overhaul  
**Target**: Production-Ready, Industry Standard Architecture

---

## 📋 Executive Summary

Rombak total backend FinZ dari arsitektur MVP/prototype menjadi production-grade:
1. **Migrasi MySQL → PostgreSQL** 
2. **Migrasi ID Integer → UUID (v4)**
3. **Integrasi Redis** (caching, rate limiting, session)
4. **Optimasi kode** (hapus duplikasi, fix anti-pattern)
5. **AI Integration Enhancement** (circuit breaker, caching, sanitizer)
6. **Production Hardening** (migrations, Docker, logging, security)

---

## 🏗️ FASE 1: Foundation & Database Migration (Prioritas Tertinggi)

### 1.1 Migrasi MySQL → PostgreSQL

**File terdampak**: `src/config/database.js`, `.env`, `package.json`

**Langkah**:
```
1. Install driver: npm install pg pg-hstore
2. Uninstall mysql2: npm uninstall mysql2
3. Ubah dialect di database.js: 'mysql' → 'postgres'
4. Ubah DB_PORT di .env: 3306 → 5432
5. Sesuaikan tipe data ENUM → menggunakan Sequelize ENUM (PostgreSQL native support)
6. TINYINT → SMALLINT
7. DECIMAL tetap sama (PostgreSQL support native)
```

**Perubahan `src/config/database.js`**:
```javascript
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,  // Changed
    dialect: 'postgres',                 // Changed
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 20,      // Increase for production
      min: 5,       // Keep warm connections
      acquire: 30000,
      idle: 10000,
    },
    timezone: '+07:00',
    define: {
      underscored: true,  // snake_case columns
    },
  }
);
```

**Perubahan `.env`**:
```env
# Database PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finz_db
DB_USER=finz
DB_PASSWORD=finz_secure_password_2026
DB_DIALECT=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 1.2 Migrasi ID → UUID

**File terdampak**: SEMUA model (`User.js`, `Transaction.js`, `Budget.js`, `PredictionLog.js`), semua controller, semua service

**Pattern baru untuk semua model**:
```javascript
id: {
  type: DataTypes.UUID,
  defaultValue: DataTypes.UUIDV4,
  primaryKey: true,
},
```

**Foreign key juga berubah**:
```javascript
user_id: {
  type: DataTypes.UUID,
  allowNull: false,
  references: { model: 'users', key: 'id' },
}
```

**Impact pada controller**: 
- Hapus semua `parseInt(req.params.id)` → langsung pakai string UUID
- Hapus semua `defaultValue: 1` pada user_id
- Validasi UUID format di middleware

### 1.3 Setup Sequelize Migrations (Ganti sync())

**Langkah**:
```bash
npm install sequelize-cli
npx sequelize-cli init
```

**Buat migration files**:
```
migrations/
  001-create-users.js
  002-create-transactions.js
  003-create-budgets.js
  004-create-prediction-logs.js
```

**Hapus di `server.js`**:
```diff
- await sequelize.sync({ alter: false });
+ // Migrations handled by sequelize-cli
+ // Run: npx sequelize-cli db:migrate
```

---

## 🏗️ FASE 2: Redis Integration

### 2.1 Setup Redis Client

**File baru**: `src/config/redis.js`

```javascript
'use strict';
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));

module.exports = redis;
```

**Package**: `npm install ioredis`

### 2.2 Redis untuk Rate Limiting

**File terdampak**: `src/app.js`

```javascript
const RedisStore = require('rate-limit-redis');
const redis = require('./config/redis');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,  // Naikkan limit
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  standardHeaders: true,
  legacyHeaders: false,
});
```

**Package**: `npm install rate-limit-redis`

### 2.3 Redis untuk Cache AI Responses

**File baru**: `src/services/cacheService.js`

```javascript
const redis = require('../config/redis');

const CACHE_TTL = {
  AI_HEALTH: 30,          // 30 detik
  PREDICTION: 300,         // 5 menit
  DASHBOARD: 60,           // 1 menit
  FINANCIAL_SCORE: 300,    // 5 menit
  RECOMMENDATIONS: 600,    // 10 menit
};

const cacheService = {
  async get(key) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key, value, ttl) {
    await redis.setex(key, ttl, JSON.stringify(value));
  },

  async del(key) {
    await redis.del(key);
  },

  async delPattern(pattern) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  },

  // Cache key generators
  keys: {
    aiHealth: () => 'cache:ai:health',
    dashboard: (userId) => `cache:dashboard:${userId}`,
    prediction: (userId, type) => `cache:prediction:${userId}:${type}`,
    financialScore: (userId) => `cache:score:${userId}`,
    recommendations: (userId) => `cache:reco:${userId}`,
    budgetAlerts: (userId, month) => `cache:alerts:${userId}:${month}`,
  },

  TTL: CACHE_TTL,
};

module.exports = cacheService;
```

### 2.4 Cache Invalidation Strategy

**Pattern**: Cache invalidation saat data berubah

```
POST /transactions    → invalidate dashboard, score, recommendations, alerts
PUT /transactions/:id → invalidate dashboard, score, recommendations, alerts  
DELETE /transactions  → invalidate dashboard, score, recommendations, alerts
POST /budgets         → invalidate alerts
DELETE /budgets       → invalidate alerts
```

**Implementasi di transactionService**:
```javascript
const createTransaction = async (data) => {
  const t = await Transaction.create({...});
  // Invalidate related caches
  await cacheService.delPattern(`cache:*:${data.user_id}*`);
  return formatTransaction(t);
};
```

---

## 🏗️ FASE 3: Code Optimization & Cleanup

### 3.1 Hapus Duplikasi Auth Middleware

**Action**: Hapus `verifyToken.js`, gunakan HANYA `authMiddleware.js`

**File dihapus**: `src/middlewares/verifyToken.js`

**File diubah**: Semua route yang import `verifyToken` → ganti ke `authMiddleware`
- `src/routes/budgetAlertRoutes.js` 
- `src/routes/aiRoutes.js` (jika ada)

### 3.2 Fix Duplikasi Field Transaction Model

**File**: `src/models/Transaction.js`

Hapus definisi kedua (line 94-114) dari `transaction_type`, `hour_of_day`, `is_recurring`.

### 3.3 Fix IDOR Vulnerability

**File baru**: `src/middlewares/ownershipCheck.js`

```javascript
const ownershipCheck = (req, res, next) => {
  const paramId = req.params.id || req.params.user_id;
  if (paramId && paramId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Anda tidak memiliki izin.',
    });
  }
  next();
};
```

### 3.4 Refactor Budget Logic → budgetService.js

**File baru**: `src/services/budgetService.js`

Pindahkan semua budget logic dari `userController.js` dan `budgetAlertController.js` ke satu service:
- `getUserBudgets(userId, month)`
- `upsertBudget(userId, data)`
- `deleteBudget(userId, budgetId)`
- `getSpendingByCategory(userId, firstDay, lastDay)`

### 3.5 Hapus Hardcoded Values

| Hardcoded | Lokasi | Solusi |
|-----------|--------|--------|
| `initialBalance = 2000000` | dashboardService, budgetAlertController | Hitung dari data: `totalIncome - totalExpense + saldo_awal user` |
| `user_id = 1` default | Transaction model, services | Hapus default, wajib dari JWT |
| JWT secret fallback | authMiddleware, verifyToken, authController | Satu config file, throw error jika kosong |

### 3.6 Tambahkan Pagination

**File**: `src/services/transactionService.js`

```javascript
const getAllTransactions = async ({ user_id, category, date_from, date_to, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await Transaction.findAndCountAll({
    where,
    order: [['date', 'DESC'], ['created_at', 'DESC']],
    limit,
    offset,
  });
  return {
    data: rows.map(formatTransaction),
    pagination: {
      page, limit, total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};
```

### 3.7 Register Dead Routes

**File**: `src/app.js`
```javascript
app.use('/api/budgets', apiLimiter, budgetRoutes);   // Register budgetRoutes
app.use('/api/admin',   apiLimiter, adminRoutes);    // Register adminRoutes
```

---

## 🏗️ FASE 4: AI Integration Enhancement

### 4.1 Circuit Breaker untuk AI API

**Package**: `npm install opossum`

**File baru**: `src/services/circuitBreaker.js`

```javascript
const CircuitBreaker = require('opossum');

const AI_BREAKER_OPTIONS = {
  timeout: 10000,        // 10 detik timeout
  errorThresholdPercentage: 50,  // Open circuit jika 50% error
  resetTimeout: 30000,   // Coba lagi setelah 30 detik
  volumeThreshold: 5,    // Minimal 5 request sebelum evaluasi
};

const createBreaker = (fn) => {
  const breaker = new CircuitBreaker(fn, AI_BREAKER_OPTIONS);
  breaker.on('open', () => console.warn('[CircuitBreaker] AI API circuit OPEN'));
  breaker.on('halfOpen', () => console.info('[CircuitBreaker] AI API circuit HALF-OPEN'));
  breaker.on('close', () => console.info('[CircuitBreaker] AI API circuit CLOSED'));
  return breaker;
};
```

### 4.2 Text Sanitizer untuk AI Input

**File baru**: `src/utils/textSanitizer.js`

```javascript
const sanitizeText = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z\s]/g, ' ')  // Hapus angka & simbol
    .replace(/\s+/g, ' ')           // Normalize spasi
    .trim();
};
```

### 4.3 Cache AI Health Check (30 detik)

**File**: `src/services/aiClient.js`

```javascript
let _healthCache = { result: null, timestamp: 0 };
const HEALTH_CACHE_TTL = 30000; // 30 detik

const isAvailable = async () => {
  const now = Date.now();
  if (_healthCache.result !== null && (now - _healthCache.timestamp) < HEALTH_CACHE_TTL) {
    return _healthCache.result;
  }
  try {
    await client.get('/health', { timeout: 3000 });
    _healthCache = { result: true, timestamp: now };
    return true;
  } catch {
    _healthCache = { result: false, timestamp: now };
    return false;
  }
};
```

### 4.4 Optimasi Budget Alert Flow (Hapus Duplikasi Query)

**Masalah saat ini**: 6+ DB queries per request (budget + expense query 2x)

**Solusi**: Query sekali, reuse data:
```javascript
const getBudgetAlerts = async (req, res) => {
  // 1. Query SEKALI
  const [budgets, expenses, totalIncome] = await Promise.all([
    Budget.findAll({ where: { user_id: userId, month: period } }),
    Transaction.findAll({ where: { user_id: userId, transaction_type: 'expense', date: { [Op.between]: [firstDay, lastDay] } } }),
    Transaction.sum('amount', { where: { user_id: userId, transaction_type: 'income', date: { [Op.between]: [firstDay, lastDay] } } }),
  ]);
  
  // 2. Proses dari data yang sudah di-query
  // ... (reuse budgets dan expenses untuk standard + AI alerts)
};
```

---

## 🏗️ FASE 5: Production Hardening

### 5.1 Security

| Item | Package/Action |
|------|---------------|
| Helmet.js | `npm install helmet` → `app.use(helmet())` |
| Body limit | `express.json({ limit: '1mb' })` |
| XSS sanitization | `npm install xss-clean` |
| HPP protection | `npm install hpp` |
| CORS tightening | Hapus wildcard, whitelist specific domains |
| JWT secret validation | Throw error jika `JWT_SECRET` kosong |
| Refresh token | Implementasi refresh token mechanism |

### 5.2 Structured Logging

**Package**: `npm install winston`

**File baru**: `src/config/logger.js`

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});
```

Ganti SEMUA `console.log/error/warn` → `logger.info/error/warn`.

### 5.3 Docker Support

**File baru**: `Dockerfile`
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8000
CMD ["node", "src/server.js"]
```

**File baru**: `docker-compose.yml`
```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    env_file: .env

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: finz_db
      POSTGRES_USER: finz
      POSTGRES_PASSWORD: finz_secure_password_2026
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

### 5.4 Compression & Performance

```javascript
const compression = require('compression');
app.use(compression());  // Gzip responses
```

### 5.5 Graceful Shutdown (Fix)

```javascript
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received — shutting down gracefully`);
  await redis.quit();
  await sequelize.close();
  process.exit(0);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

---

## 📁 Struktur Folder Baru (Target)

```
finz-backend/
├── docker-compose.yml
├── Dockerfile
├── .env.example          # Template .env (hapus .env dari git)
├── package.json
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── database.js    # PostgreSQL config
│   │   ├── redis.js       # Redis client
│   │   └── logger.js      # Winston logger
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── transactionController.js
│   │   ├── dashboardController.js
│   │   ├── budgetController.js       # Gabungkan budget logic
│   │   ├── budgetAlertController.js
│   │   ├── userController.js
│   │   └── aiController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js   # SATU-SATUNYA auth middleware
│   │   ├── ownershipCheck.js   # IDOR protection
│   │   ├── errorHandler.js
│   │   ├── requestLogger.js
│   │   └── validators.js
│   ├── models/
│   │   ├── index.js
│   │   ├── User.js           # UUID primary key
│   │   ├── Transaction.js    # UUID, fix duplikasi
│   │   ├── Budget.js         # UUID
│   │   └── PredictionLog.js  # UUID + user_id FK
│   ├── services/
│   │   ├── aiClient.js
│   │   ├── aiService.js
│   │   ├── budgetService.js   # NEW
│   │   ├── cacheService.js    # NEW (Redis)
│   │   ├── circuitBreaker.js  # NEW
│   │   ├── dashboardService.js
│   │   └── transactionService.js
│   ├── utils/
│   │   └── textSanitizer.js   # NEW
│   ├── migrations/            # NEW (Sequelize CLI)
│   │   ├── 001-create-users.js
│   │   ├── 002-create-transactions.js
│   │   ├── 003-create-budgets.js
│   │   └── 004-create-prediction-logs.js
│   ├── seeders/               # Move from database/
│   │   └── seed-data.js
│   └── routes/
│       ├── authRoutes.js
│       ├── transactionRoutes.js
│       ├── dashboardRoutes.js
│       ├── budgetRoutes.js       # Register di app.js
│       ├── budgetAlertRoutes.js
│       ├── userRoutes.js
│       ├── adminRoutes.js        # Register di app.js
│       └── aiRoutes.js
└── docs/                      # Pindahkan semua .md dari root
    ├── AUDIT.md
    ├── arsitektur.md
    └── ...
```

---

## 📦 Dependencies Baru

```json
{
  "dependencies": {
    "pg": "^8.13.0",
    "pg-hstore": "^2.3.4",
    "ioredis": "^5.4.0",
    "rate-limit-redis": "^4.2.0",
    "opossum": "^8.1.0",
    "helmet": "^8.0.0",
    "compression": "^1.7.4",
    "winston": "^3.14.0",
    "hpp": "^0.2.3",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "sequelize-cli": "^6.6.2"
  }
}
```

**Hapus**: `mysql2`

---

## ⏱️ Urutan Eksekusi

| # | Task | Fase | Estimasi |
|---|------|------|----------|
| 1 | Setup PostgreSQL + Redis (docker-compose) | F1 | 30 min |
| 2 | Ubah database.js → PostgreSQL dialect | F1 | 15 min |
| 3 | Migrasi semua model ke UUID | F1 | 60 min |
| 4 | Buat Sequelize migrations, hapus sync() | F1 | 45 min |
| 5 | Setup Redis client + cacheService | F2 | 30 min |
| 6 | Redis rate limiting | F2 | 15 min |
| 7 | Redis caching di AI endpoints | F2 | 45 min |
| 8 | Hapus duplikasi auth middleware | F3 | 15 min |
| 9 | Fix Transaction model duplikasi | F3 | 10 min |
| 10 | Fix IDOR (ownershipCheck) | F3 | 20 min |
| 11 | Refactor budgetService | F3 | 30 min |
| 12 | Pagination di getAllTransactions | F3 | 20 min |
| 13 | Hapus hardcoded values | F3 | 15 min |
| 14 | Register dead routes | F3 | 5 min |
| 15 | Circuit breaker AI | F4 | 30 min |
| 16 | Text sanitizer | F4 | 10 min |
| 17 | Cache AI health check | F4 | 10 min |
| 18 | Optimasi budget alert flow | F4 | 30 min |
| 19 | Helmet, compression, body limit | F5 | 15 min |
| 20 | Winston logger (ganti console.*) | F5 | 30 min |
| 21 | Docker setup | F5 | 20 min |
| 22 | Graceful shutdown fix | F5 | 10 min |
| 23 | Update seeder untuk PostgreSQL + UUID | F5 | 30 min |
| 24 | Testing & validasi | F5 | 60 min |

**Total estimasi**: ~10 jam kerja

---

## ✅ Verification Plan

1. **Database**: PostgreSQL running via docker-compose, migrations sukses
2. **Redis**: Cache hit/miss terlihat di log
3. **API Test**: Semua 20 endpoint berfungsi dengan UUID
4. **AI Integration**: Circuit breaker aktif, fallback bekerja
5. **Security**: Helmet headers muncul, IDOR blocked
6. **Performance**: Budget alert query turun dari 6+ ke 3 parallel queries

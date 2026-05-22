# 🤖 Prompt untuk Codex CLI — FinZ Backend Overhaul

> **Cara pakai**: Copy-paste prompt per fase ke Codex CLI. Jalankan **berurutan** dari Fase 1 sampai Fase 5.  
> Pastikan Codex CLI dijalankan dari root directory: `/home/masbay/PROJECT/finz-backend`

---

## ⚡ PROMPT FASE 1: Foundation & Database Migration

```
Baca file document/AIContext.md dan document/plan.md sebagai konteks lengkap.

Kerjakan FASE 1 — Foundation & Database Migration:

1. **Package changes**:
   - Jalankan: npm uninstall mysql2
   - Jalankan: npm install pg pg-hstore ioredis uuid sequelize-cli
   - Jalankan: npm install helmet compression winston hpp opossum rate-limit-redis

2. **Update src/config/database.js**:
   - Ubah dialect dari 'mysql' ke 'postgres'
   - Ubah default port dari 3306 ke 5432
   - Tambahkan pool max: 20, min: 5
   - Tambahkan define: { underscored: true }

3. **Update .env**:
   - Ubah DB_PORT=5432
   - Tambahkan variabel REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB
   - Hapus komentar "Database MySQL" ganti "Database PostgreSQL"

4. **Migrasi semua model ke UUID**:
   - src/models/User.js: id → DataTypes.UUID dengan defaultValue DataTypes.UUIDV4
   - src/models/Transaction.js: id → UUID, user_id → UUID. HAPUS duplikasi field transaction_type, hour_of_day, is_recurring (line 94-114 harus dihapus, pertahankan yang di line 72-88). Hapus defaultValue: 1 pada user_id.
   - src/models/Budget.js: id → UUID, user_id → UUID
   - src/models/PredictionLog.js: id → UUID, TAMBAHKAN field user_id UUID FK ke users
   - src/models/index.js: Tambahkan association PredictionLog belongsTo User

5. **Tambah field initial_balance di User model**:
   - type: DataTypes.DECIMAL(15, 2), defaultValue: 0, comment: 'Saldo awal user'

6. **Update src/server.js**:
   - HAPUS baris `await sequelize.sync({ alter: false })`
   - Ganti dengan komentar: "// Use migrations: npx sequelize-cli db:migrate"
   - Tambahkan handler SIGINT selain SIGTERM

7. **Buat file .sequelizerc** di root:
   ```javascript
   const path = require('path');
   module.exports = {
     config: path.resolve('src/config', 'database.js'),
     'models-path': path.resolve('src', 'models'),
     'migrations-path': path.resolve('src', 'migrations'),
     'seeders-path': path.resolve('src', 'seeders'),
   };
   ```

8. **Buat migration files** di src/migrations/:
   - 20260522-001-create-users.js (UUID PK, semua field dari User model termasuk initial_balance)
   - 20260522-002-create-transactions.js (UUID PK, FK ke users, TANPA field duplikat)
   - 20260522-003-create-budgets.js (UUID PK, FK ke users)
   - 20260522-004-create-prediction-logs.js (UUID PK, FK ke users via user_id)

9. **Buat .env.example** (copy dari .env tapi hapus semua value sensitif, isi dengan placeholder)

10. **Update .gitignore**: pastikan .env ada di dalamnya

Jangan ubah file frontend atau AI server. Jangan ubah response shape API.
```

---

## ⚡ PROMPT FASE 2: Redis Integration

```
Baca file document/AIContext.md dan document/plan.md sebagai konteks lengkap.

Kerjakan FASE 2 — Redis Integration. Fase 1 sudah selesai (PostgreSQL + UUID sudah di-setup).

1. **Buat src/config/redis.js**:
   - Gunakan ioredis
   - Konfigurasi dari env: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB
   - Event listener: connect, error, reconnecting
   - Export redis instance
   - Tambahkan lazyConnect: true, maxRetriesPerRequest: 3

2. **Buat src/services/cacheService.js**:
   - Method: get(key), set(key, value, ttl), del(key), delPattern(pattern)
   - Key generators:
     - aiHealth: () => 'finz:cache:ai:health'
     - dashboard: (userId) => `finz:cache:dashboard:${userId}`
     - prediction: (userId, type) => `finz:cache:prediction:${userId}:${type}`
     - financialScore: (userId) => `finz:cache:score:${userId}`
     - recommendations: (userId) => `finz:cache:reco:${userId}`
     - budgetAlerts: (userId, month) => `finz:cache:alerts:${userId}:${month}`
   - TTL constants: AI_HEALTH=30, PREDICTION=300, DASHBOARD=60, FINANCIAL_SCORE=300, RECOMMENDATIONS=600, BUDGET_ALERTS=120

3. **Update src/app.js — Redis Rate Limiting**:
   - Import RedisStore dari 'rate-limit-redis'
   - Import redis dari './config/redis'
   - Ganti apiLimiter dan authLimiter agar menggunakan RedisStore
   - Naikkan apiLimiter max ke 500
   - Tambahkan app.use(helmet()) dan app.use(compression())
   - Tambahkan express.json({ limit: '1mb' })

4. **Update src/services/dashboardService.js — Cache dashboard**:
   - Import cacheService
   - Di getDashboardSummary: cek cache dulu, jika hit return cache
   - Setelah compute, simpan ke cache dengan TTL 60s
   - Key: cacheService.keys.dashboard(user_id)

5. **Update src/services/aiService.js — Cache AI responses**:
   - Import cacheService
   - Di predictBalance: cache result dengan TTL 300s
   - Di getFinancialScore: cache result dengan TTL 300s
   - Di getRecommendations: cache result dengan TTL 600s

6. **Update src/services/transactionService.js — Cache Invalidation**:
   - Import cacheService
   - Di createTransaction, updateTransaction, deleteTransaction:
     - Setelah operasi DB berhasil, jalankan: await cacheService.delPattern(`finz:cache:*:${user_id}*`)
     - Ini akan invalidate dashboard, score, recommendations, dan alerts

7. **Update src/services/aiClient.js — Cache health check**:
   - Tambahkan in-memory cache untuk isAvailable() dengan TTL 30 detik
   - Jangan query /health setiap kali, gunakan cached result

8. **Update src/server.js — Graceful shutdown Redis**:
   - Import redis dari config/redis
   - Di graceful shutdown handler: await redis.quit() sebelum sequelize.close()

Jangan ubah response shape API. Semua endpoint tetap backward compatible.
```

---

## ⚡ PROMPT FASE 3: Code Optimization & Cleanup

```
Baca file document/AIContext.md dan document/plan.md sebagai konteks lengkap.

Kerjakan FASE 3 — Code Optimization & Cleanup. Fase 1 dan 2 sudah selesai.

1. **HAPUS file src/middlewares/verifyToken.js** (duplikat dari authMiddleware.js)

2. **Update SEMUA routes yang import verifyToken → ganti ke authMiddleware**:
   - Cari semua file di src/routes/ yang require verifyToken
   - Ganti dengan: const authMiddleware = require('../middlewares/authMiddleware')
   - Ganti semua penggunaan verifyToken → authMiddleware

3. **Buat src/middlewares/ownershipCheck.js**:
   ```javascript
   const ownershipCheck = (req, res, next) => {
     const paramId = req.params.id || req.params.user_id;
     if (paramId && req.user && paramId !== String(req.user.id)) {
       return res.status(403).json({
         success: false,
         message: 'Akses ditolak. Anda tidak memiliki izin untuk resource ini.',
       });
     }
     next();
   };
   module.exports = ownershipCheck;
   ```

4. **Update src/routes/userRoutes.js**: Tambahkan ownershipCheck middleware setelah authMiddleware pada semua route /:id

5. **Buat src/services/budgetService.js**:
   - Pindahkan logic budget dari userController.js:
     - getUserBudgets(userId, month)
     - upsertBudget(userId, data)
     - deleteBudget(userId, budgetId)
     - getSpendingByCategory(userId, firstDay, lastDay)
   - userController.js hanya panggil budgetService methods

6. **Update src/services/transactionService.js — Pagination**:
   - getAllTransactions menerima parameter page dan limit (default page=1, limit=20)
   - Gunakan findAndCountAll dengan limit dan offset
   - Return: { data: [...], pagination: { page, limit, total, totalPages } }

7. **Update src/controllers/transactionController.js**:
   - Parse req.query.page dan req.query.limit
   - Kirim ke service, return pagination info dalam response

8. **Hapus semua hardcoded values**:
   - dashboardService.js line 30: Hapus `const initialBalance = 2000000`, ganti dengan query user.initial_balance dari User model
   - budgetAlertController.js line 88: Hapus `const initialBalance = 2000000`, ganti dengan query user.initial_balance
   - Hapus semua `user_id = 1` default di parameter functions

9. **Register dead routes di src/app.js**:
   - Import budgetRoutes dari './routes/budgetRoutes'
   - Import adminRoutes dari './routes/adminRoutes'
   - Tambahkan: app.use('/api/budgets', apiLimiter, budgetRoutes)
   - Tambahkan: app.use('/api/admin', apiLimiter, adminRoutes)

10. **Fix redundant Op import di src/services/aiService.js**:
    - Hapus `const { Op } = require('sequelize')` di line 350 dan 402 (di dalam function body)
    - Sudah ada import di line 15, itu saja yang dipakai

11. **Hapus ai_api_url dari health check response di src/app.js** (line 83) — jangan expose internal URL ke public

12. **Satukan JWT secret config**: Buat konstanta di satu tempat, import di authMiddleware dan authController. Jika JWT_SECRET kosong, throw error saat startup.

Jangan ubah response shape API kecuali menambahkan pagination wrapper.
```

---

## ⚡ PROMPT FASE 4: AI Integration Enhancement

```
Baca file document/AIContext.md dan document/plan.md sebagai konteks lengkap.

Kerjakan FASE 4 — AI Integration Enhancement. Fase 1-3 sudah selesai.

1. **Buat src/services/circuitBreaker.js**:
   - Gunakan library 'opossum'
   - Config: timeout 10000ms, errorThresholdPercentage 50, resetTimeout 30000ms, volumeThreshold 5
   - Export function createBreaker(fn) yang return CircuitBreaker instance
   - Tambahkan event listeners: open, halfOpen, close → log via logger

2. **Update src/services/aiClient.js — Wrap dengan Circuit Breaker**:
   - Import createBreaker dari circuitBreaker
   - Buat breaker untuk setiap method: predictKategori, predictSaldo, predictBatch, generateAlerts, getAlerts
   - Export breaker.fire() wrapped versions
   - Jika circuit open, langsung throw error (fallback akan di-handle oleh aiService)

3. **Buat src/utils/textSanitizer.js**:
   ```javascript
   const sanitizeText = (text) => {
     if (!text || typeof text !== 'string') return '';
     return text
       .toLowerCase()
       .replace(/[^\w\s&]/g, ' ')
       .replace(/\d+/g, '')
       .replace(/\s+/g, ' ')
       .trim();
   };
   module.exports = { sanitizeText };
   ```

4. **Update src/services/aiService.js — Gunakan sanitizer**:
   - Import { sanitizeText } dari utils/textSanitizer
   - Di predictCategory: sanitize description sebelum kirim ke aiClient.predictKategori
   - contoh: const cleanDesc = sanitizeText(description); lalu kirim cleanDesc ke AI

5. **Optimasi src/controllers/budgetAlertController.js — Parallel Queries**:
   - Ganti sequential queries menjadi Promise.all:
   ```javascript
   const [budgets, expenses, incomeResult] = await Promise.all([
     Budget.findAll({ where: { user_id: userId, month: period } }),
     Transaction.findAll({ where: { user_id: userId, transaction_type: 'expense', date: { [Op.between]: [firstDay, lastDay] } } }),
     Transaction.sum('amount', { where: { user_id: userId, transaction_type: 'income', date: { [Op.between]: [firstDay, lastDay] } } }),
   ]);
   ```
   - HAPUS query duplikat: jangan query budgets dan expenses lagi untuk standard alerts
   - Reuse data dari Promise.all untuk KEDUA AI alerts dan standard alerts
   - Ini mengurangi dari 6+ queries menjadi 3 parallel queries

6. **Update src/services/aiService.js — Hapus redundant imports**:
   - Hapus semua `const { Op } = require('sequelize')` di dalam function body (line ~350 dan ~402)
   - Gunakan Op yang sudah di-import di top-level (line 15)

Jangan ubah Flask AI server. Jangan ubah response shape API. Pertahankan semua fallback logic yang sudah ada.
```

---

## ⚡ PROMPT FASE 5: Production Hardening

```
Baca file document/AIContext.md dan document/plan.md sebagai konteks lengkap.

Kerjakan FASE 5 — Production Hardening. Fase 1-4 sudah selesai.

1. **Buat src/config/logger.js**:
   - Gunakan winston
   - Format: timestamp + JSON untuk production, colorize + simple untuk development
   - Level: dari env LOG_LEVEL atau default 'info'
   - Transport: Console (bisa ditambah File transport nanti)
   - Export logger instance

2. **Ganti SEMUA console.log/error/warn di seluruh codebase**:
   - Import logger dari config/logger
   - console.log → logger.info
   - console.error → logger.error
   - console.warn → logger.warn
   - Lakukan di SEMUA file: app.js, server.js, semua controllers, semua services, semua middlewares
   - Pertahankan format pesan yang sama, hanya ganti method

3. **Buat Dockerfile** di root:
   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   FROM node:20-alpine
   WORKDIR /app
   COPY --from=builder /app/node_modules ./node_modules
   COPY . .
   RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
   USER appuser
   EXPOSE 8000
   CMD ["node", "src/server.js"]
   ```

4. **Buat docker-compose.yml** di root:
   - Service postgres: image postgres:16-alpine, port 5432, volume pgdata, env dari .env
   - Service redis: image redis:7-alpine, port 6379
   - Service backend: build dari Dockerfile, port 8000, depends_on postgres dan redis, env_file .env
   - Definisi volumes: pgdata

5. **Update src/server.js — Graceful shutdown lengkap**:
   - Import redis dari config/redis
   - Import logger dari config/logger
   - Buat fungsi gracefulShutdown(signal):
     - logger.info(`${signal} received`)
     - await redis.quit()
     - await sequelize.close()
     - process.exit(0)
   - process.on('SIGTERM', gracefulShutdown)
   - process.on('SIGINT', gracefulShutdown)

6. **Update package.json scripts**:
   - Tambah: "migrate": "npx sequelize-cli db:migrate"
   - Tambah: "migrate:undo": "npx sequelize-cli db:migrate:undo"
   - Tambah: "seed": "npx sequelize-cli db:seed:all"
   - Tambah: "docker:up": "docker-compose up -d"
   - Tambah: "docker:down": "docker-compose down"

7. **Update src/database/seeder.js**:
   - Ubah semua id integer menjadi UUID (gunakan uuid.v4())
   - Sesuaikan semua user_id references ke UUID
   - Import { v4: uuidv4 } dari 'uuid'

8. **Pindahkan markdown docs dari root ke docs/**:
   - Buat folder docs/ di root jika belum ada
   - File yang tetap di root: package.json, .env, .env.example, .gitignore, Dockerfile, docker-compose.yml, .sequelizerc
   - Pindahkan: analysis_arsitektur_backend.md, bug.md, "dokumentasi end point" ke docs/
   - JANGAN pindahkan folder document/ (sudah terstruktur)

9. **Buat .dockerignore**:
   ```
   node_modules
   .git
   .env
   docs
   document
   *.md
   ```

Setelah selesai, jalankan: npm run migrate (jika PostgreSQL sudah running) untuk verifikasi migrations berjalan.
```

---

## 💡 Tips Penggunaan

1. **Jalankan per fase** — jangan gabung semua prompt sekaligus
2. **Verifikasi tiap fase** sebelum lanjut ke fase berikutnya
3. **Jika Codex error**, kirim pesan: `"Baca document/AIContext.md lalu lanjutkan dari step terakhir yang gagal"`
4. **Setelah Fase 1**, test dengan: `npx sequelize-cli db:migrate` (pastikan PostgreSQL running)
5. **Setelah Fase 5**, test dengan: `docker-compose up -d && npm run migrate`

---

## 🔧 Quick Fix Prompt (Jika Ada Error)

```
Baca file document/AIContext.md. Ada error setelah overhaul backend:

[PASTE ERROR DI SINI]

Fix error tersebut. Jangan ubah arsitektur yang sudah diimplementasi. Jangan ubah response shape API frontend.
```

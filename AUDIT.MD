# 🔍 FinZ Application — Full Audit Report

**Tanggal Audit**: 18 Mei 2026  
**Auditor**: AI Code Auditor  
**Scope**: finz-backend (Express.js), FinZ frontend (React/Vite), integrasi AI (Flask)

---

## 📋 Executive Summary

Aplikasi FinZ adalah personal finance advisor berbasis AI untuk Gen-Z. Setelah audit menyeluruh, ditemukan **3 cacat kritikal**, **4 masalah keamanan**, dan **8 gap fitur** yang perlu diperbaiki. Dua cacat terbesar adalah: **(1)** sistem autentikasi belum terhubung ke backend, dan **(2)** fitur pemasukan (income) tidak berfungsi end-to-end sehingga saldo tidak pernah bertambah.

---

## 🚨 CACAT KRITIKAL (Severity: CRITICAL)

### BUG-001: Sistem Autentikasi Tidak Berfungsi (Frontend ↔ Backend Disconnect)

**Status**: ❌ BROKEN  
**Impact**: Aplikasi single-user, data semua user tercampur  

**Analisis**:
- **Frontend sudah siap**: `Login.jsx`, `Register.jsx`, `AuthContext.jsx`, `ProtectedRoute.jsx` semua sudah ada dan memanggil `authAPI.login()` / `authAPI.register()` yang hit endpoint `/api/auth/login` dan `/api/auth/register`
- **Backend BELUM memiliki auth routes**: Di `app.js` tidak ada route handler untuk `/api/auth/*`. Yang ada hanya:
  ```
  app.use('/api/transactions', transactionRoutes)
  app.use('/api/dashboard',    dashboardRoutes)
  app.use('/api/users',        userRoutes)
  app.use('/api',              aiRoutes)
  ```
- **Tidak ada auth middleware**: Tidak ada JWT middleware untuk proteksi endpoint
- **Tidak ada password hashing**: Model `User.js` tidak memiliki field `password` sama sekali
- **user_id hardcoded ke 1**: Di `transactionController.js` line 39: `const user_id = parseInt(req.query.user_id) || 1`

**File Terdampak**:
| Layer | File | Status |
|-------|------|--------|
| Frontend | `src/context/AuthContext.jsx` | ✅ Sudah ada, memanggil authAPI |
| Frontend | `src/services/api.js` | ✅ authAPI.login/register defined |
| Frontend | `src/pages/Login.jsx` | ✅ UI lengkap, demo hint ada |
| Frontend | `src/pages/Register.jsx` | ✅ UI lengkap + income/occupation |
| Frontend | `src/components/ProtectedRoute.jsx` | ✅ Redirect ke /login jika !auth |
| Backend | `src/routes/authRoutes.js` | ❌ **TIDAK ADA** |
| Backend | `src/controllers/authController.js` | ❌ **TIDAK ADA** |
| Backend | `src/middlewares/auth.js` | ❌ **TIDAK ADA** |
| Backend | `src/models/User.js` | ⚠️ Ada tapi TIDAK ada field password |
| Backend | `package.json` | ⚠️ Tidak ada bcrypt/jsonwebtoken |

---

### BUG-002: Fitur Pemasukan (Income) Tidak Berfungsi End-to-End

**Status**: ❌ BROKEN  
**Impact**: Saldo selalu 0 atau negatif, user tidak bisa mencatat income  

**Analisis**:

1. **Frontend AddTransaction.jsx** (✅ OK):
   - Toggle Pengeluaran/Pemasukan ada (line 143-168)
   - Kategori income tersedia: gaji, bonus, investasi, pemasukan (line 242-249)
   - `transaction_type` dikirim dengan benar ke backend

2. **Backend Transaction Model** (✅ OK):
   - Field `transaction_type` ENUM('expense', 'income') ada (line 72-77)
   - Kategori income terdaftar: pemasukan, gaji, bonus, investasi

3. **Backend transactionService.js** (❌ BUG):
   - `createTransaction()` di line 69-81 **TIDAK menyimpan `transaction_type`**!
   ```javascript
   const t = await Transaction.create({
     user_id: data.user_id || 1,
     amount: data.amount ?? data.nominal,
     category: data.category,
     description: data.description || '',
     payment_method: data.payment_method || 'cash',
     date: data.date || new Date().toISOString().slice(0, 10),
     created_at: new Date(),
     // ❌ MISSING: transaction_type: data.transaction_type || 'expense',
   });
   ```
   - `formatTransaction()` line 19-29 **TIDAK mengembalikan `transaction_type`**:
   ```javascript
   const formatTransaction = (t) => ({
     id: t.id,
     user_id: t.user_id,
     nominal: parseFloat(t.amount),
     amount: parseFloat(t.amount),
     category: t.category,
     description: t.description,
     payment_method: t.payment_method,
     date: t.date,
     created_at: t.created_at,
     // ❌ MISSING: transaction_type: t.transaction_type,
   });
   ```
   - `updateTransaction()` line 86-99 juga **TIDAK update `transaction_type`**

4. **Dampak pada Dashboard**:
   - `dashboardService.js` menghitung `totalIncome` berdasarkan `transaction_type === 'income'` (line 42-43)
   - Karena semua transaksi tersimpan dengan `transaction_type: 'expense'` (default), `totalIncome` selalu **0**
   - Saldo = `totalIncome - totalSpending` = `0 - pengeluaran` = selalu negatif/nol
   - Frontend di `FinanceContext.jsx` line 153: `Math.max(0, currentBalance)` membuat saldo selalu 0

5. **Dampak pada UI Transactions.jsx**:
   - Line 239-240 menampilkan warna berdasarkan `transaction_type` tapi data dari API tidak mengandung field ini
   - Semua transaksi ditampilkan sebagai expense (merah, dengan prefix -)

---

### BUG-003: Dashboard Saldo "Circular Calculation" & Division by Zero

**Status**: ⚠️ LOGIC ERROR  
**Impact**: Prediksi saldo dan donut chart crash/NaN  

**Analisis**:
- `FinanceContext.jsx` line 152-153:
  ```javascript
  const currentBalance = (summary.totalIncome || 0) - (summary.totalSpending || 0);
  const safeBalance = Math.max(0, currentBalance);
  ```
  Karena `totalIncome` selalu 0 (BUG-002), `safeBalance` selalu 0
  
- `Dashboard.jsx` line 107:
  ```javascript
  strokeDasharray={`${(prediction.predicted_end_balance / prediction.current_balance) * 251} 251`}
  ```
  Jika `current_balance = 0`, ini menghasilkan **division by zero** → `Infinity` → SVG crash

- Line 113 juga:
  ```javascript
  {Math.round((prediction.predicted_end_balance / prediction.current_balance) * 100)}%
  ```
  Ini juga menghasilkan `NaN%` atau `Infinity%`

---

## 🔐 MASALAH KEAMANAN (Severity: HIGH)

### SEC-001: Tidak Ada Autentikasi — Semua Endpoint Terbuka
- Semua API endpoint (`/api/transactions`, `/api/dashboard`, `/api/users/:id`) bisa diakses tanpa token
- Siapa saja bisa baca/tulis/hapus data user lain

### SEC-002: Tidak Ada Rate Limiting
- API bisa di-DDoS atau brute-force tanpa batasan
- Tidak ada `express-rate-limit` di dependencies

### SEC-003: Password Tidak Tersimpan di Database
- Model User tidak memiliki field `password` → tidak bisa autentikasi
- Ketika nanti ditambahkan, wajib pakai bcrypt (password hashing)

### SEC-004: JWT Secret Tidak Dikonfigurasi
- `.env` tidak memiliki `JWT_SECRET`
- Diperlukan untuk sign/verify JWT token

---

## ⚡ GAP FITUR (Severity: MEDIUM)

### GAP-001: Backend Auth System (Blocking)
Tidak ada endpoint register/login/me, tidak ada JWT middleware.

### GAP-002: User Data Isolation
Transaksi, budget, dan dashboard tidak di-filter berdasarkan user yang terautentikasi. Semua pakai `user_id = 1` atau dari query parameter (bisa dimanipulasi).

### GAP-003: Budget Alerts Tidak Tampil di Frontend
Backend sudah ada endpoint `/api/budget-alert/*` tapi frontend belum ada UI alert/notification.

### GAP-004: Profile Page Belum Terhubung
`Profile.jsx` ada tapi belum terhubung ke backend auth karena auth belum ada.

### GAP-005: Transactions Page — No Edit Feature
Halaman transaksi hanya bisa hapus, tidak bisa edit (meskipun backend `PUT /api/transactions/:id` sudah ada).

### GAP-006: Income Categories Tidak Muncul di Filter
`Transactions.jsx` menggunakan `CATEGORIES` dari `dummyData.js` yang kemungkinan hanya berisi kategori expense. Kategori income (gaji, bonus, investasi) mungkin tidak ada di filter.

### GAP-007: Seeder Hanya Membuat Data Expense
`database/seeder.js` hanya membuat 30 dummy transactions yang semuanya expense, tidak ada income sample data.

### GAP-008: Constants Tidak Memiliki Income Category Colors/Emojis
`utils/constants.js` hanya punya 8 kategori expense (makanan, transport, dll). Tidak ada entry untuk gaji, bonus, investasi, pemasukan.

---

## 📊 Architecture Assessment

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │ ──▶ │   Backend    │ ──▶ │   AI Layer   │
│  React/Vite  │     │  Express.js  │     │    Flask     │
│              │     │              │     │              │
│ ✅ Auth UI    │     │ ❌ Auth Route │     │ ✅ Working   │
│ ✅ Income UI  │     │ ❌ Income Bug │     │              │
│ ✅ Protected  │     │ ❌ No JWT    │     │              │
│ ✅ Charts     │     │ ❌ No bcrypt │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Dependency Gaps (Backend):
| Package | Needed For | Status |
|---------|-----------|--------|
| `bcryptjs` | Password hashing | ❌ Missing |
| `jsonwebtoken` | JWT auth | ❌ Missing |
| `express-rate-limit` | Rate limiting | ❌ Missing |

---

## ✅ Yang Sudah Bekerja Baik

1. **CRUD Transaksi**: Create/Read/Delete berfungsi (minus income bug)
2. **AI Category Classification**: Backend → Flask, dengan fallback rule-based
3. **AI Balance Prediction**: Endpoint dan UI tersambung
4. **Dashboard Charts**: Pie chart, line chart, bar chart berfungsi
5. **Budget Management**: CRUD budget per kategori per bulan
6. **Financial Score**: Kalkulasi dan tampilan working
7. **Recommendations**: Endpoint dan UI working
8. **Responsive Design**: Dark mode, glassmorphism, animasi smooth
9. **Frontend State Management**: Reducer + Context pattern rapi
10. **Backend Service Layer**: Separation of concerns bagus

---

## 🎯 Prioritas Perbaikan

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P0 | BUG-002: Fix income transaction_type | 30 min | Critical — saldo broken |
| P0 | BUG-003: Fix division by zero dashboard | 15 min | Critical — UI crash |
| P1 | BUG-001: Build auth system | 2-3 hari | Critical — multi-user |
| P1 | SEC-001-004: Security fixes | Included in auth | High |
| P2 | GAP-002: User data isolation | 1 hari | High — privacy |
| P2 | GAP-008: Income category constants | 30 min | Medium — UX |
| P3 | GAP-003: Budget alerts UI | 1 hari | Medium |
| P3 | GAP-005: Edit transaction | 0.5 hari | Medium |
| P4 | GAP-006-007: Filter + Seeder | 1 jam | Low |

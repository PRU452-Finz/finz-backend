# FinZ — Proses Bisnis & Fitur AI

> **FinZ** (Financial Gen-Z) adalah aplikasi personal finance advisor berbasis AI untuk generasi muda. Aplikasi ini menggabungkan pencatatan keuangan manual dengan kecerdasan buatan untuk klasifikasi otomatis, prediksi saldo, dan peringatan budget real-time.

---

## 1. Arsitektur Sistem

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐
│   Frontend   │────▶│   Backend API    │────▶│   AI Inference    │
│  React/Vite  │◀────│  Express + MySQL │◀────│  Flask + TF/Keras │
│  Port: 5173  │     │  Port: 8000      │     │  Port: 5000       │
└──────────────┘     └──────────────────┘     └───────────────────┘
       │                      │                        │
    Browser              JWT Auth                 ML Models
    LocalStorage         Sequelize ORM            TF-IDF + NN
    Context API          Rate Limiting            Rule Engine
```

---

## 2. Proses Bisnis (Business Process Flow)

### 2.1 Alur Utama Pengguna

```
┌─────────┐    ┌─────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│ Register │───▶│  Login  │───▶│   Dashboard  │───▶│   Tambah    │───▶│   Lihat &    │
│  Akun   │    │  (JWT)  │    │   Overview   │    │  Transaksi  │    │   Analisis   │
└─────────┘    └─────────┘    └──────────────┘    └─────────────┘    └──────────────┘
                                     │                   │                    │
                                     ▼                   ▼                    ▼
                              ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
                              │  AI Prediksi │    │ AI Kategori │    │   Budget     │
                              │  Saldo Akhir │    │  Otomatis   │    │   Alert      │
                              └──────────────┘    └─────────────┘    └──────────────┘
```

### 2.2 Detail Alur Per Fitur

#### A. Registrasi & Login
```
User mengisi form Register (nama, email, password)
         │
         ▼
Backend hash password (bcrypt, 10 rounds)
         │
         ▼
Simpan ke tabel `users` di MySQL
         │
         ▼
User login → Backend verifikasi email + password
         │
         ▼
Generate JWT token (expired 7 hari)
         │
         ▼
Frontend simpan token di localStorage
         │
         ▼
Semua API request menyertakan header `Authorization: Bearer <token>`
         │
         ▼
Backend middleware decode token → extract user_id → isolasi data per user
```

#### B. Tambah Transaksi (dengan AI)
```
User ketik deskripsi transaksi: "Bayar listrik PLN bulan mei"
         │
         ▼
Frontend kirim deskripsi ke Backend → Backend forward ke AI Flask
         │
         ▼
AI melakukan inferensi:
  1. TF-IDF Vectorizer → ubah teks jadi vektor numerik
  2. Neural Network (model_klasifikasi.h5) → prediksi kategori
  3. Return: { kategori: "tagihan", confidence: 0.94 }
         │
         ▼
Frontend tampilkan suggestion: "🤖 AI menyarankan: Tagihan"
         │
         ▼
User konfirmasi / ubah kategori → isi nominal, tanggal, metode bayar
         │
         ▼
User pilih tipe: Pengeluaran atau Pemasukan
         │
         ▼
Submit → Backend simpan ke MySQL dengan transaction_type
         │
         ▼
Dashboard otomatis refresh: saldo, chart, prediksi di-update
```

#### C. Dashboard Analytics
```
User buka Dashboard
         │
         ▼
Backend query semua transaksi bulan ini (filtered by user_id dari JWT)
         │
         ▼
Hitung agregasi:
  • Total Pemasukan (sum where transaction_type = 'income')
  • Total Pengeluaran (sum where transaction_type = 'expense')
  • Saldo = Pemasukan - Pengeluaran
  • Breakdown per kategori (pie chart)
  • Breakdown per hari (line chart)
  • Breakdown per bulan — 6 bulan terakhir (bar chart)
         │
         ▼
Backend kirim data spending ke AI Flask untuk prediksi saldo akhir bulan
         │
         ▼
AI model prediksi (model_prediksi_saldo.keras) → return prediksi_saldo_akhir
         │
         ▼
Frontend render:
  ┌─────────────┬─────────────┬──────────────┬──────────────┐
  │ Saldo Saat  │  Pemasukan  │ Pengeluaran  │  Prediksi    │
  │ Ini (donut) │  Bulan Ini  │  Bulan Ini   │  Saldo Akhir │
  └─────────────┴─────────────┴──────────────┴──────────────┘
```

#### D. Budget Management & Alert
```
User set budget per kategori (misal: Makanan = Rp 1.500.000)
         │
         ▼
Backend simpan ke tabel budgets
         │
         ▼
Ketika transaksi baru masuk:
  Backend kirim data ke AI → Rule Matrix Engine evaluasi 6 aturan
         │
         ▼
AI generate alert jika ada pelanggaran:
  • R01: Rasio pengeluaran vs income ≥ 80% → ⚠️ Warning
  • R01: Rasio ≥ 100% → 🔴 Danger
  • R02: Prediksi saldo akhir negatif → 🔴 Danger
  • R03: Budget per kategori terlampaui → 🔴 Danger
  • R04: Tidak ada tabungan/investasi → ⚠️ Warning
  • R05: Hiburan ≥ 25% dari total → ⚠️ Warning
  • R06: Saldo turun ≥ 50% dalam sebulan → 🔴 Danger
         │
         ▼
Frontend NotificationBell 🔔 menampilkan jumlah alert
User klik → dropdown dengan detail per kategori + progress bar
```

---

## 3. Fitur AI — Detail Teknis

### 3.1 AI Model #1: Klasifikasi Kategori Transaksi (NLP)

| Aspek | Detail |
|-------|--------|
| **Tujuan** | Otomatis mengenali kategori dari deskripsi transaksi berbahasa Indonesia |
| **Model** | Neural Network (TensorFlow/Keras) — `model_klasifikasi.h5` |
| **Preprocessing** | TF-IDF Vectorizer (`tfidf_vectorizer.pkl`) — konversi teks → vektor numerik |
| **Label Encoding** | `label_encoder.pkl` — mapping angka ↔ nama kategori |
| **Input** | String deskripsi, contoh: `"Bayar listrik PLN"` |
| **Output** | `{ kategori: "tagihan", confidence: 0.94 }` |
| **Kategori** | makanan, transport, hiburan, belanja, tagihan, pendidikan, kesehatan, lainnya |
| **Fallback** | Jika AI server down, frontend gunakan rule-based regex matching |

**Alur Inferensi:**
```
"bayar listrik pln bulan mei"
        │
        ▼  [Lowercase + Strip]
"bayar listrik pln bulan mei"
        │
        ▼  [TF-IDF Transform]
[0.0, 0.23, 0.0, 0.67, ..., 0.12]  ← sparse vector
        │
        ▼  [Neural Network Forward Pass]
[0.01, 0.02, 0.94, 0.01, ...]      ← probability per class
        │
        ▼  [argmax + Label Decode]
kategori = "tagihan", confidence = 0.94
```

**Endpoint:** `POST /predict/kategori`
```json
// Request
{ "deskripsi": "makan siang di warteg" }

// Response
{ "kategori": "makanan", "confidence": 0.91, "latency_ms": 12 }
```

---

### 3.2 AI Model #2: Prediksi Saldo Akhir Bulan (Regression)

| Aspek | Detail |
|-------|--------|
| **Tujuan** | Memprediksi saldo di akhir bulan berdasarkan pola spending saat ini |
| **Model** | Neural Network Regression (Keras) — `model_prediksi_saldo.keras` |
| **Preprocessing** | StandardScaler untuk input (`scaler_X.pkl`) dan output (`scaler_y.pkl`) |
| **Feature Columns** | `feature_cols.pkl` — daftar fitur input yang digunakan model |
| **Caching** | In-memory cache (max 500 entries) untuk menghindari inferensi duplikat |

**Input Features:**
```
total_pengeluaran    → Total spending bulan ini
total_income         → Total pemasukan bulan ini
n_transaksi          → Jumlah transaksi
avg_pengeluaran      → Rata-rata per transaksi
saldo_awal           → Saldo di awal bulan
[per-kategori]       → Spending per kategori (Tagihan, Makan, Transport, dll.)
```

**Alur Inferensi:**
```
Input: { total_pengeluaran: 4.3M, total_income: 5M, saldo_awal: 12M, ... }
        │
        ▼  [Feature Extraction — 12+ features]
[4300000, 5000000, 14, 307142, 12000000, 900000, 600000, ...]
        │
        ▼  [StandardScaler Transform]
[-0.23, 0.45, -1.2, 0.8, 1.5, ...]
        │
        ▼  [Neural Network Regression]
[0.72]  ← scaled prediction
        │
        ▼  [Inverse Scale → Rupiah]
prediksi_saldo_akhir = Rp 9.150.000
```

**Endpoint:** `POST /predict/saldo`
```json
// Request
{
  "total_pengeluaran": 4300000,
  "total_income": 5000000,
  "saldo_awal": 12000000,
  "n_transaksi": 14,
  "avg_pengeluaran": 307142,
  "Tagihan": 900000,
  "Makan & Minum": 600000
}

// Response
{
  "saldo_awal": 12000000,
  "prediksi_saldo_akhir": 9150000,
  "estimasi_selisih": -2850000,
  "latency_ms": 18
}
```

---

### 3.3 AI System #3: Rule Matrix Engine + Budget Alert

Bukan machine learning murni, tapi **expert system berbasis aturan** yang mengevaluasi kondisi keuangan user secara otomatis.

#### Daftar Aturan (6 Rules):

| Rule | Nama | Kondisi | Severity |
|------|------|---------|----------|
| **R01** | Rasio Spend/Income | Pengeluaran ≥ 80% income | ⚠️ Warning |
| **R01** | Rasio Spend/Income | Pengeluaran ≥ 100% income | 🔴 Danger |
| **R02** | Prediksi Saldo | Saldo akhir bulan negatif | 🔴 Danger |
| **R02** | Prediksi Saldo | Saldo akhir < 20% saldo awal | ⚠️ Warning |
| **R03** | Budget Kategori | Spending kategori ≥ budget | 🔴 Danger |
| **R03** | Budget Kategori | Spending ≥ 80% budget | ⚠️ Warning |
| **R04** | Tabungan | Tidak ada investasi/tabungan | ⚠️ Warning |
| **R04** | Tabungan | Investasi < 10% income | ℹ️ Info |
| **R05** | Hiburan | Hiburan ≥ 25% total spending | ⚠️ Warning |
| **R06** | Penurunan Saldo | Saldo turun ≥ 50% dalam sebulan | 🔴 Danger |
| **R06** | Penurunan Saldo | Saldo turun ≥ 30% | ⚠️ Warning |

#### Skor Kesehatan Keuangan:
```
Skor = 100 - (jumlah_danger × 25) - (jumlah_warning × 10)
Min: 0, Max: 100

Status:
  • "aman"      → skor > 60, no critical rules
  • "perhatian"  → skor 31-60 atau ada 1 danger
  • "kritis"     → skor ≤ 30 atau ada ≥ 2 danger
```

---

### 3.4 Batch Endpoint (Hybrid)

Menggabungkan klasifikasi + prediksi dalam 1 request untuk efisiensi:

```json
// Request
{
  "transaksi": [
    {"deskripsi": "bayar listrik", "jumlah": 900000},
    {"deskripsi": "makan siang", "jumlah": 45000}
  ],
  "saldo_awal": 12000000,
  "total_income": 5000000
}

// Response
{
  "transaksi_terklasifikasi": [
    {"deskripsi": "bayar listrik", "kategori": "Tagihan", "confidence": 0.94},
    {"deskripsi": "makan siang", "kategori": "Makan & Minum", "confidence": 0.89}
  ],
  "ringkasan_kategori": {"Tagihan": 900000, "Makan & Minum": 45000},
  "prediksi_saldo_akhir": 11055000,
  "latency_ms": 25
}
```

---

## 4. Stack Teknologi

| Layer | Teknologi | Fungsi |
|-------|-----------|--------|
| **Frontend** | React 19 + Vite | SPA dengan dark mode, glassmorphism |
| **State** | Context API + useReducer | State management tanpa Redux |
| **Routing** | React Router v6 | SPA navigation + protected routes |
| **Icons** | Phosphor Icons | Icon library |
| **Backend** | Express.js + Node.js | REST API server |
| **ORM** | Sequelize | MySQL object mapping |
| **Database** | MySQL | Persistent storage |
| **Auth** | JWT + bcryptjs | Token-based authentication |
| **Security** | express-rate-limit | Anti brute-force & DDoS |
| **AI Server** | Flask (Python) | ML inference API |
| **ML Framework** | TensorFlow/Keras | Neural network models |
| **NLP** | scikit-learn TF-IDF | Text feature extraction |
| **Logging** | SQLite (AI side) | Prediction audit trail |

---

## 5. Peta Fitur Lengkap

| # | Fitur | Status | AI? |
|---|-------|--------|-----|
| 1 | Register & Login (JWT) | ✅ | ❌ |
| 2 | Multi-User Data Isolation | ✅ | ❌ |
| 3 | Tambah Transaksi (Income/Expense) | ✅ | ✅ Auto-kategori |
| 4 | Edit Transaksi | ✅ | ❌ |
| 5 | Hapus Transaksi | ✅ | ❌ |
| 6 | Dashboard — 4 Stat Cards | ✅ | ✅ Prediksi saldo |
| 7 | Dashboard — Pie Chart Kategori | ✅ | ❌ |
| 8 | Dashboard — Line Chart Harian | ✅ | ❌ |
| 9 | Dashboard — Bar Chart Bulanan | ✅ | ❌ |
| 10 | Dashboard — Financial Score | ✅ | ✅ Rule engine |
| 11 | Dashboard — AI Recommendations | ✅ | ✅ Rule-based |
| 12 | Budget Management (CRUD) | ✅ | ❌ |
| 13 | Budget Alert (Notification Bell) | ✅ | ✅ Rule matrix |
| 14 | Search Transaksi (⌘K) | ✅ | ❌ |
| 15 | Profil & Preferensi User | ✅ | ❌ |
| 16 | Rate Limiting (Anti Brute-Force) | ✅ | ❌ |
| 17 | Responsive Dark Mode UI | ✅ | ❌ |

---

## 6. Diagram Sequence — Skenario Utama

### Tambah Transaksi dengan AI

```
User            Frontend          Backend           AI Flask
 │                 │                 │                 │
 │─ ketik desc ──▶│                 │                 │
 │                 │── POST /predict/category ──────▶│
 │                 │                 │── POST /predict/kategori ──▶│
 │                 │                 │                 │── TF-IDF + NN
 │                 │                 │◀── {kategori, confidence} ──│
 │                 │◀── {category: "tagihan"} ───────│
 │◀─ show "🤖 AI: tagihan" ─│      │                 │
 │                 │                 │                 │
 │─ submit form ─▶│                 │                 │
 │                 │── POST /transactions (JWT) ────▶│
 │                 │                 │── INSERT MySQL  │
 │                 │◀── {success, data} ─────────────│
 │                 │                 │                 │
 │                 │── GET /dashboard (JWT) ─────────▶│
 │                 │                 │── query + aggregate
 │                 │                 │── POST /predict/saldo ──────▶│
 │                 │                 │                 │── Scaler + NN
 │                 │                 │◀── {prediksi_saldo} ────────│
 │                 │◀── {summary + prediction} ──────│
 │◀─ render dashboard ─│            │                 │
```

---

*Dokumen ini menggambarkan proses bisnis dan arsitektur AI pada aplikasi FinZ (CC26-PRU452).*

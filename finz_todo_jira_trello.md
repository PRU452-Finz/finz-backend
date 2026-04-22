# FinZ — TODO List Lengkap (Jira / Trello Ready)
**Berdasarkan analisis source code `finz-backend`**
*Generated: 2026-04-22 | Siap copy-paste ke Jira/Trello*

---

## 📊 Kondisi Project Saat Ini

| Aspek | Status |
|---|---|
| Backend API | ✅ 10 endpoint aktif (Express.js + MySQL) |
| Database | ✅ 1 tabel `transactions` (8 field, 30 data dummy, 1 user) |
| AI Logic | ⚠️ **Semua MOCK** — rule-based, bukan model ML sungguhan |
| Tabel `users` | ❌ Belum ada |
| Tabel `budgets` | ❌ Belum ada |
| Data income | ❌ Hardcode `Rp5.000.000` di `aiService.js` line 297 |
| Labeled dataset | ❌ Tidak ada — belum bisa training model |
| Multi-user data | ❌ Hanya 1 user (user_id=1) |

### Variable/Field yang Sudah Ada di Database

```
transactions:
├── id              (INT, auto increment, PK)
├── user_id         (INT, default 1)
├── amount          (DECIMAL 15,2)
├── category        (ENUM: makanan/transport/hiburan/belanja/tagihan/pendidikan/kesehatan/lainnya)
├── description     (VARCHAR 255, free text)
├── payment_method  (ENUM: cash/debit/credit/ewallet/transfer/qris)
├── date            (DATE, YYYY-MM-DD)
└── created_at      (DATETIME)
```

---

# 🔬 EPIC: DATA SCIENCE

---

## 📋 Story DS-1: Dataset Category Classification

> **Tujuan:** Bangun labeled dataset untuk melatih model klasifikasi kategori yang menggantikan keyword matching di `aiService.js`.

---

### ✅ Task DS-1.1 — Audit & Ekspansi Keyword Dictionary
**Priority:** 🔴 High | **Sprint:** Week 1 | **Effort:** 2 hari

**Deskripsi:**
Keyword dictionary saat ini di `aiService.js` hanya berisi ±130 keyword di 7 kategori. Kembangkan menjadi minimal 500 keyword.

**Langkah:**
- [ ] Audit keyword existing di `CATEGORY_RULES` (`aiService.js` line 74–116)
- [ ] Identifikasi kata-kata Gen-Z yang belum tercakup (misal: "ngopi", "jajan", "cfd", "laundry", dsb.)
- [ ] Cek overlap ambigu antar kategori dan resolve
- [ ] Test coverage: 80% kalimat deskripsi transaksi Gen-Z harus terklasifikasi benar
- [ ] Dokumentasikan jumlah keyword per kategori

**Acceptance Criteria:**
- Dictionary dikembangkan dari ±130 menjadi minimal 500 keyword
- Tidak ada overlap kata kunci ambigu antar kategori
- Coverage test: 80% deskripsi terklasifikasi benar

**Output:** `keyword_dictionary_v2.json` + test coverage report

**Dependencies:** Tidak ada (bisa langsung mulai)

---

### ✅ Task DS-1.2 — Pengumpulan & Labeling Dataset Deskripsi Transaksi
**Priority:** 🔴 Critical | **Sprint:** Week 2 | **Effort:** 5 hari

**Deskripsi:**
Kumpulkan minimal 500 contoh deskripsi transaksi nyata untuk melatih model klasifikasi. Ini adalah **bottleneck utama** dari seluruh project AI.

**Langkah:**
- [ ] Tentukan sumber data: survey mahasiswa, open dataset, atau generasi sintetis
- [ ] Kumpulkan minimal 500 deskripsi transaksi real
- [ ] Labeling manual setiap deskripsi ke salah satu dari 8 kategori:
  - `makanan`, `transport`, `hiburan`, `belanja`, `tagihan`, `pendidikan`, `kesehatan`, `lainnya`
- [ ] Beri `confidence` level dan `source` tag tiap record
- [ ] Pastikan distribusi label seimbang (maksimal 35% per kategori)
- [ ] Validasi kualitas label: cross-check 10% oleh reviewer kedua

**Format output per record:**
```json
{
  "text": "makan siang di warteg",
  "label": "makanan",
  "confidence": "high",
  "source": "user_labeled"
}
```

**Variable/field yang dibutuhkan dalam dataset:**
| Variable | Type | Keterangan |
|---|---|---|
| `text` | string | Deskripsi transaksi (Bahasa Indonesia, informal Gen-Z) |
| `label` | string/enum | Salah satu dari 8 kategori |
| `confidence` | string | `high` / `medium` / `low` |
| `source` | string | `user_labeled` / `rule_based` / `synthetic` |

**Acceptance Criteria:**
- Minimal 500 record terlabel
- Distribusi: tidak ada 1 kategori > 35% total
- Format JSONL (`dataset_category_v1.jsonl`)

**Output:** `dataset_category_v1.jsonl`

**Dependencies:** DS-1.1 (keyword dictionary sebagai referensi label)

> [!CAUTION]
> Ini adalah **CRITICAL PATH** — AI Engineer tidak bisa deploy model NLP tanpa dataset ini. Target selesai akhir Week 2.

---

### ✅ Task DS-1.3 — EDA (Exploratory Data Analysis) Data Transaksi
**Priority:** 🟡 Medium | **Sprint:** Week 1 | **Effort:** 2 hari

**Deskripsi:**
Lakukan analisis eksploratif pada data transaksi yang ada (30 record dari seeder) dan data baru yang terkumpul.

**Langkah:**
- [ ] Distribusi `amount` (nominal) per kategori → histogram/boxplot
- [ ] Pola `payment_method` per kategori → heatmap
- [ ] Identifikasi outlier transaksi (amount > 3 standard deviation)
- [ ] Analisis missing/anomali data
- [ ] Distribusi transaksi per hari (daily pattern)
- [ ] Distribusi per bulan (monthly trend)
- [ ] Laporan data quality: field mana yang perlu cleaning

**Variable yang dianalisis:**
| Variable | Analisis |
|---|---|
| `amount` | Distribusi, outlier, rata-rata per kategori |
| `category` | Frekuensi, proporsi, balance |
| `payment_method` | Korelasi dengan kategori |
| `date` | Pola temporal (weekday/weekend, awal/akhir bulan) |
| `description` | Panjang teks rata-rata, keyword frequency |

**Acceptance Criteria:**
- Laporan distribusi amount per kategori
- Laporan pola payment_method per kategori
- Identifikasi outlier
- Laporan missing/anomali data

**Output:** `eda_transactions.ipynb` + summary report (PDF/MD)

**Dependencies:** Tidak ada (pakai data seeder yang ada)

---

## 📋 Story DS-2: Model Prediksi Saldo & Financial Score

> **Tujuan:** Bangun model prediksi saldo yang lebih akurat dari rata-rata harian saat ini, dan kalibrasi financial health score.

---

### ✅ Task DS-2.1 — Feature Engineering untuk Prediksi Saldo
**Priority:** 🟡 Medium | **Sprint:** Week 2 | **Effort:** 3 hari

**Deskripsi:**
Identifikasi dan dokumentasikan fitur-fitur yang dibutuhkan untuk model prediksi saldo. Saat ini backend hanya pakai `avg_per_day` × `days_remaining` (lihat `aiService.js` line 23–68).

**Fitur yang perlu di-engineer:**
- [ ] Definisikan minimal 8 fitur temporal:

| Fitur | Definisi | Formula |
|---|---|---|
| `avg_weekday_spend` | Rata-rata pengeluaran hari kerja (Sen–Jum) | SUM(amount where Mon-Fri) / COUNT(weekdays) |
| `avg_weekend_spend` | Rata-rata pengeluaran akhir pekan | SUM(amount where Sat-Sun) / COUNT(weekends) |
| `recurring_monthly_total` | Total pengeluaran rutin bulanan | SUM(amount where is_recurring=true) |
| `spending_trend_7d` | Tren pengeluaran 7 hari terakhir | Linear regression slope 7 hari |
| `bill_due_dates` | Tanggal jatuh tempo tagihan | Array of dates from tagihan category |
| `day_of_month` | Hari ke-berapa dalam bulan | EXTRACT(day from current_date) |
| `days_remaining` | Sisa hari di bulan ini | last_day - current_day |
| `last_7d_avg` | Rata-rata pengeluaran 7 hari terakhir | SUM(last 7 days amount) / 7 |

- [ ] Dokumentasikan setiap fitur dengan contoh kalkulasi
- [ ] Identifikasi fitur mana yang memerlukan field baru di database

**Variable baru yang dibutuhkan di database:**
| Field Baru | Tabel | Type | Keterangan |
|---|---|---|---|
| `transaction_type` | `transactions` | ENUM('expense','income') | Bedakan pemasukan vs pengeluaran |
| `hour_of_day` | `transactions` | TINYINT(0-23) | Jam transaksi untuk pola temporal |
| `is_recurring` | `transactions` | BOOLEAN | Apakah transaksi rutin bulanan |

**Acceptance Criteria:**
- Minimal 8 fitur terdefinisi dengan formula
- Setiap fitur terdokumentasi

**Output:** `feature_catalog_balance_prediction.md`

**Dependencies:** DS-1.3 (insight dari EDA)

---

### ✅ Task DS-2.2 — Baseline Model & Benchmarking Prediksi Saldo
**Priority:** 🟡 Medium | **Sprint:** Week 3 | **Effort:** 4 hari

**Deskripsi:**
Ukur akurasi metode saat ini (rata-rata harian) dan bandingkan dengan model alternatif.

**Langkah:**
- [ ] Ukur MAPE (Mean Absolute Percentage Error) dari current mock sebagai baseline
- [ ] Implementasi dan uji minimal 2 model alternatif:
  - Simple Linear Regression
  - Random Forest Regressor
- [ ] Split data: train (70%) / test (30%)
- [ ] Bandingkan: MAPE, MAE, R², prediction interval
- [ ] Pilih model terbaik dengan dokumentasi trade-off
- [ ] Export model terbaik sebagai file (pickle/joblib/ONNX)

**Variable input untuk training:**
| Variable | Source | Keterangan |
|---|---|---|
| `total_spent_so_far` | Kalkulasi dari `transactions.amount` | Total pengeluaran bulan berjalan |
| `day_of_month` | `transactions.date` | Hari ke-berapa |
| `avg_daily_spend` | Kalkulasi | Rata-rata harian |
| `category_proportions` | Kalkulasi dari `transactions.category` | Proporsi per kategori |
| `payment_method_dist` | Kalkulasi dari `transactions.payment_method` | Distribusi metode bayar |
| `weekday_avg` | Derived feature | Rata-rata weekday |
| `weekend_avg` | Derived feature | Rata-rata weekend |
| Target: `actual_end_balance` | Historis | Saldo akhir bulan aktual |

**Acceptance Criteria:**
- Baseline MAPE terukur
- Minimal 2 model diuji dan dibandingkan
- Model terbaik dipilih dengan justifikasi

**Output:** `model_benchmark_balance.ipynb`

**Dependencies:** DS-2.1 (feature catalog), DS-1.3 (EDA insights)

---

### ✅ Task DS-2.3 — Kalibrasi Financial Health Score
**Priority:** 🟡 Medium | **Sprint:** Week 3 | **Effort:** 2 hari

**Deskripsi:**
Validasi formula bobot financial score yang saat ini dipakai di `aiService.js` line 321–326:
```
score = saving_ratio × 0.35 + spending_consistency × 0.30 + category_diversity × 0.20 + bill_payment × 0.15
```

**Langkah:**
- [ ] Buat minimal 10 skenario user fiktif yang realistis (misal: mahasiswa hemat, mahasiswa boros, pekerja part-time, dsb.)
- [ ] Hitung expected score manual untuk tiap skenario
- [ ] Bandingkan dengan output formula existing
- [ ] Identifikasi skenario yang hasilnya tidak masuk akal
- [ ] Rekomendasi penyesuaian bobot jika perlu
- [ ] Validasi bahwa `ASSUMED_INCOME = Rp5.000.000` sesuai untuk target Gen-Z

**Variable yang divalidasi:**
| Komponen | Bobot Saat Ini | Range |
|---|---|---|
| `saving_ratio` | 35% | 0–100 (asumsi income Rp5jt) |
| `spending_consistency` | 30% | 0–100 (coefficient of variation) |
| `category_diversity` | 20% | 0–100 (jumlah kategori / 6 × 100) |
| `bill_payment` | 15% | 50 atau 80 (ada/tidak ada tagihan) |

**Acceptance Criteria:**
- 10 skenario diuji, toleransi ±5 poin per skenario
- Rekomendasi bobot baru (jika diperlukan) terdokumentasi

**Output:** `financial_score_calibration_report.md`

**Dependencies:** DS-1.3 (EDA)

---

## 📋 Story DS-3: Recommendation Engine

> **Tujuan:** Rekomendasi yang spesifik berdasarkan profil user, bukan template generik seperti saat ini (`RECOMMENDATION_TEMPLATES` di `aiService.js` line 146–206).

---

### ✅ Task DS-3.1 — Mapping Skenario → Rekomendasi
**Priority:** 🟡 Medium | **Sprint:** Week 3 | **Effort:** 3 hari

**Deskripsi:**
Buat rule matrix untuk personalized recommendation engine.

**Langkah:**
- [ ] Petakan minimal 20 skenario berbeda (kombinasi: kategori dominan × occupation × financial_goal)
- [ ] Setiap skenario punya trigger condition terukur (bukan opini)
- [ ] Tidak ada 2 skenario yang hasilkan rekomendasi 100% identik
- [ ] Format spreadsheet untuk handoff ke AI Engineer

**Variable baru yang dibutuhkan (tabel `users` — belum ada):**
| Field | Type | Keterangan |
|---|---|---|
| `monthly_income` | DECIMAL(15,2) | Pemasukan bulanan user |
| `age` | TINYINT | Untuk segmentasi Gen-Z (17–27) |
| `occupation` | ENUM | `mahasiswa` / `karyawan` / `freelancer` / `wirausaha` |
| `financial_goal` | ENUM | `hemat` / `investasi` / `bebas_utang` / `dana_darurat` |
| `risk_profile` | ENUM | `konservatif` / `moderat` / `agresif` |

**Variable baru yang dibutuhkan (tabel `budgets` — belum ada):**
| Field | Type | Keterangan |
|---|---|---|
| `user_id` | INT FK | Relasi ke users |
| `category` | ENUM | Sama dengan enum di transactions |
| `limit_amount` | DECIMAL(15,2) | Batas per kategori per bulan |
| `month` | DATE | Format YYYY-MM-01 |

**Acceptance Criteria:**
- 20+ skenario terpetakan
- Trigger condition jelas dan terukur
- Tidak ada duplikat rekomendasi

**Output:** `recommendation_rule_matrix.xlsx`

**Dependencies:** DS-1.3, DS-2.3

---

### ✅ Task DS-3.2 — A/B Test Plan untuk Rekomendasi
**Priority:** 🟢 Low | **Sprint:** Week 4 | **Effort:** 2 hari

**Deskripsi:**
Rancang A/B test untuk mengukur efektivitas rekomendasi setelah ada minimal 50 user aktif.

**Langkah:**
- [ ] Definisikan primary metric: CTR rekomendasi
- [ ] Definisikan secondary metric: perubahan spending 30 hari setelah rekomendasi
- [ ] Hitung minimum sample size
- [ ] Tentukan durasi test
- [ ] Dokumentasikan plan lengkap

**Acceptance Criteria:**
- Plan terdokumentasi dan disetujui PM
- Ready eksekusi setelah 50+ user aktif

**Output:** `ab_test_plan_recommendation.md`

**Dependencies:** DS-3.1

---

# 🤖 EPIC: AI ENGINEERING

> **Catatan:** Beberapa task AI Engineer bisa dimulai **paralel** sambil menunggu dataset dari Data Scientist. Task yang bisa dimulai langsung ditandai ⚡.

---

## 📋 Story AIE-1: NLP Pipeline Klasifikasi Kategori

> **Tujuan:** Ganti keyword matching di `aiService.js` dengan model yang lebih robust.

---

### ⚡ Task AIE-1.1 — Evaluasi Pendekatan Model (BISA MULAI DULUAN)
**Priority:** 🔴 High | **Sprint:** Week 1 | **Effort:** 2 hari

**Deskripsi:**
Evaluasi 3 pendekatan untuk mengganti fungsi `predictCategory()` di `aiService.js` line 123–140.

**Langkah:**
- [ ] Evaluasi pendekatan 1: **TF-IDF + Logistic Regression** (lightweight, offline)
- [ ] Evaluasi pendekatan 2: **Fine-tuned IndoBERT Lite** (akurat untuk Bahasa Indonesia)
- [ ] Evaluasi pendekatan 3: **Zero-shot LLM API** (OpenAI/Gemini, biaya per-request)
- [ ] Buat trade-off matrix:

| Kriteria | TF-IDF+LR | IndoBERT Lite | LLM API |
|---|---|---|---|
| Akurasi (est.) | ? | ? | ? |
| Latency | ? ms | ? ms | ? ms |
| Biaya/request | Rp0 | Rp0 | Rp? |
| Butuh training data? | Ya | Ya | Tidak |
| Kemudahan update | ? | ? | ? |

- [ ] Pilih pendekatan dan dokumentasikan justifikasi
- [ ] Buat PoC (Proof of Concept) pendekatan terpilih

**Acceptance Criteria:**
- 3 pendekatan dievaluasi
- Trade-off matrix terdokumentasi
- Keputusan final dipilih

**Output:** `nlp_approach_decision.md`

**Dependencies:** Tidak ada — **BISA MULAI LANGSUNG** ⚡

---

### ⚡ Task AIE-1.2 — Setup Tabel `prediction_logs` (BISA MULAI DULUAN)
**Priority:** 🔴 High | **Sprint:** Week 1 | **Effort:** 0.5 hari

**Deskripsi:**
Buat tabel baru di database untuk logging prediksi. Ini infrastruktur dasar yang dibutuhkan sebelum model di-deploy.

**Langkah:**
- [ ] Buat model Sequelize `PredictionLog`
- [ ] Tambahkan migration/sync ke `database.js`
- [ ] Test insert/query

**Schema tabel `prediction_logs`:**
```sql
CREATE TABLE prediction_logs (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  input_text      VARCHAR(500) NOT NULL,
  predicted_category  VARCHAR(50) NOT NULL,
  confidence      DECIMAL(3,2),
  model_version   VARCHAR(20),
  user_overridden BOOLEAN DEFAULT FALSE,
  final_category  VARCHAR(50),
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Acceptance Criteria:**
- Tabel `prediction_logs` aktif di MySQL
- Insert/query berfungsi

**Output:** Model `PredictionLog.js` + migrasi

**Dependencies:** Tidak ada — **BISA MULAI LANGSUNG** ⚡

---

### ⚡ Task AIE-1.3 — Setup Tabel `users` dan `budgets` (BISA MULAI DULUAN)
**Priority:** 🔴 Critical | **Sprint:** Week 1 | **Effort:** 1 hari

**Deskripsi:**
Buat infrastruktur tabel yang dibutuhkan AI sebelum dataset siap. Tabel `users` diperlukan untuk mengganti `ASSUMED_INCOME = 5_000_000` hardcode.

**Langkah:**
- [ ] Buat model Sequelize `User` dengan field:
  - `id`, `name`, `email`, `monthly_income`, `age`, `occupation`, `financial_goal`, `risk_profile`
- [ ] Buat model Sequelize `Budget` dengan field:
  - `id`, `user_id` (FK), `category`, `limit_amount`, `month`
- [ ] Tambahkan field baru ke model `Transaction`:
  - `transaction_type` (ENUM: 'expense', 'income')
  - `hour_of_day` (TINYINT)
  - `is_recurring` (BOOLEAN)
- [ ] Buat relasi: User hasMany Transaction, User hasMany Budget
- [ ] Update seeder dengan data user default
- [ ] Test semua relasi

**Acceptance Criteria:**
- Tabel `users` dan `budgets` aktif
- Field baru di `transactions` aktif
- Relasi antar tabel berfungsi

**Output:** Model files + updated seeder

**Dependencies:** Tidak ada — **BISA MULAI LANGSUNG** ⚡

---

### Task AIE-1.4 — Build & Deploy NLP Inference Endpoint Kategori
**Priority:** 🔴 Critical | **Sprint:** Week 3 | **Effort:** 4 hari

**Deskripsi:**
Ganti keyword matching di `POST /api/predict/category` dengan model inference. Endpoint harus tetap backward compatible.

**Langkah:**
- [ ] Implementasi model terpilih dari AIE-1.1
- [ ] Training model menggunakan dataset dari DS-1.2
- [ ] Load model ke endpoint `predictCategory()` di `aiService.js`
- [ ] Response tetap format sama: `{ category, confidence, matched_keywords }`
- [ ] Tambahkan fallback ke keyword matching jika model gagal
- [ ] Benchmark latency: target < 300ms (p95)
- [ ] Integration test dengan frontend

**File yang dimodifikasi:**
- `src/services/aiService.js` — fungsi `predictCategory()`
- `src/controllers/aiController.js` — (mungkin perlu async jika belum)

**Acceptance Criteria:**
- Endpoint upgraded dari keyword matching ke model inference
- Response time < 300ms (p95)
- Fallback ke keyword matching jika model gagal
- Format response tidak berubah (backward compatible)

**Output:** Updated `aiService.js` + model file

**Dependencies:** 
- ⏳ **Menunggu DS-1.2** (dataset kategori dari Data Scientist)
- AIE-1.1 (keputusan pendekatan model)

---

### Task AIE-1.5 — Logging & Feedback Pipeline
**Priority:** 🟡 Medium | **Sprint:** Week 2-3 | **Effort:** 2 hari

**Deskripsi:**
Implementasi logging otomatis setiap kali prediksi kategori dipanggil, untuk data monitoring dan retraining.

**Langkah:**
- [ ] Buat middleware/service `predictionLogger.js`
- [ ] Setiap prediksi dicatat ke tabel `prediction_logs`:
  ```json
  {
    "input_text": "makan siang di warteg",
    "predicted_category": "makanan",
    "confidence": 0.94,
    "model_version": "keyword_v1",
    "user_overridden": false,
    "final_category": "makanan"
  }
  ```
- [ ] Logging berjalan async (tidak blocking response)
- [ ] Buat endpoint `GET /api/admin/prediction-stats` untuk monitoring

**Acceptance Criteria:**
- Setiap prediksi tercatat di database
- Pipeline tidak menambah latency endpoint
- Stats endpoint berfungsi

**Output:** `predictionLogger.js` + middleware + stats endpoint

**Dependencies:** AIE-1.2 (tabel prediction_logs)

---

## 📋 Story AIE-2: Upgrade Balance Prediction Service

> **Tujuan:** Ganti estimasi linear sederhana (`avg_per_day × days_remaining`) dengan model yang aware pola mingguan dan recurring.

---

### ⚡ Task AIE-2.1 — Implementasi Feature Extractor (BISA MULAI DULUAN)
**Priority:** 🟡 Medium | **Sprint:** Week 2 | **Effort:** 3 hari

**Deskripsi:**
Buat service baru yang mengekstrak fitur-fitur dari database berdasarkan katalog fitur dari DS-2.1.

**Langkah:**
- [ ] Buat file `src/services/balancePredictionFeatureExtractor.js`
- [ ] Implementasi query ke `transactions` table untuk menghasilkan semua fitur
- [ ] Fitur yang di-extract:
  - `avg_weekday_spend` (dari query WHERE DAYOFWEEK IN 2-6)
  - `avg_weekend_spend` (dari query WHERE DAYOFWEEK IN 1,7)
  - `recurring_monthly_total` (dari WHERE is_recurring=true)
  - `spending_trend_7d` (linear regression 7 hari terakhir)
  - `last_7d_avg` (simple average 7 hari terakhir)
  - `day_of_month`, `days_remaining`
  - `category_proportions` (object {makanan: 0.13, belanja: 0.27, ...})
- [ ] Unit test coverage minimal 80%
- [ ] Handle edge cases: user baru (< 7 hari data), bulan pertama

**Acceptance Criteria:**
- Semua fitur dari DS-2.1 dapat di-extract dari database
- Unit test 80%+
- Edge cases handled

**Output:** `balancePredictionFeatureExtractor.js` + test file

**Dependencies:** DS-2.1 (feature catalog) — tapi **bisa mulai kerangka kode duluan** ⚡

---

### Task AIE-2.2 — Integrasi Model Balance Prediction ke Endpoint
**Priority:** 🟡 Medium | **Sprint:** Week 4 | **Effort:** 3 hari

**Deskripsi:**
Ganti logika di `predictBalance()` (`aiService.js` line 23–68) dengan model dari DS-2.2.

**Langkah:**
- [ ] Load model hasil training DS-2.2
- [ ] Panggil feature extractor dari AIE-2.1
- [ ] Inject fitur ke model → prediksi
- [ ] Response tetap format sama (backward compatible):
  ```json
  {
    "predicted_balance": 850000,
    "status": "warning",
    "message": "...",
    "detail": { ... }
  }
  ```
- [ ] Tambahkan field baru: `prediction_method` ("ml_model" / "fallback_linear")
- [ ] Fallback ke metode lama jika data user < 7 hari
- [ ] Integration test

**File yang dimodifikasi:**
- `src/services/aiService.js` — fungsi `predictBalance()`

**Acceptance Criteria:**
- Model ML terintegrasi
- Backward compatible
- Fallback berfungsi

**Output:** Updated `aiService.js` + dokumentasi

**Dependencies:**
- ⏳ **Menunggu DS-2.2** (trained model dari Data Scientist)
- AIE-2.1 (feature extractor)

---

### ⚡ Task AIE-2.3 — Caching Layer untuk Prediksi (BISA MULAI DULUAN)
**Priority:** 🟢 Low | **Sprint:** Week 4 | **Effort:** 1 hari

**Deskripsi:**
Implementasi in-memory cache untuk hasil prediksi agar tidak query ulang setiap request.

**Langkah:**
- [ ] Buat file `src/services/predictionCache.js`
- [ ] Cache per `user_id`, TTL 1 jam
- [ ] Auto-invalidate saat ada transaksi baru (hook di `transactionController.js`)
- [ ] In-memory (Map/WeakMap) — tidak butuh Redis untuk MVP

**Acceptance Criteria:**
- Cache berfungsi dengan TTL 1 jam
- Auto-invalidate saat transaksi baru

**Output:** `predictionCache.js` + integrasi ke controller

**Dependencies:** Tidak ada — **BISA MULAI LANGSUNG** ⚡

---

## 📋 Story AIE-3: Personalized Recommendation Engine

> **Tujuan:** Ganti `RECOMMENDATION_TEMPLATES` hardcode di `aiService.js` line 146–206 dengan engine yang membaca profil user.

---

### Task AIE-3.1 — Implementasi Rule Matrix Engine
**Priority:** 🟡 Medium | **Sprint:** Week 4 | **Effort:** 3 hari

**Deskripsi:**
Implementasikan rule matrix dari DS-3.1 menjadi kode yang mengeksekusi rekomendasi berdasarkan profil user.

**Langkah:**
- [ ] Buat file `src/services/recommendationRules.json` dari output DS-3.1
- [ ] Update `getRecommendations()` di `aiService.js` (line 212–253):
  - Query profil user dari tabel `users`
  - Query budget dari tabel `budgets`
  - Evaluasi semua rules terhadap data user
  - Return 3–7 rekomendasi paling relevan
- [ ] Tambahkan field `trigger_reason` di setiap rekomendasi
- [ ] Unit test: 10 skenario berbeda menghasilkan output berbeda

**Response baru:**
```json
{
  "id": "rec_001",
  "title": "Kurangi Pengeluaran Belanja",
  "description": "Pengeluaranmu untuk belanja sudah 26.9% dari total...",
  "type": "warning",
  "icon": "🛍️",
  "trigger_reason": "Kategori belanja melebihi threshold 25%",
  "priority": 1
}
```

**Acceptance Criteria:**
- Rule engine berfungsi berdasarkan matrix DS-3.1
- Return 3–7 rekomendasi per user
- Unit test 10 skenario lulus

**Output:** Updated `aiService.js` + `recommendation_rules.json`

**Dependencies:**
- ⏳ **Menunggu DS-3.1** (rule matrix dari Data Scientist)
- AIE-1.3 (tabel users + budgets harus sudah ada)

---

### Task AIE-3.2 — Budget Alert System (Endpoint Baru)
**Priority:** 🟡 Medium | **Sprint:** Week 5 | **Effort:** 2 hari

**Deskripsi:**
Buat endpoint baru `GET /api/budget-alert/:user_id` yang mengembalikan kategori yang mendekati/melebihi budget.

**Langkah:**
- [ ] Buat route baru di `src/routes/aiRoutes.js`
- [ ] Buat controller handler di `aiController.js`
- [ ] Logic:
  - Query `budgets` WHERE user_id AND month = bulan ini
  - Query total spending per kategori bulan ini dari `transactions`
  - Bandingkan: jika spent ≥ 80% limit → status `warning`, ≥ 100% → `exceeded`
- [ ] Jika user belum set budget, return `{ alerts: [], has_budget_set: false }`
- [ ] Integration test

**Response format:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "category": "belanja",
        "spent": 635000,
        "limit": 500000,
        "percentage": 127,
        "status": "exceeded"
      }
    ],
    "has_budget_set": true,
    "period": "2026-04"
  }
}
```

**Acceptance Criteria:**
- Endpoint aktif dan tested
- Graceful handling jika belum ada budget

**Output:** New endpoint + dokumentasi

**Dependencies:** AIE-1.3 (tabel budgets), AIE-3.1

---

## 📋 Story AIE-4: Integration & Testing

---

### Task AIE-4.1 — End-to-End Integration Test
**Priority:** 🔴 High | **Sprint:** Week 5 | **Effort:** 2 hari

**Langkah:**
- [ ] Test semua endpoint upgraded bekerja dengan frontend React
- [ ] Test fallback mechanism (model fail → keyword matching)
- [ ] Test cache invalidation
- [ ] Test prediction logging
- [ ] Test budget alert
- [ ] Performance test: semua endpoint < 500ms

**Dependencies:** AIE-1.4, AIE-2.2, AIE-3.1 semua selesai

---

### Task AIE-4.2 — Dokumentasi API Final
**Priority:** 🟡 Medium | **Sprint:** Week 5 | **Effort:** 1 hari

**Langkah:**
- [ ] Update `dokumentasi end point` dengan semua perubahan
- [ ] Dokumentasikan contract baru (request/response)
- [ ] Dokumentasikan fallback behavior
- [ ] Dokumentasikan tabel baru dan relasinya

**Dependencies:** AIE-4.1

---

# 📅 TIMELINE RINGKAS (5 Minggu)

```
WEEK 1 — Fondasi
├── DS: DS-1.1 (Audit keyword) + DS-1.3 (EDA)
├── AIE: AIE-1.1 (Evaluasi model) ⚡
├── AIE: AIE-1.2 (Tabel prediction_logs) ⚡
└── AIE: AIE-1.3 (Tabel users + budgets) ⚡

WEEK 2 — Dataset & Feature
├── DS: DS-1.2 (Labeling 500 deskripsi) ← CRITICAL PATH
├── DS: DS-2.1 (Feature engineering)
├── AIE: AIE-2.1 (Feature extractor) ⚡
└── AIE: AIE-1.5 (Logging pipeline)

WEEK 3 — Model Development
├── DS: DS-2.2 (Benchmark model balance)
├── DS: DS-2.3 (Kalibrasi score)
├── DS: DS-3.1 (Mapping rekomendasi)
└── AIE: AIE-1.4 (Deploy NLP endpoint) ← tergantung DS-1.2

WEEK 4 — Integration & Upgrade
├── DS: DS-3.2 (A/B test plan)
├── AIE: AIE-2.2 (Integrasi model balance) ← tergantung DS-2.2
├── AIE: AIE-3.1 (Recommendation engine) ← tergantung DS-3.1
└── AIE: AIE-2.3 (Caching layer) ⚡

WEEK 5 — Testing & Launch
├── AIE: AIE-3.2 (Budget alert)
├── AIE: AIE-4.1 (E2E integration test)
├── AIE: AIE-4.2 (Dokumentasi final)
└── DS: Validasi output model
```

---

# 🔗 DEPENDENCY MAP

```
DS-1.1 ──→ DS-1.2 ──→ AIE-1.4 (Deploy NLP)
              │
DS-1.3 ──→ DS-2.1 ──→ AIE-2.1 (Feature Extractor)
              │                    │
              └──→ DS-2.2 ──→ AIE-2.2 (Model Balance)
              │
              └──→ DS-2.3 (Kalibrasi Score) [independent]
              │
              └──→ DS-3.1 ──→ AIE-3.1 (Rule Engine)
                                  │
                                  └──→ AIE-3.2 (Budget Alert)

[Semua AIE selesai] ──→ AIE-4.1 (Integration Test) ──→ GO LIVE 🚀
```

---

# ⚡ RINGKASAN: APA YANG AI ENGINEER BISA KERJAKAN SEKARANG

Sambil menunggu Data Scientist menyediakan dataset, AI Engineer bisa langsung mulai **5 task** ini:

| Task | Deskripsi | Effort |
|---|---|---|
| **AIE-1.1** | Evaluasi & PoC pendekatan model NLP | 2 hari |
| **AIE-1.2** | Setup tabel `prediction_logs` di MySQL | 0.5 hari |
| **AIE-1.3** | Setup tabel `users` + `budgets` + field baru di `transactions` | 1 hari |
| **AIE-2.1** | Kerangka feature extractor (query logic) | 3 hari |
| **AIE-2.3** | Caching layer in-memory | 1 hari |
| **TOTAL** | | **7.5 hari** |

---

# 📋 RINGKASAN: APA YANG DATA SCIENTIST HARUS SIAPKAN

| Deliverable | Untuk Siapa | Deadline |
|---|---|---|
| `keyword_dictionary_v2.json` (500+ keyword) | AI Engineer (referensi fallback) | Week 1 |
| `dataset_category_v1.jsonl` (500+ labeled) | AI Engineer (training NLP model) | **Week 2** ⚠️ |
| `eda_transactions.ipynb` | PM + AI Engineer (insight) | Week 1 |
| `feature_catalog_balance_prediction.md` | AI Engineer (implementasi extractor) | Week 2 |
| `model_benchmark_balance.ipynb` + model file | AI Engineer (integrasi endpoint) | Week 3 |
| `financial_score_calibration_report.md` | PM + AI Engineer (update bobot) | Week 3 |
| `recommendation_rule_matrix.xlsx` | AI Engineer (rule engine) | Week 3 |
| `ab_test_plan_recommendation.md` | PM (future reference) | Week 4 |

---

*Total: **8 task Data Scientist** (23 hari) + **12 task AI Engineer** (23 hari)*
*Critical Path: DS-1.2 (Week 2) → AIE-1.4 (Week 3) → AIE-4.1 (Week 5) → Go-Live*

# FinZ — AI Product Planning Document
**Project Manager View | Berdasarkan source code aktual**
*Dibuat: 2026-04-16 | Sprint Planning Ready*

---

## 1. GAP ANALYSIS

### ✅ Yang Sudah Ada

| Komponen | Detail |
|---|---|
| Backend API | 4 endpoint AI sudah terdefinisi dan berjalan |
| Database | Tabel `transactions` dengan 8 field (id, user_id, amount, category, description, payment_method, date, created_at) |
| Mock AI Logic | Rule-based category prediction, weighted formula financial score, threshold-based recommendation |
| Kategori Enum | 8 kategori fix: makanan, transport, hiburan, belanja, tagihan, pendidikan, kesehatan, lainnya |
| Payment Enum | 6 metode: cash, debit, credit, ewallet, transfer, qris |
| Data Seed | 30 transaksi dummy (Apr–Feb 2026, 1 user) |
| Frontend Hook | `predictCategory`, `useDashboard`, `useTransactions` sudah ada tapi belum konek API |

### ❌ Yang Belum Ada

| Gap | Dampak ke AI |
|---|---|
| **Tidak ada tabel `users`** | Tidak bisa segmentasi user profile, asumsi income, risk appetite |
| **Tidak ada data pemasukan (income)** | Financial score & saving ratio pakai asumsi hardcode Rp5jt/bulan |
| **Tidak ada tabel `budgets`** | Tidak ada target per kategori — rekomendasi jadi generic |
| **Tidak ada data historis multi-user** | Model prediksi tidak bisa belajar dari pola kolektif |
| **Tidak ada feedback loop** | User tidak bisa rate rekomendasi → tidak ada signal kualitas |
| **Volume data ekstrem kurang** | 30 transaksi = 1 user × 2.5 bulan, tidak layak untuk ML |
| **Tidak ada fitur waktu** | Tidak ada `day_of_week`, `hour`, `is_weekend` untuk deteksi pola |
| **Tidak ada label ground truth** | Category prediction tidak punya labeled dataset untuk training |

### ⚠️ Masalah pada Struktur Data

```
Masalah 1: Field `description` free-text, tidak ada normalisasi
  → Model NLP akan sulit tanpa preprocessing pipeline

Masalah 2: `created_at` selalu diset ke `{date}T08:00:00`
  → Informasi jam transaksi hilang (pattern pagi/malam tidak bisa dideteksi)

Masalah 3: user_id hardcode = 1, tidak ada segmentasi user
  → Model tidak bisa belajar perbedaan perilaku antar user

Masalah 4: amount tidak dibedakan income vs expense
  → Saving ratio dan cash flow tidak bisa dihitung akurat

Masalah 5: Financial score pakai ASSUMED_INCOME = 5.000.000 (hardcode)
  → Akurasi score 0% karena tidak tahu income aktual user
```

---

## 2. DATA REQUIREMENT

### Field yang Dibutuhkan (Tambahan dari yang Sudah Ada)

**Tabel `users` (baru):**
| Field | Type | Keterangan |
|---|---|---|
| `id` | INT | Primary key |
| `monthly_income` | DECIMAL(15,2) | Pemasukan bulanan yang diinput user |
| `age` | TINYINT | Untuk segmentasi Gen-Z (17–27) |
| `occupation` | ENUM('mahasiswa','karyawan','freelancer','wirausaha') | Konteks pengeluaran |
| `financial_goal` | ENUM('hemat','investasi','bebas_utang','dana_darurat') | Target keuangan |
| `risk_profile` | ENUM('konservatif','moderat','agresif') | Untuk rekomendasi investasi |

**Tabel `budgets` (baru):**
| Field | Type | Keterangan |
|---|---|---|
| `user_id` | INT FK | |
| `category` | ENUM | Sama dengan transaksi |
| `limit_amount` | DECIMAL(15,2) | Batas per kategori per bulan |
| `month` | DATE | Format YYYY-MM-01 |

**Penambahan field ke `transactions` yang sudah ada:**
| Field Baru | Type | Keterangan |
|---|---|---|
| `transaction_type` | ENUM('expense','income') | Bedakan pemasukan vs pengeluaran |
| `hour_of_day` | TINYINT | Jam transaksi (0–23) untuk pola temporal |
| `is_recurring` | BOOLEAN | Apakah transaksi rutin bulanan |

### Format Data untuk Training

```
Format: JSONL (JSON Lines) untuk streaming ke training pipeline

Satu record training category classification:
{
  "text": "makan siang di warteg",
  "label": "makanan",
  "source": "user_labeled"   // atau "rule_based" (lower confidence)
}

Satu record training financial score:
{
  "user_id": 1,
  "month": "2026-04",
  "features": {
    "total_spending": 2360000,
    "income": 4500000,
    "saving_ratio": 0.476,
    "spending_consistency_cv": 0.82,
    "category_diversity": 7,
    "has_recurring_bills": true,
    "top_category": "belanja",
    "top_category_ratio": 0.269
  },
  "target_score": null   // akan dilabel oleh Data Scientist
}
```

### Volume Data Minimum

| Kebutuhan | Jumlah Minimum | Rekomendasi |
|---|---|---|
| Category classification training | 500 labeled descriptions | 2.000 untuk produksi |
| Financial score calibration | 100 user-months | 500 user-months |
| Balance prediction (per-user) | 90 hari transaksi per user | 180 hari |
| Anomaly detection | 1.000 transaksi per user | Tidak feasible saat ini |
| Recommendation personalization | 50 user aktif | 200+ user |

> **Kesimpulan:** Dengan 30 transaksi 1 user saat ini, **hanya kategori klasifikasi** yang bisa dibangun dengan rule+ML hybrid. Fitur lain perlu data collection period 2–3 bulan dulu.

---

## 3. TASK BREAKDOWN

---

### EPIC: Data Science

---

#### Story DS-1: Membangun Dataset Category Classification

> **Goal:** Punya labeled dataset untuk melatih model klasifikasi kategori yang menggantikan keyword matching saat ini.

**Task DS-1.1: Audit dan Ekspansi Keyword Dictionary**
- Acceptance Criteria:
  - Dictionary di `aiService.js` dikembangkan dari ±130 keyword menjadi minimal 500 keyword
  - Coverage uji: 80% kalimat deskripsi transaksi Gen-Z terklasifikasi dengan benar
  - Tidak ada overlap kata kunci antar kategori yang ambigu
- Output: `keyword_dictionary_v2.json` + test coverage report

**Task DS-1.2: Pengumpulan Data Deskripsi Transaksi**
- Acceptance Criteria:
  - Minimal 500 contoh deskripsi transaksi nyata dikumpulkan (bisa dari survey, open dataset, atau generasi sintetis dengan label manual)
  - Setiap record punya field: `text`, `label`, `confidence`, `source`
  - Distribusi label: tidak ada satu kategori melebihi 35% total data
- Output: `dataset_category_v1.jsonl`

**Task DS-1.3: EDA (Exploratory Data Analysis) Data Transaksi**
- Acceptance Criteria:
  - Laporan distribusi amount per kategori
  - Laporan pola payment_method per kategori
  - Identifikasi outlier transaksi (amount > 3 std dev)
  - Laporan missing/anomali data
- Output: Jupyter notebook `eda_transactions.ipynb` + summary report

---

#### Story DS-2: Membangun Model Prediksi Saldo

> **Goal:** Model yang lebih akurat dari rata-rata harian saat ini, dengan mempertimbangkan pola hari-dalam-minggu dan transaksi berulang.

**Task DS-2.1: Feature Engineering untuk Prediksi Saldo**
- Acceptance Criteria:
  - Minimal 8 fitur temporal didentifikasi: `avg_weekday_spend`, `avg_weekend_spend`, `recurring_monthly_total`, `spending_trend_7d`, `bill_due_dates`, `day_of_month`, `days_remaining`, `last_7d_avg`
  - Fitur terdokumentasi dengan definisi dan formula
- Output: `feature_catalog_balance_prediction.md`

**Task DS-2.2: Baseline Model & Benchmarking**
- Acceptance Criteria:
  - Current mock (rata-rata harian) diukur MAPE-nya sebagai baseline
  - Minimal 2 model alternatif diuji: Simple Linear Regression, Random Forest
  - Hasil benchmarking terdokumentasi
  - Model terbaik dipilih dengan justifikasi
- Output: `model_benchmark_balance.ipynb`

**Task DS-2.3: Kalibrasi Financial Health Score**
- Acceptance Criteria:
  - Formula bobot saat ini (35% saving, 30% consistency, 20% diversity, 15% bill) divalidasi dengan minimal 10 skenario user fiktif realistis
  - Tiap skenario punya expected score dan toleransi ±5 poin
  - Rekomendasi penyesuaian bobot jika ada skenario yang hasilnya tidak masuk akal
- Output: `financial_score_calibration_report.md`

---

#### Story DS-3: Membuat Recommendation Engine

> **Goal:** Rekomendasi yang spesifik berdasarkan profil user, bukan template generik.

**Task DS-3.1: Mapping Skenario → Rekomendasi**
- Acceptance Criteria:
  - Minimal 20 skenario berbeda (kombinasi kategori dominan × occupation × financial_goal) dipetakan ke rekomendasi spesifik
  - Setiap rekomendasi punya kondisi trigger yang terukur (bukan opini)
  - Tidak ada 2 skenario menghasilkan rekomendasi identik 100%
- Output: `recommendation_rule_matrix.xlsx`

**Task DS-3.2: A/B Test Plan untuk Rekomendasi**
- Acceptance Criteria:
  - Rancangan A/B test terdokumentasi: metric utama, durasi, sample size
  - Metric utama: Click-through rate pada rekomendasi, perubahan perilaku spending 30 hari setelah rekomendasi
  - Plan disetujui oleh PM dan siap diimplementasi setelah ada minimum 50 user aktif
- Output: `ab_test_plan_recommendation.md`

---

### EPIC: AI Engineering

---

#### Story AIE-1: Membangun NLP Pipeline Klasifikasi Kategori

> **Goal:** Mengganti keyword matching di `aiService.js` dengan model yang lebih robust.

**Task AIE-1.1: Evaluasi Pendekatan Model**
- Acceptance Criteria:
  - Minimal 3 pendekatan dievaluasi: TF-IDF + Logistic Regression, fine-tuned IndoBERT (lite), zero-shot dengan LLM API (OpenAI/Gemini)
  - Evaluasi mempertimbangkan: akurasi, latency (< 200ms), biaya per request, kemudahan update
  - Keputusan approach terdokumentasi dengan trade-off matrix
- Output: `nlp_approach_decision.md`

**Task AIE-1.2: Membangun & Deploy Inference Endpoint**
- Acceptance Criteria:
  - Endpoint `POST /api/predict/category` diganti dari keyword matching ke model inference
  - Response time < 300ms untuk 95th percentile
  - Fallback ke keyword matching jika model gagal (zero downtime)
  - Endpoint tetap return format yang sama: `{ category, confidence, matched_keywords }`
- Output: Updated `aiService.js` + model file / API integration

**Task AIE-1.3: Logging & Feedback Pipeline**
- Acceptance Criteria:
  - Setiap prediksi kategori dicatat: `{ input, predicted_category, confidence, user_overridden, final_category }`
  - Data tersimpan ke tabel `prediction_logs` di MySQL
  - Pipeline berjalan async, tidak blocking response
- Output: Tabel `prediction_logs` + middleware logging

---

#### Story AIE-2: Upgrade Balance Prediction Service

> **Goal:** Mengganti estimasi linear sederhana dengan model yang aware terhadap pola mingguan dan transaksi berulang.

**Task AIE-2.1: Implementasi Feature Extractor**
- Acceptance Criteria:
  - Service baru `balancePredictionFeatureExtractor.js` menghasilkan semua fitur dari DS-2.1
  - Fitur dikalkulasi dari data di database (query ke tabel transactions)
  - Unit test coverage minimal 80%
- Output: `balancePredictionFeatureExtractor.js` + test file

**Task AIE-2.2: Integrasi Model ke Endpoint**
- Acceptance Criteria:
  - Model dari DS-2.2 diintegrasikan ke `POST /api/predict/balance`
  - Response tetap dalam format yang sama (backward compatible dengan frontend)
  - Jika user tidak punya data cukup (< 7 hari), fallback ke metode lama dengan flag `{ method: "fallback_linear" }`
- Output: Updated `aiService.js` + dokumentasi

**Task AIE-2.3: Caching Layer untuk Prediksi**
- Acceptance Criteria:
  - Hasil prediksi di-cache per `user_id` selama 1 jam
  - Cache di-invalidate otomatis saat ada transaksi baru dari user tersebut
  - Cache menggunakan in-memory (tidak butuh Redis untuk MVP)
- Output: `predictionCache.js` + integrasi ke controller

---

#### Story AIE-3: Personalized Recommendation Engine

> **Goal:** Mengganti template hardcode dengan engine yang membaca profil dan data transaksi user.

**Task AIE-3.1: Implementasi Rule Matrix dari DS-3.1**
- Acceptance Criteria:
  - `recommendationService.js` mengeksekusi rule matrix dari DS-3.1
  - Rekomendasi berisi minimal 3 dan maksimal 7 item
  - Setiap rekomendasi punya field baru: `trigger_reason` (string penjelasan kenapa muncul)
  - Unit test: 10 skenario berbeda menghasilkan output yang diharapkan
- Output: Updated `aiService.js` + `recommendation_rules.json`

**Task AIE-3.2: Budget Alert System**
- Acceptance Criteria:
  - Endpoint baru `GET /api/budget-alert/:user_id` ditambahkan
  - Return: kategori yang sudah melebihi 80% budget bulan ini
  - Jika tabel `budgets` belum ada untuk user, return empty array (tidak error)
- Output: New endpoint + dokumentasi

---

## 4. API CONTRACT (REKOMENDASI)

### POST /api/predict/balance (Updated)

```json
{
  "request": {
    "current_balance": 3500000,
    "user_id": 1
  },
  "response": {
    "success": true,
    "data": {
      "predicted_balance": 850000,
      "status": "warning",
      "message": "Berdasarkan pola pengeluaranmu, saldo akan menipis 13 hari lagi.",
      "prediction_method": "ml_model",
      "confidence": 0.78,
      "detail": {
        "current_balance": 3500000,
        "spent_so_far": 2360000,
        "avg_per_day": 181538,
        "days_remaining": 14,
        "projected_spending": 2541538,
        "recurring_items_remaining": 500000,
        "weekday_avg": 195000,
        "weekend_avg": 120000
      },
      "milestones": [
        { "days_from_now": 5, "projected_balance": 1625000 },
        { "days_from_now": 10, "projected_balance": 400000 },
        { "days_from_now": 14, "projected_balance": -141538 }
      ]
    }
  }
}
```

### POST /api/predict/category (Updated)

```json
{
  "request": {
    "description": "bayar listrik kosan bulan ini"
  },
  "response": {
    "success": true,
    "data": {
      "category": "tagihan",
      "confidence": 0.94,
      "model": "nlp_v1",
      "alternatives": [
        { "category": "lainnya", "confidence": 0.04 },
        { "category": "belanja", "confidence": 0.02 }
      ],
      "explanation": "Terdeteksi kata kunci: listrik, bayar, kosan"
    }
  }
}
```

### GET /api/recommendation/:user_id (Updated)

```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": "rec_001",
      "title": "Kurangi Pengeluaran Belanja",
      "description": "Pengeluaranmu untuk belanja sudah 26.9% dari total bulan ini, melewati batas aman 25%.",
      "type": "warning",
      "icon": "🛍️",
      "trigger_reason": "Kategori belanja melebihi threshold 25%",
      "trigger_value": 0.269,
      "action_url": null,
      "priority": 1
    }
  ],
  "engine_version": "rule_v1",
  "generated_at": "2026-04-16T15:00:00Z"
}
```

### GET /api/financial-score/:user_id (Updated)

```json
{
  "success": true,
  "data": {
    "score": 72,
    "level": "Cukup Sehat",
    "trend": "stable",
    "trend_change": 0,
    "breakdown": {
      "saving_ratio": { "score": 53, "weight": 0.35, "note": "Berdasarkan asumsi income Rp5jt" },
      "spending_consistency": { "score": 70, "weight": 0.30, "note": "Variasi harian cukup tinggi" },
      "category_diversity": { "score": 100, "weight": 0.20, "note": "Menggunakan 7 dari 8 kategori" },
      "bill_payment": { "score": 80, "weight": 0.15, "note": "Ada transaksi tagihan bulan ini" }
    },
    "model_version": "score_v1",
    "data_quality_flag": "low_income_data"
  }
}
```

### GET /api/budget-alert/:user_id (Baru)

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
        "status": "exceeded",
        "surplus_or_deficit": -135000
      },
      {
        "category": "makanan",
        "spent": 311000,
        "limit": 400000,
        "percentage": 77.75,
        "status": "warning",
        "surplus_or_deficit": 89000
      }
    ],
    "has_budget_set": true,
    "period": "2026-04"
  }
}
```

---

## 5. TIMELINE (5 MINGGU)

```
WEEK 1: Fondasi Data
├── DS: EDA data transaksi yang ada (DS-1.3)
├── DS: Audit dan ekspansi keyword dictionary (DS-1.1)
├── AIE: Setup tabel prediction_logs di database
├── AIE: Evaluasi pendekatan model kategori (AIE-1.1)
└── PM: Finalisasi feature list, prioritasi dengan stakeholder

WEEK 2: Dataset & Modeling Kategori
├── DS: Pengumpulan & labeling 500 deskripsi transaksi (DS-1.2)
├── DS: Feature engineering balance prediction (DS-2.1)
├── AIE: Implementasi Feature Extractor (AIE-2.1)
├── AIE: Logging pipeline prediksi kategori (AIE-1.3)
└── [MILESTONE] Week 2 End: Dataset kategori siap

WEEK 3: Model Development
├── DS: Baseline & benchmark model balance prediction (DS-2.2)
├── DS: Kalibrasi financial health score (DS-2.3)
├── DS: Mapping skenario → rekomendasi (DS-3.1)
├── AIE: Build & deploy NLP endpoint kategori (AIE-1.2)
└── [MILESTONE] Week 3 End: Model kategori live (staging)

WEEK 4: Integration & Upgrade
├── DS: A/B test plan rekomendasi (DS-3.2)
├── AIE: Integrasi model balance prediction (AIE-2.2)
├── AIE: Implementasi recommendation rule matrix (AIE-3.1)
├── AIE: Caching layer prediksi (AIE-2.3)
└── [MILESTONE] Week 4 End: Semua endpoint upgraded di staging

WEEK 5: Testing, Polish & Launch
├── AIE: Budget Alert System (AIE-3.2)
├── AIE: End-to-end integration test dengan frontend
├── DS: Validasi output model pada test cases nyata
├── PM: Review API contract, dokumentasi final
└── [MILESTONE] Week 5 End: Go-live ke production
```

---

## 6. WORKLOAD DISTRIBUTION

### Data Scientist

| Task | Estimasi Effort (hari) |
|---|---|
| DS-1.1: Audit & ekspansi keyword dictionary | 2 hari |
| DS-1.2: Pengumpulan & labeling dataset kategori | 5 hari |
| DS-1.3: EDA transaksi | 2 hari |
| DS-2.1: Feature engineering prediksi saldo | 3 hari |
| DS-2.2: Baseline model & benchmarking | 4 hari |
| DS-2.3: Kalibrasi financial score | 2 hari |
| DS-3.1: Mapping skenario → rekomenasi | 3 hari |
| DS-3.2: A/B test plan | 2 hari |
| **TOTAL** | **23 hari (~4.6 minggu, 1 orang)** |

### AI Engineer

| Task | Estimasi Effort (hari) |
|---|---|
| AIE-1.1: Evaluasi pendekatan model | 2 hari |
| AIE-1.2: Deploy inference endpoint kategori | 4 hari |
| AIE-1.3: Logging & feedback pipeline | 2 hari |
| AIE-2.1: Feature extractor implementasi | 3 hari |
| AIE-2.2: Integrasi model balance ke endpoint | 3 hari |
| AIE-2.3: Caching layer | 1 hari |
| AIE-3.1: Recommendation rule engine | 3 hari |
| AIE-3.2: Budget alert endpoint | 2 hari |
| Integration test + bug fix | 3 hari |
| **TOTAL** | **23 hari (~4.6 minggu, 1 orang)** |

> **Catatan:** Timeline 5 minggu dengan 1 DS + 1 AIE adalah **ketat tapi feasible** jika tidak ada scope creep dan dataset tersedia di Week 2.

---

## 7. DEPENDENCY

```
[DS-1.3 EDA]
    └──► [DS-2.1 Feature Engineering]
              └──► [AIE-2.1 Feature Extractor]
                        └──► [AIE-2.2 Model Integration]

[DS-1.1 Keyword Dict]
    └──► [DS-1.2 Labeling Dataset]
              └──► [AIE-1.1 Evaluasi Approach]
                        └──► [AIE-1.2 Deploy Endpoint]
                                  └──► [AIE-1.3 Logging Pipeline]

[DS-2.2 Benchmark Model]
    └──► [AIE-2.2 Balance Integration]

[DS-2.3 Kalibrasi Score]
    └──► (validasi saja, AIE tidak butuh tunggu ini untuk deploy)

[DS-3.1 Mapping Skenario]
    └──► [AIE-3.1 Rule Engine]
              └──► [AIE-3.2 Budget Alert]

[AIE-1.2 + AIE-2.2 + AIE-3.1 semua selesai]
    └──► [Integration Test dengan Frontend]
              └──► [Go-Live]
```

**Critical Path:**
```
DS-1.2 (Selesai Week 2) → AIE-1.2 (Selesai Week 3) → Integration Test (Week 5) → Go-Live
```

**Blocker Terbesar:** Labeling dataset 500 transaksi di DS-1.2 adalah bottleneck utama karena membutuhkan kerja manual dan tidak bisa diparalel sepenuhnya.

---

## 8. RISK REGISTER

| # | Risiko | Probabilitas | Impact | Mitigasi |
|---|---|---|---|---|
| R-01 | **Dataset tidak cukup** — 500 deskripsi tidak mencukupi untuk akurasi > 85% | Tinggi | High | Augmentasi sintetis: generate variasi deskripsi dari keyword dict yang ada; pertimbangkan zero-shot LLM API sebagai interim |
| R-02 | **Tidak ada data income user** — financial score dan balance prediction tidak akurat | Sangat Tinggi | High | Tambahkan popup onboarding "input gaji/uang saku bulanan" di frontend sebagai quick fix; store di localStorage dulu, DB nanti |
| R-03 | **Latency model NLP** — IndoBERT lite bisa > 500ms per request | Medium | Medium | Fallback ke keyword matching dengan flag; pertimbangkan caching hasil untuk deskripsi yang sama |
| R-04 | **Scope creep** — stakeholder ingin tambah fitur tengah sprint | Medium | Medium | Freeze feature list di akhir Week 1, semua permintaan baru masuk backlog sprint berikutnya |
| R-05 | **Data transaksi tidak representatif** — 30 transaksi dari 1 user tidak mencerminkan perilaku real Gen-Z | Sangat Tinggi | High | Kumpulkan data nyata via beta user atau survei sebelum Week 2; tanpa ini DS-2.2 tidak reliable |
| R-06 | **Backend tidak support user profile** — tabel users belum ada | Tinggi | Medium | AIE buat tabel `user_preferences` minimal (id, monthly_income, occupation) di Week 1 sebagai prerequisite |
| R-07 | **Model drift setelah live** — pola pengeluaran Gen-Z berubah | Low (jangka pendek) | Medium | Jadwalkan retraining bulanan; implementasi logging prediction dari awal (AIE-1.3) untuk data monitoring |
| R-08 | **Biaya LLM API di production** — jika pakai OpenAI/Gemini untuk kategori | Medium | Medium | Set hard limit budget API; hybrid: gunakan rule-based untuk high-confidence, LLM hanya untuk low-confidence |

---

## APPENDIX: REFERENSI KODE AKTUAL

> Bagian ini untuk konteks AI Engineer agar tidak buat dari nol.

**File yang harus dimodifikasi:**
- `finz-backend/src/services/aiService.js` — semua 4 fungsi AI ada di sini
- `finz-backend/src/config/database.js` — tambah tabel baru di sini
- `finz-backend/src/routes/aiRoutes.js` — tambah route budget-alert

**Endpoint yang sudah ada dan harus di-upgrade (bukan dibuat ulang):**
```
POST /api/predict/balance     → upgrade aiService.predictBalance()
POST /api/predict/category    → upgrade aiService.predictCategory()
GET  /api/recommendation/:id  → upgrade aiService.getRecommendations()
GET  /api/financial-score/:id → upgrade aiService.getFinancialScore()
```

**Endpoint baru yang perlu dibuat:**
```
GET  /api/budget-alert/:user_id   → buat baru
POST /api/feedback/recommendation → untuk A/B test (Week 5)
```

**Asumsi income saat ini yang harus diganti:**
```javascript
// aiService.js, line 297 — INI YANG HARUS DIGANTI
const ASSUMED_INCOME = 5_000_000;
```
Ganti dengan query ke tabel `user_preferences.monthly_income`.

---
*Document version: 1.0 | Status: Ready for Sprint Planning*
*Owner: PM | Reviewer: Tech Lead, DS Lead, AIE Lead*

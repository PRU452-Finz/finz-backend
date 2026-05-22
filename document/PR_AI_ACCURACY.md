# PR: Peningkatan Akurasi AI Prediksi & Rekomendasi

## Latar Belakang

Saat ini, hasil prediksi dan rekomendasi AI pada FinZ masih memiliki beberapa kelemahan:

| Masalah | Dampak | Contoh |
|---------|--------|--------|
| Model klasifikasi tidak mengenali makanan lokal | User harus pilih kategori manual | "beli cimol buat makan" → **Lainnya** (seharusnya Makanan) |
| Prediksi saldo akhir bulan di luar rentang wajar | User bingung, angka tidak masuk akal | Saldo 6.5M, prediksi 17.6M |
| Financial Score & Rekomendasi bukan dari AI | Tidak adaptif per user | Semua user dapat rekomendasi template yang sama |
| Budget Alert hanya muncul jika user set budget | User baru tidak mendapat peringatan | Tanpa budget → tidak ada alert |

---

## Rencana Perbaikan

### 1. Perbaikan Model Klasifikasi Kategori (Tim AI)

**Problem**: Training data tidak cukup beragam untuk slang/makanan lokal Indonesia.

**Action Items**:
- [ ] Kumpulkan 500+ sampel deskripsi transaksi dari user nyata (dengan consent)
- [ ] Tambahkan data augmentasi untuk:
  - Makanan lokal: cimol, cireng, seblak, batagor, siomay, martabak, sate, rendang, dll
  - Slang Gen-Z: "ngopi", "ngebakso", "jajan", "nyemil"
  - Brand lokal: Janji Jiwa, Kopi Kenangan, Mixue, Chatime
- [ ] Re-train model TF-IDF + MLP dengan data baru
- [ ] Evaluasi: target F1-Score ≥ 0.90 (saat ini belum terukur)
- [ ] Tambahkan endpoint `/predict/kategori/feedback` agar user bisa koreksi prediksi yang salah → data training bertambah otomatis

**File terdampak**: `AI-master/app.py`, `AI-master/model_klasifikasi.h5`, `AI-master/tfidf_vectorizer.pkl`

---

### 2. Perbaikan Model Prediksi Saldo (Tim AI + Backend)

**Problem**: Model regresi (DNN) sering menghasilkan nilai di luar batas wajar karena:
- Training data tidak mencerminkan variasi income yang luas
- Tidak ada constraint output (bisa negatif di luar saldo, atau melebihi income total)

**Action Items**:
- [ ] **Tim AI**: Re-train model dengan data yang lebih bervariasi (income 1M–50M)
- [ ] **Tim AI**: Tambahkan post-processing di Flask: `max(0, min(saldo_awal + total_income, prediksi))`
- [ ] **Tim AI**: Evaluasi MAPE (Mean Absolute Percentage Error), target ≤ 15%
- [ ] **Backend** ✅: Sudah ditambahkan sanity check — jika AI prediction di luar range `[-saldo, saldo+income]`, fallback ke simple math

**File terdampak**: `AI-master/app.py`, `AI-master/model_prediksi_saldo.keras`, `finz-backend/src/services/aiService.js`

---

### 3. Rekomendasi Finansial Berbasis AI (Tim AI + Backend)

**Problem**: Saat ini rekomendasi adalah template statis berdasarkan threshold sederhana (makanan > 30% → "Kurangi makan"). Tidak personalized.

**Action Items**:
- [ ] Buat endpoint baru di Flask: `POST /recommend`
  ```json
  // Input
  {
    "user_id": "1",
    "total_income": 7500000,
    "total_pengeluaran": 4247000,
    "pengeluaran_per_kategori": { "Makan & Minum": 1320000, ... },
    "saldo_saat_ini": 3253000,
    "financial_goal": "hemat",
    "risk_profile": "moderat"
  }
  
  // Output
  {
    "recommendations": [
      {
        "title": "Kurangi Frekuensi Makan di Luar",
        "description": "Kamu makan di luar 16x bulan ini (avg Rp 82.500/kali). Coba masak 3x/minggu bisa hemat Rp 400.000/bulan.",
        "priority": "high",
        "potential_saving": 400000,
        "category": "makanan"
      }
    ]
  }
  ```
- [ ] Gunakan rule engine yang lebih sophisticated (bukan hanya threshold %)
- [ ] Pertimbangkan menggunakan LLM (via API) untuk generate saran yang natural dan personalized
- [ ] Backend: ganti `aiService.getRecommendations()` dari template ke panggilan AI API

**File terdampak**: `AI-master/app.py` (endpoint baru), `finz-backend/src/services/aiService.js`, `finz-backend/src/services/aiClient.js`

---

### 4. Financial Health Score Berbasis AI (Tim AI)

**Problem**: Score dihitung di backend dengan rumus weighted sederhana. Tidak memperhitungkan tren, pola waktu, atau perbandingan antar bulan.

**Action Items**:
- [ ] Buat endpoint: `POST /financial-score`
- [ ] Input: riwayat transaksi 3 bulan terakhir + budget + profile user
- [ ] Output: score 0-100 dengan breakdown per dimensi
- [ ] Dimensi yang dievaluasi:
  - **Saving Ratio**: income vs expense (sudah ada)
  - **Spending Trend**: apakah pengeluaran naik/turun dari bulan lalu? (baru)
  - **Budget Compliance**: berapa % budget yang ditaati? (baru)
  - **Emergency Fund**: apakah ada tabungan ≥ 3 bulan expense? (baru)
  - **Spending Pattern**: variasi harian + weekend vs weekday (sudah ada)
- [ ] Backend: ganti `aiService.getFinancialScore()` dari rumus lokal ke panggilan AI API

**File terdampak**: `AI-master/app.py`, `finz-backend/src/services/aiService.js`

---

### 5. Auto-Budget Suggestion (Tim AI)

**Problem**: User baru tidak tahu berapa budget wajar per kategori. Saat ini harus input manual.

**Action Items**:
- [ ] Buat endpoint: `POST /suggest-budget`
- [ ] Input: monthly_income, occupation, financial_goal
- [ ] Output: suggested budget per kategori berdasarkan profil
  ```json
  {
    "suggested_budgets": {
      "makanan": 1500000,
      "transport": 500000,
      "hiburan": 300000,
      "belanja": 700000,
      "tagihan": 800000
    },
    "method": "50/30/20 rule adapted"
  }
  ```
- [ ] Frontend: tampilkan suggestion saat user pertama kali buka halaman Budget
- [ ] Bisa menggunakan rule-based (50/30/20 rule) atau ML clustering dari data user lain

**File terdampak**: `AI-master/app.py`, `finz-backend/src/controllers/aiController.js`, `FinZ/src/pages/Budget.jsx`

---

## Prioritas Implementasi

| # | Item | Effort | Impact | Sprint |
|---|------|--------|--------|--------|
| 1 | Re-train klasifikasi + feedback loop | Medium | High | Week 1 |
| 2 | Fix prediksi saldo (constraint output) | Low | High | Week 1 |
| 3 | Auto-Budget Suggestion (rule-based) | Low | Medium | Week 1 |
| 4 | Rekomendasi via AI endpoint | High | High | Week 2 |
| 5 | Financial Score via AI endpoint | Medium | Medium | Week 2 |

---

## Metrik Keberhasilan

| Metrik | Saat Ini | Target |
|--------|----------|--------|
| Akurasi klasifikasi kategori | ~70% (estimasi) | ≥ 90% |
| MAPE prediksi saldo | Tidak terukur | ≤ 15% |
| User override rate (koreksi kategori) | Tidak dilacak | ≤ 10% |
| Rekomendasi relevan (user feedback) | Template statis | Personalized per user |
| Budget compliance awareness | Hanya jika set manual | Auto-suggest untuk user baru |

## Struktur Folder

Pastikan struktur folder di server Backend (FinZ) untuk modul AI terstruktur seperti berikut:

```bash
.
├── src/
│   ├── controllers/
│   │   └── aiController.js       <-- Handler Request/Response API AI
│   ├── routes/
│   │   └── aiRoutes.js           <-- Routing Endpoint AI (e.g. /api/predict/...)
│   ├── services/
│   │   └── aiService.js          <-- Core Logic ML/AI (Panggil ini untuk proses)
│   └── server.js                 <-- Entry point server
├── package.json                  <-- Library yang dibutuhkan (termasuk modul AI ke depannya)
└── PIPELINE_INTEGRASI.md         <-- Dokumentasi ini
```
---

## Instalasi
### Install Library Node.js: Jalankan perintah ini di terminal/environment backend:
```bash
npm install
```
---

## Cara Gunain (Di sisi Backend)
### 1. Import & Inisialisasi Service AI
```javascript
// Di dalam controller (misal: aiController.js)
const aiService = require('../services/aiService');
```

### 2. Inference / Proses Prediksi
#### Panggil fungsi `.predictBalance()` atau `.predictCategory()` dengan data dari user/frontend.
```javascript
// Data input dari request Frontend (req.body)
const data_input = {
    current_balance: 3500000,  // integer/float
    user_id: 1                 // integer
};

// Dapatkan hasil analisis dari engine AI
const result = await aiService.predictBalance(data_input);

console.log(result);
```

---

## Pipeline Integrasi (Frontend ↔ Backend ↔ ML/AI)
### 1. Tugas Frontend (Request)
#### Frontend WAJIB mengirim data ke Backend dengan format JSON berikut. 
#### Pastikan tipe data sesuai (contoh untuk Prediksi Kategori).
##### . Endpoint: POST `/api/predict/category`
##### . Payload (Body):
```json
{
  "description": "Beli kopi starbucks dan roti"  // String (Deskripsi Transaksi)
}
```

##### . Endpoint: POST `/api/predict/balance`
##### . Payload (Body):
```json
{
  "current_balance": 3500000,  // Integer/Float (Saldo saat ini)
  "user_id": 1                 // Integer (ID Pengguna)
}
```

---
### 2. Tugas Backend (Logic & ML/AI)
#### 1. Terima JSON dari Frontend melalui `aiRoutes.js` -> `aiController.js`.
#### 2. Panggil fungsi di `aiService.js` (contoh: `predictCategory(description)` atau `predictBalance(data)`).
#### 3. (Fase Lanjut): `aiService.js` akan memproses data menggunakan model Machine Learning/NLP atau rule-based engine.
#### 4. Susun hasil analisis (prediksi kategori, confidence level, prediksi sisa saldo) ke dalam format JSON yang terstruktur.
#### 5. Kembalikan response JSON tersebut ke Frontend.

---
### 3. Tugas Frontend (Response Handling)
#### Backend akan membalas dengan format ini. Frontend harus menggunakannya untuk update UI (seperti Chart, Kategori Otomatis, dan Alert).

**Contoh Response Kategori (`/api/predict/category`):**
```json
{
  "success": true,
  "data": {
    "category": "makanan",      // Gunakan untuk auto-select dropdown kategori
    "confidence": "high",       // Indikator keyakinan AI
    "matched_keywords": ["kopi", "roti"] 
  }
}
```

**Contoh Response Prediksi Saldo (`/api/predict/balance`):**
```json
{
  "success": true,
  "data": {
    "current_balance": 3500000,
    "spent_so_far": 1500000,
    "avg_per_day": 75000,
    "days_remaining": 15,
    "predicted_balance": 2375000, // Tampilkan di Chart Proyeksi Saldo
    "status": "aman",             // Gunakan untuk warna Badge/Alert UI
    "message": "Pengeluaranmu terkontrol dengan baik. Pertahankan pola ini!" // Tampilkan di UI Alert
  }
}
```

---

## Visualisasi (Panduan Frontend)
#### Biar tampilan enak dipandang dan mudah dimengerti user, sesuaikan warna UI berdasarkan status dari Backend.

| Status Backend | Warna UI (Tailwind) | Ikon | Arti bagi User |
|----------------|----------------------|------|----------------|
| `aman`         | `bg-green-500`       | ✅   | "Pengeluaran Terkontrol, Saldo Aman" |
| `warning`      | `bg-yellow-400`      | ⚠️   | "Pengeluaran Cukup Tinggi, Kurangi Belanja" |
| `bahaya`       | `bg-red-600`         | 🚨   | "BAHAYA, Saldo Berisiko Habis Bulan Ini" |

#### Logika Tampilan:
##### 1. Jika status == `bahaya`: Tampilkan `message` secara mencolok (misal: Banner merah di atas Dashboard).
##### 2. Jika status == `warning`: Berikan tooltip peringatan pada komponen sisa saldo.
##### 3. Selalu tampilkan `predicted_balance` di samping `current_balance` dalam bentuk Bar Chart atau tren garis di Dashboard.

# Fin-Z — Project Context

## 1. Project Overview
Fin-Z adalah aplikasi manajemen keuangan pribadi yang didukung oleh AI, dirancang khusus untuk Gen-Z. Aplikasi ini membantu pengguna mencatat transaksi, mengklasifikasikan kategori secara otomatis, memprediksi saldo akhir bulan, dan memberikan rekomendasi serta alert kesehatan finansial.

## 2. Architecture Summary
Proyek ini terdiri dari 3 layer utama:
1. **AI Layer** (`AI-master`): Flask API yang menangani klasifikasi teks (NLP) dan prediksi saldo (regresi).
2. **Backend Layer** (`finz-backend`): Express.js API yang menangani logika bisnis, CRUD transaksi, dan bertindak sebagai proxy ke AI layer.
3. **Frontend Layer** (`FinZ`): React (Vite) aplikasi yang menyediakan antarmuka pengguna.

## 4. Module Map

### 3.1 AI Modules
- `app.py`: Entry point Flask API dengan endpoint prediksi dan alerts.
- `budget_alert.py`: Sistem generate alert berdasarkan aturan finansial.
- `rule_engine.py`: Mesin evaluasi aturan (Rule Matrix) untuk menghitung skor kesehatan.

### 3.2 Backend Modules
- `src/app.js`: Konfigurasi Express dan routing.
- `src/routes/aiRoutes.js`: Route untuk fitur AI dan Alerts.
- `src/services/aiService.js`: Logika integrasi ke Flask API dengan fallback mock.
- `src/models/Transaction.js`: Model data transaksi.

### 3.3 Frontend Modules
- `src/App.jsx`: Routing halaman.
- `src/context/FinanceContext.jsx`: State management global.
- `src/services/api.js`: Wrapper Axios untuk memanggil backend.

## 5. API Endpoint Registry

### AI Layer (Flask)
- `POST /predict/kategori`: Klasifikasi deskripsi transaksi.
- `POST /predict/saldo`: Prediksi saldo akhir bulan.
- `POST /predict/batch`: Gabungan klasifikasi dan prediksi.
- `POST /alerts/generate`: Generate alerts.

### Backend Layer (Express)
- `GET /api/transactions`: Ambil semua transaksi.
- `POST /api/transactions`: Tambah transaksi.
- `POST /api/predict/balance`: Prediksi saldo (panggil AI).
- `POST /api/predict/category`: Klasifikasi kategori (panggil AI).

## 6. Database Schema Summary
- **Tabel `transactions`**:
  - `amount`: Decimal (Nominal transaksi).
  - `category`: ENUM (Kategori).
  - `transaction_type`: ENUM ('expense', 'income').
  - `user_id`: Integer (Default 1).

## 7. Business Process Flows
1. **Pencatatan Transaksi**: Pengguna memasukkan nominal dan deskripsi -> AI menyarankan kategori -> Pengguna menyimpan -> Data tersimpan di DB -> Dashboard di-refresh.
2. **Prediksi Saldo**: Setiap halaman dashboard dibuka, backend memanggil AI untuk memprediksi saldo akhir bulan berdasarkan histori transaksi.

## 8. Synchronization Status

| Feature / Endpoint | AI | Backend | Frontend | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Klasifikasi Kategori | ✅ | ✅ | ✅ | ✅ Synced | Bekerja dengan baik. |
| Prediksi Saldo | ✅ | ✅ | ✅ | ✅ Synced | Bekerja dengan baik. |
| Budget Alerts | ✅ | ✅ | ❌ | ⚠️ Partial | Backend siap, tapi Frontend belum memanggil. |
| Multi-User (Auth) | 🔲 | ✅ | ✅ | ✅ Synced | JWT Auth + bcrypt + Data Isolation per user. |
| Income Transaction | 🔲 | ✅ | ✅ | ✅ Synced | transaction_type tersimpan dan ditampilkan dengan benar. |

## 9. Gap Analysis & Missing Features
1. **Budget Alerts tidak tampil di Frontend**: Backend sudah menyediakan endpoint `/api/budget-alert`, namun belum ada UI di frontend untuk menampilkan notifikasi/alert ini.
2. **Persistensi Alert**: AI layer menyimpan alert di memori (`_alert_store`). Jika server AI restart, data alert hilang. Seharusnya disimpan di DB.
3. **Edit Transaction UI**: Backend `PUT /api/transactions/:id` sudah ada, tapi frontend hanya bisa hapus, belum bisa edit.

## 10. Recommended Next Steps
1. Integrasikan API Budget Alert ke Frontend agar pengguna bisa melihat peringatan kesehatan finansial.
2. Tambahkan fitur Edit Transaction di halaman transaksi.
3. Pindahkan penyimpanan alert dari memori AI ke database MySQL di backend.
4. Tambahkan filter by transaction_type (income/expense) di halaman Transaksi.

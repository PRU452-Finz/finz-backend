# Panduan Deployment Produksi — FinZ

Dokumen ini berisi panduan langkah-demi-langkah untuk mendeploy seluruh ekosistem aplikasi **FinZ** ke layanan hosting produksi menggunakan skema arsitektur gratisan/freemium terbaik.

---

## 🏗️ Ringkasan Arsitektur Deployment

| Komponen | Teknologi | Provider Hosting | Keterangan |
|---|---|---|---|
| **Frontend (FE)** | React, Vite, CSS | **Vercel** | Hosting statis, otomatis terhubung ke repositori GitHub |
| **Backend (BE)** | Node.js, Express, Sequelize | **Vercel (Serverless)** | Dijalankan sebagai Serverless Functions via `vercel.json` |
| **Database** | PostgreSQL | **Supabase** | Serverless SQL Database, host cluster region Seoul (`aws-1`) |
| **Cache & Rate Limit** | Redis | **Upstash Redis** | Serverless Redis, aman menggunakan SSL/TLS (`rediss://`) |
| **AI Inference** | Python, Flask, Keras/TF | **Railway / Koyeb** | Containerized service (karena butuh RAM & startup konstan) |

---

## 1. Konfigurasi Database (Supabase)

Supabase digunakan sebagai database utama PostgreSQL. Karena berada pada free-tier region Seoul, pastikan menggunakan host pooler IPv4.

### A. Mendapatkan Connection String
1. Buka dashboard Supabase, masuk ke **Project Settings > Database**.
2. Gulir ke bawah ke bagian **Connection String** dan pilih tab **Connection Pooler**.
3. Salin URI yang diberikan. Gunakan port **6543** (Mode Transaction).
   * Format: `postgresql://postgres.jrvwheeqitvkyfupszxc:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres`
   * *Catatan:* Ganti `[PASSWORD]` dengan password database Anda.

### B. Migrasi dan Seeding Awal dari Komputer Lokal
Jalankan perintah berikut di folder `finz-backend` komputer lokal Anda untuk mentransfer skema database dan mengisi data demo awal:

```bash
# 1. Jalankan Migrasi Skema Tabel
DATABASE_URL="postgresql://postgres.jrvwheeqitvkyfupszxc:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres" npx sequelize-cli db:migrate

# 2. Jalankan Seeding Data Demo
DATABASE_URL="postgresql://postgres.jrvwheeqitvkyfupszxc:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres" npm run seed
```

---

## 2. Konfigurasi Cache (Upstash Redis)

Upstash Redis digunakan untuk rate-limiting keamanan dan caching data dashboard backend.

1. Buka dashboard Upstash, pilih database Redis Anda.
2. Salin baris koneksi endpoint pada tab **Details** bagian **Connect**.
3. Format URL Redis:
   * `redis://default:[TOKEN]@moved-quagga-85030.upstash.io:6379`
   * *Catatan:* Backend FinZ telah disesuaikan untuk otomatis mengonversi koneksi `redis://` menjadi `rediss://` (Secure TLS) demi kelancaran integrasi SSL dengan Upstash.

---

## 3. Deployment AI Service (Railway / Koyeb)

Layanan AI Flask tidak disarankan dideploy di Vercel karena batasan memori dan durasi startup TensorFlow model. Gunakan Railway atau Koyeb.

### Langkah Deployment (Railway):
1. Hubungkan repositori `AI-master` ke Railway.
2. Railway akan mendeteksi `requirements.txt` dan `app.py` secara otomatis.
3. Tambahkan environment variable berikut di Railway:
   * `PORT` = `5000` (atau biarkan default Railway)
4. Salin URL publik yang di-generate oleh Railway (misal: `https://finz-ai.up.railway.app`).

---

## 4. Deployment Backend Node.js (Vercel Serverless)

Backend Node.js dideploy ke Vercel menggunakan konfigurasi serverless routing (`vercel.json`).

### A. Environment Variables di Vercel Backend
Buat project baru di Vercel, arahkan ke folder/repo `finz-backend`. Daftarkan variabel berikut:

| Key | Value / Contoh | Keterangan |
|---|---|---|
| `NODE_ENV` | `production` | Menjalankan Express dalam mode produksi |
| `DATABASE_URL` | `postgresql://postgres.jrvwheeqitvkyfupszxc:...:6543/postgres` | URI Supabase Connection Pooler |
| `REDIS_URL` | `redis://default:...@moved-quagga-85030.upstash.io:6379` | Endpoint Upstash Redis |
| `CLIENT_URL` | `https://finz-frontend-azure.vercel.app` | URL domain Vercel Frontend Anda |
| `AI_API_URL` | `https://finz-ai.up.railway.app` | URL publik Flask AI Anda |
| `GEMINI_API_KEY` | `AIzaSyCtxG7...` | API Key Google Gemini Anda |
| `JWT_SECRET` | `string-acak-panjang-dan-aman-2026` | Kunci enkripsi token login |
| `JWT_EXPIRES_IN` | `7d` | Masa berlaku token login |

### B. Build & Deploy
Vercel akan otomatis mendeteksi file `vercel.json` dan memetakan semua request API ke `src/app.js`.

---

## 5. Deployment Frontend React/Vite (Vercel)

Frontend dideploy sebagai Single Page Application (SPA).

### A. Environment Variables di Vercel Frontend
Arahkan repositori `FinZ` (Frontend) ke project Vercel Anda yang lama/baru. Daftarkan variabel ini:

| Key | Value | Keterangan |
|---|---|---|
| `VITE_API_URL` | `https://finz-backend.vercel.app/api` | Mengarah ke URL Vercel Backend Anda **wajib menggunakan akhiran `/api`** |

### B. Konfigurasi Client (SPARouting)
Jika Anda mengalami masalah routing (404 saat merefresh halaman di Vercel), buat file `vercel.json` di root direktori **Frontend** (`FinZ`) dengan isi berikut:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🔍 Cara Verifikasi Deployment
Setelah semua komponen ter-deploy, pastikan alur integrasi berjalan lancar:
1. Buka URL Frontend Anda, coba lakukan **Register** dan **Login**.
2. Jika sukses login, berarti koneksi **Backend ➔ Supabase** dan **Backend ➔ Upstash Redis** berjalan lancar.
3. Masuk ke halaman Dashboard, cek widget **Rekomendasi AI** dan **Prediksi Saldo Akhir Bulan**. Jika data tampil tanpa error, koneksi **Backend ➔ Gemini API** dan **Backend ➔ Flask AI** sukses terhubung.

# FinZ — Planning Update Terkait Evaluasi Saran Pengembangan

Berdasarkan dokumen *Penjelasan Fitur FinZ*, berikut adalah rincian rencana untuk mengimplementasikan *Saran Pengembangan* yang telah dirumuskan:

---

## 1. Implementasi Peningkatan Kapasitas Rate Limit API (High Priority)
**Latar Belakang:** Banyaknya komponen *chart* di halaman Dashboard yang memicu API *call* ke Backend menyebabkan limit `200` saat ini terlalu cepat terlampaui sehingga pengguna terblokir.

**Langkah Eksekusi:**
- **Backend (`finz-backend`)**: Buka file `src/app.js` dan ubah konstanta konfigurasi `apiLimiter`.
- **Target Value**: Ubah `max: 200` menjadi `max: 1000`.
- **Durasi**: Tetap `15 * 60 * 1000` (15 menit).
- **Rencana Skalabilitas (Redis)**: Implementasikan `rate-limit-redis` sebagai *store background*. Menggunakan Redis akan menjaga performa backend tetap ringan karena data limit tidak disimpan di memori Node.js (RAM) aplikasi, serta memungkinkan limit yang konsisten jika nantinya aplikasi dijalankan dengan banyak *instance* (Cluster Mode).
- **Status Tambahan**: Pertimbangkan untuk mengecualikan ( *whitelist* ) *endpoint* `/api/dashboard` dari rate-limit ketat ini di pembaruan selanjutnya jika limit `1000` dirasa masih kurang.

---

## 2. Fitur Graceful Fallback Jika Server AI Down (High Priority)
**Latar Belakang:** Sebelumnya, saat server AI Flask mati (Error 503), seluruh data Budget/Alert *crash*, dan klasifikasi deskripsi akan ter-*default* ke kategori "lainnya".

**Langkah Eksekusi:**
- *Bug UI telah kita selesaikan hari ini* dengan mencegah response 503 merusak proses rendering React (`aiController.js`).
- **Target Lanjutan (Backend)**: Di dalam `src/services/aiService.js` (fungsi prediksi kategori), tambahkan *Regex matching* sebagai *fallback*.  
  Contoh *regex matcher*:
  - Jika `deskripsi` mengandung kata "kopi", "makan", "warteg", kembalikan kategori `makanan`.
  - Jika `deskripsi` mengandung "grab", "gojek", "bensin", kembalikan `transport`.
- Hal ini menjamin pengalaman fitur pencatatan otomatis (*autocomplete*) di Frontend tidak berhenti secara total.

---

## 3. Pre-Processing & Normalisasi Deskripsi Text (Medium Priority)
**Latar Belakang:** Model klasifikasi teks di mesin AI sensitif terhadap *typo*, angka panjang, dan simbol yang tidak memiliki makna secara gramatikal.

**Langkah Eksekusi:**
- **Backend (`finz-backend`)**: Sebelum memanggil `aiClient.predictKategori(deskripsi)`, buat *helper function* `sanitizeText()`.
- **Proses Sanitasi**:
  1. Ubah teks menjadi huruf kecil (*lowercase*).
  2. Hapus seluruh angka (*meniadakan nilai nominal dari deskripsi*).
  3. Hapus karakter spesial (hanya tinggalkan huruf a-z dan spasi).
- **Pengiriman**: Kirimkan versi teks yang sudah bersih ke Flask API.

---

## 4. Analisis Skala Lanjutan: Transaksi Recurring / Rutin (Low Priority)
**Latar Belakang:** Machine Learning pendeteksi anomali pada AI Server menganggap semua transaksi yang nominalnya melonjak drastis sebagai "Impulsif/Bahaya". Kenyataannya bayar kos/kontrakan bulanan bersifat wajib dan normal.

**Langkah Eksekusi:**
- *Frontend*: Pada halaman "Tambah Transaksi", tambahkan elemen *Checkbox/Toggle* "Tandai sebagai pengeluaran rutin tiap bulan".
- *Database*: Tabel `transactions` sudah memiliki field `is_recurring: BOOLEAN`. (Tugas kita hanya memastikan datanya tersimpan dari Frontend).
- *AI Engine*: Update formulasi rasio "*Spending Consistency*" agar tidak ikut menghitung transaksi berbintang `is_recurring = true`.
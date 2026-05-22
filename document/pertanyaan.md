# Pertanyaan untuk Mentoring Advisor Backend - Project FinZ (Versi Pemula)

Berikut adalah 6 pertanyaan (3 tentang AI & Database, 3 tentang Arsitektur & Keamanan) yang mudah dipahami dan menyertakan referensi kode, cocok untuk ditanyakan sebagai pemula di backend.

---

### 1. Masalah Beban Server AI dan Aplikasi Lemot
**Pertanyaan:**
> "Di file `src/services/aiClient.js` baris 96, kita manggil API AI pake kode: `await client.post('/predict/kategori', { deskripsi });`.
> Fungsi ini dipanggil setiap ada transaksi baru untuk nebak kategorinya. Kalau nanti user kita banyak dan mereka bikin transaksi barengan, ini bakal bikin server AI-nya keberatan atau bikin aplikasi kita jadi lemot gak ya? Bagaimana cara mengatasinya?"

**Alasan Bertanya:**
*   **Beban Server:** Meskipun API AI-nya dibuat oleh tim AI sendiri, server yang menjalankan AI tersebut tetap butuh tenaga (CPU/RAM) yang besar.
*   **Solusi Sederhana:** Advisor mungkin akan menyarankan untuk menyimpan (cache) hasil tebakan AI, atau menjalankan prosesnya di latar belakang.

---

### 2. Penanganan Error Saat Server AI Mati
**Pertanyaan:**
> "Di file `src/services/aiClient.js` baris 208 ada fungsi `isAvailable` untuk cek apakah server AI hidup.
> Kalau pas user lagi input transaksi ternyata server AI-nya mati atau error, sebaiknya di backend kita nampilin pesan error ke user (transaksi gagal), atau kita biarkan transaksi berhasil tapi kategorinya pakai data default (misal: 'lainnya')?"

**Alasan Bertanya:**
*   **Pengalaman Pengguna (UX):** Penting untuk tahu cara menangani error agar aplikasi tidak terlihat rusak di mata pengguna.
*   **Fallback Strategy:** Ini disebut rencana cadangan jika sistem pendukung (AI) sedang bermasalah.

---

### 3. Kecepatan Dashboard Saat Data Banyak
**Pertanyaan:**
> "Di file `src/controllers/dashboardController.js` baris 13, kita ngambil data dashboard pake kode: `const summary = await dashboardService.getDashboardSummary(user_id);`.
> Untuk menghitung total pengeluaran bulanan, apakah lebih baik dihitung langsung dari database setiap kali user buka dashboard, atau kita buat tabel khusus untuk menyimpan totalnya? Takutnya kalau transaksi user sudah ribuan, dashboard-nya jadi lemot."

**Alasan Bertanya:**
*   **Efisiensi Database:** Menghitung ribuan data secara langsung (on-the-fly) akan membebani database.
*   **Best Practice:** Ini pertanyaan bagus untuk belajar cara mengoptimalkan database agar aplikasi tetap cepat.

---

### 4. Struktur Folder dan Arsitektur (Controller vs Service)
**Pertanyaan:**
> "Saat ini struktur kode kita memisahkan antara **Controller** (pengatur data masuk-keluar) dan **Service** (tempat logika bisnis), contohnya di `dashboardController.js` baris 13 yang memanggil `dashboardService`. Apakah pemisahan arsitektur seperti ini sudah ideal untuk project capstone ini, atau ada saran pola arsitektur lain?"

**Alasan Bertanya:**
*   **Kerapihan Kode:** Memastikan struktur kode kita rapi, mudah dibaca, dan sesuai dengan standar industri.
*   **Skalabilitas:** Arsitektur yang baik membuat aplikasi mudah ditambah fitur baru tanpa merusak kode lama.

---

### 5. Keamanan Login (Penyimpanan Token JWT)
**Pertanyaan:**
> "Untuk sistem login, kita pakai JWT dan mengambil ID user lewat `req.user.id` (seperti di `dashboardController.js` baris 12). Menurut Advisor, untuk aplikasi keuangan seperti FinZ, apakah lebih baik menyimpan token login di *LocalStorage* (frontend) atau pakai *HttpOnly Cookie* agar lebih aman dari pencurian data?"

**Alasan Bertanya:**
*   **Keamanan Data:** Aplikasi finansial sangat rawan. Cara menyimpan token sangat menentukan apakah akun user mudah di-hack atau tidak.
*   **Best Practice Security:** Mendapatkan saran langsung tentang standar keamanan untuk aplikasi web.

---

### 6. Optimasi Database (Penggunaan Indexing)
**Pertanyaan:**
> "Kita punya file model seperti `Budget.js` dan tabel Transaksi yang pasti sering dicari berdasarkan `user_id`. Apakah kita perlu menerapkan *Indexing* pada database untuk kolom `user_id` tersebut? Dan apa dampaknya jika kita tidak pakai indexing saat data user sudah sangat banyak?"

**Alasan Bertanya:**
*   **Kecepatan Database:** *Indexing* adalah kunci agar pencarian data di database tetap cepat.
*   **Pemahaman Dasar DB:** Membantu Anda memahami bagaimana database bekerja di balik layar saat menangani data besar.

# Dokumen Penjelasan Fitur FinZ

Dokumen ini merinci alur proses bisnis, pembagian tanggung jawab sistem antara Backend (Node.js) dan AI (Python Flask), serta fitur hybrid yang menggabungkan keduanya.

---

## 1. Proses Bisnis (Business Process Flow)

Secara garis besar, FinZ bekerja dalam siklus berikut:

1.  **Pencatatan Transaksi**: Pengguna menginput deskripsi transaksi (contoh: "Beli kopi di Starbuck").
2.  **Klasifikasi Pintar**: Sistem secara otomatis menentukan kategori (Makanan, Transport, dll) sebelum disimpan.
3.  **Analisis & Monitoring**: Saldo dan pengeluaran diagregasi untuk memberikan gambaran kesehatan keuangan saat ini.
4.  **Prediksi Masa Depan**: AI memproyeksikan sisa saldo hingga akhir bulan berdasarkan tren yang ada.
5.  **Pemberitahuan Proaktif (Alert)**: Jika ada potensi saldo habis atau budget terlampaui, sistem memberikan peringatan otomatis.

---

## 2. Pembagian Fitur (Backend vs AI)

Sistem FinZ dirancang dengan arsitektur **Decoupled**, di mana logika bisnis berat ada di Backend, dan logika cerdas ada di AI Server.

### A. Murni Backend (Node.js & MySQL)
Fitur yang sepenuhnya dikelola oleh Backend tanpa keterlibatan model AI:
*   **Autentikasi & Otorisasi**: Pendaftaran user, Login (JWT), dan keamanan akun.
*   **CRUD Transaksi**: Menambah, mengedit, menghapus, dan menampilkan daftar transaksi.
*   **Manajemen Budget**: Menyimpan batas pengeluaran (Limit) per kategori yang diatur user.
*   **Agregasi Data**: Menghitung total pemasukan/pengeluaran riil dan data chart (Bar, Line, Pie).
*   **Rate Limiting**: Melindungi server dari request berlebih (contoh: pesan "Rate limit tercapai").

### B. Murni AI (Python Flask & TensorFlow)
Fitur yang merupakan hasil pemrosesan model "Machine Learning" pada folder `AI-master`:
*   **Natural Language Classification**: Mengubah deskripsi teks menjadi kategori (Model: `model_klasifikasi.h5`).
*   **Regresi Prediksi Saldo**: Memprediksi angka saldo akhir bulan berdasarkan beban pengeluaran (Model: `model_prediksi_saldo.keras`).
*   **Rule Matrix Engine**: Mengevaluasi aturan kompleks (R01-R06) untuk mendeteksi anomali keuangan di sisi AI.

### C. Fitur Kombinasi (Hybrid)
Fitur yang melibatkan koordinasi antara kedua server:
*   **Financial Health Score**:
    *   *Backend*: Menghitung data mentah (Saving ratio, varians harian, diversitas kategori).
    *   *Hasil*: Menghasilkan angka 0-100 yang ditampilkan di dashboard.
*   **Budget & Balance Alert**:
    *   *Backend*: Mengirimkan data transaksi dan sisa limit ke server AI.
    *   *AI Server*: Memberikan label status `Aman`, `Warning`, atau `Bahaya`.
    *   *Backend*: Menyimpan hasil evaluasi tersebut untuk ditampilkan di notifikasi frontend.

---

## 3. Logika Detail Parameter "BAHAYA" & "HEALTH SCORE"

### Pemicu Status "Bahaya" (Red Status)
Status ini muncul jika salah satu dari kondisi ini terpenuhi:
1.  **Prediksi Saldo Tipis**: AI memprediksi sisa saldo di akhir bulan < 20% dari modal awal/total pemasukan.
2.  **Over-Budget**: Pengeluaran pada satu kategori sudah melewati 100% dari limit yang diatur user.
3.  **Anomali Hari Ini**: Pengeluaran hari ini jauh di atas rata-rata harian (Standard Deviation > threshold).

### Pengukuran Financial Health Score
Skor dihitung menggunakan pembobotan (*Weighted Score*):
*   **35% Saving Ratio**: Makin besar uang yang tersisa/ditabung, makin tinggi skornya.
*   **30% Konsistensi**: Jika pengeluaran stabil setiap hari (tidak impulsif), skor makin tinggi.
*   **20% Diversitas**: User yang mengalokasikan uang ke banyak kategori (sehat) lebih baik daripada hanya di 1 kategori (misal: hiburan saja).
*   **15% Pembayaran Tagihan**: Terdeteksi adanya alokasi untuk kewajiban (listrik, air, cicilan).

---

## 4. Saran Pengembangan (Recommendations)

Berdasarkan struktur kode saat ini, berikut adalah saran untuk meningkatkan kualitas aplikasi:

1.  **Optimasi Rate Limit**: 
    Angka limit 200 request/15 menit di backend mungkin terlalu rendah saat user aktif menggunakan Dashboard yang memiliki banyak chart. Disarankan menaikkan ke **500-1000** atau menggunakan cache (seperti Redis) agar tidak sering hit database untuk data yang sama.
    
2.  **Normalisasi Deskripsi**:
    Tambahkan proses *cleaning* teks di backend sebelum dikirim ke AI (menghapus angka/karakter spesial) agar akurasi klasifikasi AI meningkat.

3.  **Fitur Recurring (Rutin)**:
    Backend perlu menambahkan field `is_recurring` pada transaksi agar AI tidak menganggap pembayaran sewa rumah yang besar sebagai "impulsif", melainkan sebagai pengeluaran rutin yang wajar.

4.  **Graceful Fallback**:
    Saat AI Server mati (Error 503), Backend sebaiknya tidak hanya mengirim data kosong, tapi menggunakan *Regex matching* sederhana sebagai "AI cadangan" sementara agar user tidak melihat kategori "Lainnya" terus-menerus.

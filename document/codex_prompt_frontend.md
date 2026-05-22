# 🤖 Prompt Codex CLI — Frontend Sync dengan Backend Baru

> **Context**: Backend FinZ sudah dirombak total: MySQL → PostgreSQL, Integer ID → UUID, 
> tambah Redis caching, pagination server-side, dll. Frontend perlu disesuaikan agar kompatibel.
> 
> Jalankan dari root directory: `/home/masbay/PROJECT/FinZ`

---

## ⚡ PROMPT: Sync Frontend dengan Backend Baru

```
Konteks: Backend FinZ sudah di-overhaul besar-besaran. Perubahan backend yang mempengaruhi frontend:

1. Semua ID (user, transaction, budget) sekarang UUID string, bukan integer lagi
2. Backend mengembalikan pagination server-side di GET /api/transactions:
   Response sekarang: { success: true, data: [...], pagination: { page, limit, total, totalPages } }
   Bukan lagi array transaksi langsung
3. Backend menambahkan field `initial_balance` pada user profile
4. Semua console.log backend diganti Winston, tapi ini tidak mempengaruhi frontend

Kerjakan penyesuaian frontend berikut:

### 1. Update FinanceContext.jsx — Handle Server-Side Pagination Response

Di `src/context/FinanceContext.jsx`:

- Di fungsi `fetchAll()` (sekitar line 148), saat memproses response dari `transactionAPI.getAll()`:
  - Response lama: `txnResp.data` adalah array transaksi
  - Response BARU: `txnResp.data` adalah array transaksi, TAPI juga ada `txnResp.pagination`
  - Ubah agar tetap kompatibel: ambil transactions dari `txnResp.data` (sudah benar)
  - PENTING: Backend sekarang return data paginated (default 20 per halaman)
  - Agar SEMUA transaksi ter-fetch untuk client-side filtering, ubah panggilan menjadi:
    `transactionAPI.getAll({ limit: 1000 })` — ini memastikan semua data ter-load
  - Atau bisa juga pass parameter pagination: `transactionAPI.getAll({ page: 1, limit: 9999 })`

- Hasil dari `txnResp.data` sudah berupa array, jadi dispatch SET_TRANSACTIONS tetap sama

### 2. Update Transactions.jsx — Pastikan `nominal` field tersedia

Di `src/pages/Transactions.jsx`:

- Line 57: `const totalFiltered = filteredTransactions.reduce((sum, t) => sum + t.nominal, 0);`
  - Backend sekarang mengembalikan field `amount` DAN `nominal` (keduanya sama nilainya)
  - Tapi untuk safety, ubah menjadi: `sum + (t.nominal || t.amount || 0)` agar tidak NaN

- Line 243: `{formatCurrency(transaction.nominal)}`
  - Ubah menjadi: `{formatCurrency(transaction.nominal || transaction.amount)}`

### 3. Update Budget.jsx — Pastikan user_id kompatibel UUID

Di `src/pages/Budget.jsx`:
- Line 56: `user_id: userId` — ini sudah benar karena userId diambil dari `user?.id` yang sekarang UUID string
- TIDAK perlu diubah, sudah kompatibel

### 4. Update services/api.js — Pastikan semua ID handling benar

Di `src/services/api.js`:
- Semua endpoint sudah menerima ID sebagai parameter string, dan UUID juga string
- TIDAK perlu diubah

### 5. Update AuthContext.jsx — Handle initial_balance field baru

Di `src/context/AuthContext.jsx`:
- Backend sekarang mengembalikan field `initial_balance` di user object
- Tidak perlu diubah karena frontend sudah menyimpan seluruh user object dari response

### 6. Update Profile.jsx — Tambahkan initial_balance di form profil

Di `src/pages/Profile.jsx`:
- Cek apakah ada form edit profil. Jika ada, tambahkan field `initial_balance` agar user bisa set saldo awal mereka
- Label: "Saldo Awal (Rp)"
- Type: number, min: 0
- Ini penting karena backend pakai `initial_balance` dari User model, bukan hardcoded Rp 2.000.000

### 7. Verifikasi kompabilitas — Pastikan tidak ada parseInt pada ID

Cari di seluruh src/ apakah ada:
- `parseInt(` yang dipakai untuk parsing ID → hapus, ID sekarang UUID string
- `Number(` yang dipakai untuk ID → hapus
- `=== 1` atau `|| 1` untuk default user_id → hapus

### CATATAN PENTING:
- JANGAN ubah struktur CSS atau layout yang sudah ada
- JANGAN ubah logika filter dan pagination UI di Transactions.jsx (itu client-side pagination yang sudah bagus)
- JANGAN hapus atau ubah fallback logic di predictCategory
- Pastikan semua perubahan backward compatible — jika backend lama masih jalan, frontend tetap bisa handle
```

---

## 💡 Tips

- Prompt ini bisa langsung copy-paste ke Codex CLI
- Jalankan dari: `/home/masbay/PROJECT/FinZ`
- Setelah Codex selesai, test dengan: `npm run dev` dan buka browser
- Pastikan backend juga running di port 8000: `cd ../finz-backend && npm run dev`

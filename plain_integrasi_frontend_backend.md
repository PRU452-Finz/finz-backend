# Plain Integrasi Frontend ↔ Backend — FinZ

> Dokumen ini adalah panduan kerja bagi AI untuk menghubungkan frontend React FinZ
> (di `C:\laragon\www\FinZ`) dengan backend Express.js FinZ
> (di `C:\laragon\www\finz-backend`, berjalan di `http://localhost:8000`).
>
> Baca seluruh dokumen ini sebelum menyentuh kode apapun.

---

## KONTEKS: KONDISI SAAT INI

### Frontend (`C:\laragon\www\FinZ`)
- Dibangun dengan **React + Vite**, berjalan di `http://localhost:5173`
- State management: `useReducer` di dalam `FinanceContext.jsx`
- **Saat ini 100% offline** — semua data berasal dari `src/data/dummyData.js`
- File `src/services/api.js` sudah ada tapi **belum dipanggil di mana-mana** — hanya definisi fungsi
- File `src/hooks/useTransactions.js` dan `useDashboard.js` sudah ada tapi masih baca dari Context (dummy)

### Backend (`C:\laragon\www\finz-backend`)
- Berjalan di `http://localhost:8000`
- Semua endpoint sudah aktif dan terverifikasi

---

## PERBEDAAN DATA YANG HARUS DIKETAHUI

Ini adalah sumber masalah utama. Frontend dan backend menggunakan nama field yang **berbeda**.

| Field | Frontend (React) | Backend (API Response) | Tindakan |
|---|---|---|---|
| Jumlah uang | `nominal` | `amount` DAN `nominal` | Backend sudah kirim keduanya — aman |
| Score label | `category` ("Cukup Baik") | `level` ("Cukup Sehat") | Harus mapping di frontend |
| Prediksi saldo | `predicted_end_balance` | `predicted_balance` | Rename di frontend |
| Current balance | `current_balance` | `current_balance` | Sama ✅ |
| Prediksi message | `message` | `message` | Sama ✅ |
| Prediksi status | `status` | `status` | Sama ✅ |

---

## APA YANG HARUS DIBUAT / DIUBAH

---

### LANGKAH 1 — Cek file `src/utils/constants.js`

**Aksi:** Buka dan cek isinya. Harus ada:
```js
export const API_BASE_URL = 'http://localhost:8000/api';
```
Jika belum ada, tambahkan. File ini sudah diimpor oleh `src/services/api.js`.

---

### LANGKAH 2 — Ganti `FinanceContext.jsx` secara total

**File:** `src/context/FinanceContext.jsx`

**Masalah saat ini:** Context menggunakan `dummyTransactions`, `dummyPrediction`, dll dari file lokal. Semua operasi CRUD (add, update, delete) hanya mengubah state React lokal, tidak memanggil backend.

**Yang harus dilakukan:**
Ganti seluruh isi context menjadi versi yang:

1. **Pada mount**, fetch `GET /api/transactions` → simpan ke state `transactions`
2. **Pada mount**, fetch `GET /api/dashboard` → simpan ke state `summary` (jangan hitung ulang di frontend, pakai hasil backend)
3. **Pada mount**, fetch `GET /api/financial-score/1` → simpan ke state `financialScore`
4. **Pada mount**, fetch `GET /api/recommendation/1` → simpan ke state `recommendations`
5. **`addTransaction(data)`** → panggil `POST /api/transactions` → setelah sukses, tambahkan response ke state
6. **`deleteTransaction(id)`** → panggil `DELETE /api/transactions/:id` → setelah sukses, hapus dari state
7. **`updateTransaction(data)`** → panggil `PUT /api/transactions/:id` → setelah sukses, update di state
8. **`predictCategory(description)`** → panggil `POST /api/predict/category` → return `data.category`

**State yang dibutuhkan di Context:**
```js
const initialState = {
  transactions: [],        // dari GET /api/transactions
  summary: null,           // dari GET /api/dashboard
  financialScore: null,    // dari GET /api/financial-score/1
  recommendations: [],     // dari GET /api/recommendation/1
  prediction: null,        // dari POST /api/predict/balance (dipanggil terpisah)
  loading: true,
  error: null,
};
```

**Mapping response API yang perlu dilakukan di Context:**

Untuk `financialScore` — backend return `level`, frontend pakai `category`:
```js
// Saat simpan ke state, mapping dulu:
const financialScore = {
  score: responseData.score,
  category: responseData.level,   // ← rename "level" → "category"
  breakdown: responseData.breakdown,
};
```

Untuk `prediction` — backend return `predicted_balance`, frontend pakai `predicted_end_balance`:
```js
const prediction = {
  current_balance: responseData.current_balance,
  predicted_end_balance: responseData.predicted_balance,   // ← rename
  status: responseData.status,
  message: responseData.message,
};
```

**Untuk `summary`** — backend sudah menghitung semua, pakai langsung:
```js
// Backend return:
// { total_spending, transaction_count, avg_daily, category_breakdown, daily_breakdown, monthly_breakdown, period }

// Mapping ke format yang dipakai frontend (camelCase):
const summary = {
  totalSpending: data.total_spending,
  transactionCount: data.transaction_count,
  avgDaily: data.avg_daily,
  categoryBreakdown: data.category_breakdown,   // object { makanan: 311000, ... }
  dailyBreakdown: data.daily_breakdown,         // object { "2026-04-01": 50000, ... }
  monthlyBreakdown: data.monthly_breakdown,     // object { "2026-04": 2360000, ... }
};
```

**Cara fetch `prediction`:** Karena predict/balance butuh `current_balance` sebagai input, perlu ada satu nilai `current_balance` yang disimpan/hardcode untuk sementara. Gunakan nilai tetap `3500000` (sama dengan dummyData) sambil menunggu fitur pemasukan/saldo diimplementasi.

```js
// Di dalam useEffect mount:
const predResp = await predictionAPI.getBalance({ current_balance: 3500000, user_id: 1 });
```

---

### LANGKAH 3 — `src/services/api.js` sudah benar, hanya tambahkan dashboard

**File:** `src/services/api.js`

File ini sudah punya `transactionAPI`, `predictionAPI`, `recommendationAPI`. Yang belum ada adalah `dashboardAPI`.

**Tambahkan:**
```js
export const dashboardAPI = {
  getSummary: (userId = 1) => api.get(`/dashboard?user_id=${userId}`),
};
```

---

### LANGKAH 4 — Ubah `AddTransaction.jsx`

**File:** `src/pages/AddTransaction.jsx`

**Perubahan yang diperlukan:**

1. Field form saat ini pakai `nominal`. Backend menerima `amount` ATAU `nominal` — keduanya diterima, jadi **tidak perlu ubah field form**.

2. Fungsi `handleSubmit` saat ini:
```js
addTransaction({ ...form, nominal: Number(form.nominal) });
```
Setelah Context diubah di Langkah 2, `addTransaction` akan otomatis memanggil API. **Tidak ada perubahan di sini**, asalkan Context diubah dengan benar.

3. Fungsi `predictCategory` — saat ini sinkron (langsung return string). Setelah Context diubah, fungsi ini akan return **Promise**. Ubah `useEffect` di AddTransaction:

```js
// Sebelum (sinkron):
useEffect(() => {
  if (form.description.length >= 3) {
    const predicted = predictCategory(form.description);  // langsung return string
    ...
  }
}, [form.description]);

// Sesudah (async):
useEffect(() => {
  if (form.description.length >= 3) {
    predictCategory(form.description).then((predicted) => {  // return Promise
      if (predicted && predicted !== form.category) {
        setAiSuggestion(predicted);
      } else {
        setAiSuggestion(null);
      }
    }).catch(() => setAiSuggestion(null));
  } else {
    setAiSuggestion(null);
  }
}, [form.description, form.category]);
```

---

### LANGKAH 5 — Ubah `Dashboard.jsx`

**File:** `src/pages/Dashboard.jsx`

**Tidak banyak yang berubah** karena Dashboard hanya membaca dari Context (`useFinance()`). Selama Context di Langkah 2 sudah diubah dan mapping field sudah benar, Dashboard akan berfungsi otomatis.

**Yang perlu diperiksa:**
- `prediction.predicted_end_balance` → pastikan mapping sudah dibuat di Context
- `financialScore.category` → pastikan mapping `level` → `category` sudah dibuat di Context
- `summary.totalSpending`, `summary.categoryBreakdown`, dll → pastikan mapping snake_case → camelCase sudah dibuat

**Tambahkan loading state** di awal render:
```jsx
const { summary, prediction, financialScore, recommendations, transactions, loading } = useFinance();

if (loading || !summary || !prediction) {
  return <div style={{ textAlign: 'center', padding: '80px', color: '#5a6d99' }}>Memuat data...</div>;
}
```

---

### LANGKAH 6 — Ubah `Transactions.jsx`

**File:** `src/pages/Transactions.jsx`

**Perubahan utama:**

1. Filter saat ini dilakukan **di frontend** (Array.filter). Setelah integrasi, filter tetap boleh di frontend karena semua transaksi sudah diload ke state. **Tidak perlu ubah filter logic.**

2. Fungsi `handleDelete` saat ini:
```js
const handleDelete = (id) => {
  setDeletingId(id);
  setTimeout(() => {
    deleteTransaction(id);  // ← ini yang akan berubah perilakunya
    ...
  }, 300);
};
```
Setelah Context diubah, `deleteTransaction` akan memanggil API. **Tidak perlu ubah di sini.**

3. **Tambahkan loading state:**
```jsx
const { transactions, deleteTransaction, loading } = useFinance();

if (loading) return <div style={{ padding: '80px', textAlign: 'center', color: '#5a6d99' }}>Memuat transaksi...</div>;
```

---

### LANGKAH 7 — Pastikan `useDashboard.js` tetap berfungsi

**File:** `src/hooks/useDashboard.js`

Hook ini membaca `summary`, `prediction`, `financialScore`, `recommendations` dari Context. Setelah Context diubah, semua data ini sudah dalam format yang benar (karena mapping dilakukan di Context).

**Satu-satunya perubahan:** Kalkulasi `predictionStatus` saat ini:
```js
const predictionStatus = useMemo(() => {
  const ratio = prediction.predicted_end_balance / prediction.current_balance;
  ...
}, [prediction]);
```
Ini tetap berfungsi karena kita sudah mapping `predicted_end_balance` di Context.

**Namun**, jika `prediction` bisa `null` (loading state), perlu guard:
```js
const predictionStatus = useMemo(() => {
  if (!prediction) return 'aman';
  const ratio = prediction.predicted_end_balance / prediction.current_balance;
  if (ratio >= 0.5) return 'aman';
  if (ratio >= 0.2) return 'warning';
  return 'bahaya';
}, [prediction]);
```

---

## RINGKASAN URUTAN PEKERJAAN

```
1. Cek/tambah API_BASE_URL di src/utils/constants.js
2. Tambahkan dashboardAPI ke src/services/api.js
3. Ganti total isi FinanceContext.jsx:
   - useEffect untuk fetch semua data saat mount
   - addTransaction → POST /api/transactions
   - updateTransaction → PUT /api/transactions/:id
   - deleteTransaction → DELETE /api/transactions/:id
   - predictCategory → POST /api/predict/category (async)
   - Mapping semua field response (level→category, predicted_balance→predicted_end_balance, snake_case→camelCase)
4. Update AddTransaction.jsx: ubah predictCategory menjadi async di useEffect
5. Tambahkan loading guard di Dashboard.jsx dan Transactions.jsx
6. Tambahkan null-check di useDashboard.js untuk prediction
```

---

## CATATAN PENTING UNTUK AI

### Yang TIDAK boleh diubah:
- Semua JSX dan styling di halaman (`Dashboard.jsx`, `Transactions.jsx`, `AddTransaction.jsx`) — jangan ubah UI
- File `src/data/dummyData.js` — tetap biarkan ada sebagai referensi, hanya tidak dipakai lagi oleh Context
- Semua konstanta `CATEGORIES`, `PAYMENT_METHODS`, `CATEGORY_EMOJIS`, `CATEGORY_COLORS`
- Struktur routing di `App.jsx`
- File `src/hooks/useTransactions.js` — tidak perlu diubah

### Yang BOLEH dihapus setelah integrasi selesai:
- Import `dummyTransactions`, `dummyPrediction`, `dummyFinancialScore`, `dummyRecommendations` di FinanceContext.jsx
- `initialState` yang berisi dummy data

### Handler error yang harus ada:
Setiap panggilan API harus punya try/catch yang menampilkan pesan error ke user (minimal `console.error`, idealnya set state `error`).

### User ID:
Sementara tidak ada sistem login, **selalu gunakan `user_id: 1`** di semua request.

### Urutan fetch di useEffect:
Fetch boleh paralel menggunakan `Promise.all` agar lebih cepat:
```js
const [txnResp, dashResp, scoreResp, recResp, predResp] = await Promise.all([
  transactionAPI.getAll(),
  dashboardAPI.getSummary(1),
  recommendationAPI.getScore(1),
  recommendationAPI.getAll(1),
  predictionAPI.getBalance({ current_balance: 3500000, user_id: 1 }),
]);
```

### Response shape dari `src/services/api.js`:
Axios interceptor di `api.js` sudah melakukan `response => response.data`, artinya hasilnya sudah **unwrapped satu level**. Format yang diterima fungsi API adalah:
```js
{
  success: true,
  data: { ... },
  count: 30  // untuk list
}
```
Jadi untuk mengambil data, akses `resp.data`, bukan `resp.data.data`.

---

## CONTOH AKHIR: FINANCECONTEXT SETELAH INTEGRASI

Ini gambaran kasar struktur baru `FinanceContext.jsx` (AI harus menulis kode lengkapnya):

```js
// Imports
import { transactionAPI, predictionAPI, recommendationAPI, dashboardAPI } from '../services/api';

// State
const [state, dispatch] = useReducer(financeReducer, {
  transactions: [],
  summary: null,
  financialScore: null,
  recommendations: [],
  prediction: null,
  loading: true,
  error: null,
});

// Fetch semua data saat mount
useEffect(() => {
  async function fetchAll() {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const [txnResp, dashResp, scoreResp, recResp, predResp] = await Promise.all([
        transactionAPI.getAll(),
        dashboardAPI.getSummary(1),
        recommendationAPI.getScore(1),
        recommendationAPI.getAll(1),
        predictionAPI.getBalance({ current_balance: 3500000, user_id: 1 }),
      ]);

      // Mapping + simpan ke state
      dispatch({ type: 'SET_TRANSACTIONS', payload: txnResp.data });
      dispatch({ type: 'SET_SUMMARY', payload: mapSummary(dashResp.data) });
      dispatch({ type: 'SET_FINANCIAL_SCORE', payload: mapFinancialScore(scoreResp.data) });
      dispatch({ type: 'SET_RECOMMENDATIONS', payload: recResp.data });
      dispatch({ type: 'SET_PREDICTION', payload: mapPrediction(predResp.data) });

    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }
  fetchAll();
}, []);

// addTransaction
const addTransaction = useCallback(async (formData) => {
  const resp = await transactionAPI.create({
    amount: Number(formData.nominal),
    category: formData.category,
    description: formData.description,
    payment_method: formData.payment_method,
    date: formData.date,
    user_id: 1,
  });
  dispatch({ type: 'ADD_TRANSACTION', payload: resp.data });
  return resp.data;
}, []);

// deleteTransaction
const deleteTransaction = useCallback(async (id) => {
  await transactionAPI.delete(id);
  dispatch({ type: 'DELETE_TRANSACTION', payload: id });
}, []);

// predictCategory (async sekarang)
const predictCategory = useCallback(async (description) => {
  const resp = await predictionAPI.getCategory(description);
  return resp.data.category;
}, []);
```

---

*Dokumen ini dibuat berdasarkan pembacaan langsung source code frontend dan backend FinZ pada 2026-04-16.*

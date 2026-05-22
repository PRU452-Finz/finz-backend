# 🎨 Prompt untuk Generate Diagram Draw.io di ChatGPT

> **Instruksi:** Copy text di bawah ini dan paste ke ChatGPT. Prompt ini didesain agar ChatGPT membuatkan diagram arsitektur yang strukturnya mirip dengan gambar referensi yang kamu berikan, tapi menggunakan teknologi FinZ terbaru.

---

**COPY TEXT DI BAWAH INI 👇**

```text
Buatkan saya kode XML untuk di-import langsung ke draw.io (diagrams.net), atau kode Mermaid.js tingkat lanjut untuk diagram arsitektur sistem.

Gaya dan layout diagramnya HARUS meniru struktur berikut (dari kiri ke kanan):
1. Paling kiri: Ikon "User" mengarah ke ikon "Website" (React Frontend).
2. Dari Website, pecah menjadi beberapa cabang ke kanan menuju node "Endpoints" (misal: Endpoint Auth, Endpoint Dashboard, Endpoint Transaction, Endpoint AI).
3. Dari node-node Endpoints tersebut, garis berkumpul menuju lingkaran besar di tengah: "Backend Node.js" (Express).
4. Dari Backend Node.js, alurnya menuju sebuah node "Cache" (Redis).
5. Di sekitar Cache, berikan label teks yang menunjukkan proses operasi cache, misalnya:
   - GET finz:cache:dashboard:{uuid}
   - SET finz:cache:dashboard:{uuid}
6. Dari area Cache/Backend, alur terpecah menjadi dua arah (atas dan bawah):
   - Arah atas (Database): Menuju ikon Database silinder bernama "PostgreSQL" (sebelumnya MySQL).
   - Arah bawah (AI/ML): Menuju node "Endpoint Model" -> lalu ke "Backend Python" (Flask) -> lalu ke ikon otak/chip "Model AI".
7. Untuk alur mutasi data (seperti input/update transaksi):
   - Buat satu alur khusus di bagian bawah dari "Endpoint Transaction" -> "Cache" -> proses "Delete Cache (Pattern)" -> kondisi "Is data exist?" -> lalu menuju PostgreSQL dan Backend Python.

Konteks Sistem FinZ yang sebenarnya untuk mengisi label-labelnya:
- Frontend: React / Vite
- Backend: Node.js (Express.js)
- Database: PostgreSQL (bukan MySQL)
- Cache: Redis (digunakan untuk Rate Limiting dan Response Caching)
- AI Server: Python (Flask)
- AI Models: TensorFlow (Klasifikasi & Prediksi)

Pastikan desainnya terlihat teknis, rapi, terstruktur secara horizontal dari kiri ke kanan, dan menggunakan warna-warni yang kontras (seperti ikon biru untuk endpoint, hijau untuk backend utama, dan merah/biru gelap untuk cache/DB).

Jika kamu menggunakan XML draw.io, berikan output di dalam code block ```xml. Jika menggunakan Mermaid, gunakan code block ```mermaid.
```

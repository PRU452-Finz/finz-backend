# Bug Analysis Report & Debugging Prompt for Claude

## 1. System Context
- **Frontend**: React (Vite) + Tailwind. Components: `NotificationBell.jsx`, `Dashboard.jsx`.
- **Backend (Node.js)**: Express + Sequelize (MySQL). Controller: `budgetAlertController.js`. Service: `aiService.js` & `aiClient.js`.
- **AI Server (Python)**: Flask + Rule Engine. Files: `app.py`, `rule_engine.py`, `budget_alert.py`.

## 2. The Issue
AI-powered insights (identified with a robot icon `🤖`) are not appearing in the `NotificationBell` UI, even though:
1. Manual tests (`curl`) confirm the Python AI server generates alerts correctly for specific users (e.g., `user_id: 8`).
2. The Backend has been updated to handle the Python response format (`alerts` key).
3. Category mapping (e.g., `makanan` -> `Makan & Minum`) is implemented in `dashboardService.js`.

## 3. Technical Breakdown for Claude
Copy the prompt below and paste it into Claude to analyze the issue:

---

### **PROMPT UNTUK CLAUDE**

"Halo Claude, saya sedang mengembangkan aplikasi manajemen keuangan bernama **FinZ**. Saya butuh bantuanmu untuk melakukan 'Deep Dive Debugging' pada fitur **AI Budget Alert** yang tidak muncul di Frontend.

**Kondisi Saat Ini:**
1. **Flow Data:** Dashboard (FE) -> Dashboard Controller (BE) -> Background trigger ke AI Server (Python) -> AI men-generate alert di memory -> Frontend Bell (FE) fetch alert dari Backend -> Backend fetch dari AI Server.
2. **Masalah:** Lonceng notifikasi tetap kosong/hanya berisi alert budget standar, tidak ada 'AI Insight' (ikon 🤖).
3. **Hasil Temuan Terakhir:**
   - Server AI (Python) merespons dengan format: `{"alerts": [{"message": "...", "severity": "danger", ...}]}`.
   - Backend (Node.js) mencari data ini di `budgetAlertController.js`.
   - Data Seeder sudah membuat persona (User 8: Ashley) dengan transaksi yang seharusnya memicu alert (Overspend).

**Analisis yang Saya Butuhkan:**
1. **Sinkronisasi Port & Host:** Periksa apakah `aiClient.js` di Node.js (port 8000) bisa berkomunikasi dengan Flask (port 5000) di environment Linux/Docker.
2. **Format Bulan:** Frontend mengirim month `2026-05`. Pastikan Python `rule_engine.py` dan `budget_alert.py` memproses format string ini dengan benar (bukan sebagai objek Date).
3. **Race Condition:** Apakah penarikan alert di Lonceng (Bell) terjadi sebelum Background Task di Dashboard selesai men-generate alert di sisi AI?
4. **Key Mapping:** Periksa kode `budgetAlertController.js` berikut:
   ```javascript
   const rules = aiResp.alerts || aiResp.triggered_rules || [];
   aiAlerts = rules.map(r => ({
     category: 'AI Insight',
     message: r.message,
     status: r.severity === 'danger' ? 'exceeded' : 'warning',
     is_ai: true
   }));
   ```
   Apakah ada properti yang kurang agar `NotificationBell.jsx` bisa merender ini?

**File Terkait:**
- `finz-backend/src/controllers/budgetAlertController.js`
- `finz-backend/src/services/aiClient.js`
- `AI-master/app.py`
- `AI-master/budget_alert.py`
- `FinZ/src/components/NotificationBell.jsx`


---

## 4. Current State (For Your Reference)
- **User ID yang dites**: 8 (Ashley).
- **Periode**: 2026-05.
- **Backend Port**: 8000.
- **AI Port**: 5000.
- **Frontend Port**: 5173.

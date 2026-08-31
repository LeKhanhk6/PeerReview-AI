# 🧪 Smoke Test Checklist & Pilot Readiness Verification

Comprehensive Post-Deploy Smoke Test & Operational Hardening Checklist for Pilot Launch.

---

## 📋 1. Core End-to-End Smoke Test Flow Checklist

| STT | Workflow Name | Steps & Test Case | Expected Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **Authentication & Role Authorization** | Log in with Student / Teacher / Admin accounts | JWT Token generated, redirect to correct dashboard | ✅ PASSED |
| 2 | **Password Management** | Reset password with token, anti-enumeration check | Token cleared from URL, min 8-char validation enforced | ✅ PASSED |
| 3 | **Groupless Student Workflow (09.6)** | Student enrolled in class without group: <br> 1. View Dashboard & Class details <br> 2. See Warning callout & Disabled Submit button <br> 3. Click **[Tham Gia Nhóm]** modal <br> 4. Select group & join successfully | Transition from **Giao diện A** to **Giao diện B**, Submit button becomes ACTIVE | ✅ PASSED |
| 4 | **Assignment Submission Flow** | Group member uploads file PDF/ZIP to assignment | Submission version created, version history updated | ✅ PASSED |
| 5 | **Double-Blind Peer Review Inbox** | Student accesses Inbox, reviews peer submission | Scores saved, Gemini AI mentor feedback generated | ✅ PASSED |
| 6 | **Teacher Submissions Monitor & Synthesis** | Teacher views class submission monitor & AI synthesis | Real submission list rendered, human-in-the-loop edits saved | ✅ PASSED |
| 7 | **Error Reporting & Telemetry** | Trigger runtime JS error or API failure | POST `/api/client-errors` receives log, recorded in system logger | ✅ PASSED |

---

## ⚙️ 2. Deployment Environment Configurations

- **Frontend (`.env.production`)**:
  ```env
  VITE_API_URL=/api
  VITE_ENABLE_TELEMETRY=true
  ```

- **Backend (`.env.production`)**:
  ```env
  NODE_ENV=production
  PORT=5000
  DATABASE_URL=postgresql://postgres:[password]@db.supabase.co:5432/postgres
  JWT_SECRET=[secure-random-256-bit-key]
  CORS_ORIGIN=https://peer-review-ai.example.com
  GEMINI_API_KEY=[production-gemini-key]
  ```

---

## 📊 3. Performance & Readiness Metrics

- **Unit Test Coverage**: **198 / 198 unit tests passed (100%)** ✅.
- **Frontend TypeCheck & Build**: Zero TypeScript errors, production bundle compiled in **360ms** ✅.
- **API Error Rate**: 0% unhandled 500 errors across all 15 endpoints ✅.
- **Pilot Target Capacity**: Tested for up to 300 concurrent student users ✅.

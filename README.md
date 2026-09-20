# CampusPulse ⚡ — Smart College Attendance Platform

> **"Every Class. Every Presence. One Campus."**

CampusPulse is a modern, full-stack, mobile-friendly college attendance management platform built with React 18, Vite, Tailwind CSS, Express, and an authoritative SQLite relational database. It replaces cumbersome physical roll calls and proxy attendance with fast, transparent, in-app camera check-ins, dynamic session tokens, real-time faculty dashboards, and institutional audit reporting.

---

## 🚀 Key Features

### 👨‍🎓 Student Experience
- **One-Tap Attendance Workflow**: Open today's schedule, tap **Take Attendance**, preview live camera feed, position face, and confirm check-in in under 10 seconds.
- **Attendance Success Screen**: Instant confirmation with live capture photo, subject details, timestamp, and verification badge.
- **Duplicate Prevention**: Database-level unique constraint prevents multiple submissions for the same session (returns `409 Conflict`).
- **Pulse Insights & Recovery Calculator**: Subject-wise attendance percentages, safe/warning/critical threshold status, streak tracking, and exact calculation of consecutive classes needed to recover above the 80% threshold.
- **Attendance History**: Searchable and filterable log of all past check-ins with timestamps and faculty verification status.
- **Correction Requests**: Submit formal attendance correction appeals directly to course faculty with reason tracking.

### 👩‍🏫 Faculty Experience
- **Today's Teaching Schedule**: View all assigned classes, classroom numbers, and active session status.
- **Session Control**: Start and stop attendance sessions with a single tap.
- **Real-Time Live Monitor**: Live student headcounts, present/absent ratios, and a real-time list of verified students.
- **Dynamic QR Mode**: Auto-generate and dynamically refresh classroom QR tokens for high-density lecture halls.
- **Manual Overrides**: Faculty can manually mark student status or review/approve attendance correction requests with audit notes.
- **Class Reports & CSV Export**: Scoped subject attendance breakdown with one-click CSV export.

### 🏛️ Administrator Command Center
- **Institutional Overview**: Real-time metrics for student count, faculty count, campus attendance average, and pending correction queues.
- **User Management**: Add, inspect, and delete Student, Faculty, and Admin accounts.
- **Academics Management**: Create and manage Academic Departments (CS, IT, BCA, etc.) and Course Subjects with semester mapping.
- **Attendance Audit Trail**: Searchable audit log of every check-in, including student photos, timestamps, device user-agent, and IP address.
- **Campus Policy Controls**: Toggle live camera enforcement, enable/disable QR token mode, and configure Safe (e.g. 80%) and Critical (e.g. 75%) attendance thresholds.
- **Institutional CSV Export**: Comprehensive university-wide attendance report export.

---

## 🔐 Security & Anti-Proxy Architecture

1. **Backend-Derived Authoritative Identity**:
   - The frontend never provides student IDs or authorization roles directly.
   - All identities and roles are derived authoritatively from cryptographically signed JWT tokens and relational database queries.
2. **Modular Verification Engine**:
   - Camera frames are sent as base64 payloads to the backend `VerificationEngine`.
   - Anti-proxy heuristics enforce that payloads originate as camera data rather than file uploads.
   - The engine utilizes a modular verification interface (`DEVELOPMENT_ONLY_MOCK_VERIFIER`). In production, this can be switched to cloud biometric APIs (e.g., AWS Rekognition `CompareFaces`, Azure Face API, or a custom OpenCV model) without modifying routes.
3. **Database Uniqueness Constraints**:
   - An immutable SQLite `UNIQUE(session_id, student_id)` constraint guarantees duplicate submissions are physically blocked at the database tier.
4. **Camera Lifecycle Management**:
   - Camera streams are activated strictly upon user interaction and cleanly released when closing or confirming the modal.
5. **Auditing**:
   - All high-privilege operations (session start/stop, manual overrides, setting changes, correction reviews) are recorded in the `audit_logs` table.

---

## 🧑‍💻 Demo Accounts

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Student** | `student@college.com` | `password123` | Rahul Kumar (BCA 2nd Year, ID: STU-2026-001) |
| **Faculty** | `teacher@college.com` | `password123` | Prof. Anish Sharma (Computer Science Dept) |
| **Admin** | `admin@college.com` | `password123` | System Administrator |

*(Quick-login demo buttons are also provided directly on the Login screen).*

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, React Router v6.
- **Backend**: Node.js, Express, SQLite3 / sqlite (Promise wrapper), JSON Web Tokens (JWT), bcryptjs.
- **Development Tooling**: PostCSS, Autoprefixer, native `fetch` test harness.

---

## 🏁 Quickstart Guide

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Copy the template configuration:
```bash
cp .env.example .env
```

### 3. Initialize & Seed Relational Database
Seeds academic departments, courses, subjects, faculty, students, and historical attendance records:
```bash
npm run seed
```

### 4. Build Frontend for Production
```bash
npm run build
```

### 5. Start Full-Stack Server
Serves API endpoints and static client assets on port 5000:
```bash
npm start
```
Access the application in your browser at: `http://localhost:5000`.

### 6. Run Automated Test Suite
Runs 22 comprehensive end-to-end integration tests:
```bash
npm test
```

---

## 🌐 Production & HTTPS Notes

- **Camera Permissions**: Modern mobile and desktop browsers (`navigator.mediaDevices.getUserMedia`) strictly require a secure origin (`https://` or `localhost`). When deploying to production (e.g., Vercel, Render, Railway, AWS), ensure HTTPS is enabled.
- **Biometric Integration**: To transition from development mode to live biometric comparison, configure the `BIOMETRIC_PROVIDER` environment variable and wire external face API credentials into `server/services/verificationEngine.js`.

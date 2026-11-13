# Secure File Transfer Session State Management System

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Encryption](https://img.shields.io/badge/Cipher-AES--256--GCM-blueviolet.svg)](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
[![Integrity](https://img.shields.io/badge/Integrity-SHA--256-orange.svg)](https://en.wikipedia.org/wiki/SHA-2)

A cyber security-centric full-stack MERN web application developed for academic evaluation and enterprise-grade file transfer protection. The system enforces an authenticated **Finite State Machine (FSM)** lifecycle engine, authenticated symmetric **AES-256-GCM** encryption, tamper-proof **SHA-256** checksum verification, and immutable security audit logs.

---

## 🛡️ Core System Objectives & Features

1. **Finite State Machine (FSM) Session Control**:
   - Every file transfer (upload/download) is governed by a strict deterministic Finite State Machine.
   - States: `INITIATED` ➔ `AUTHENTICATING` ➔ `READY` ➔ `UPLOADING` ➔ `VERIFYING` ➔ `COMPLETED`.
   - Deviation states: `FAILED`, `CANCELLED`, `EXPIRED`.
   - Every state transition is validated server-side. Illegal transitions are rejected and recorded to the security ledger.
   - Background daemon automatically expires inactive sessions exceeding threshold timeout.

2. **Cryptographic Security & Zero-Static File Exposure**:
   - Files are never exposed via public static directories.
   - Plaintext uploads are immediately encrypted with **AES-256-GCM** using a 256-bit symmetric key (`FILE_ENCRYPTION_KEY`) and distinct 128-bit Initialization Vectors (IVs) and Authentication Tags.
   - Plaintext files on disk are unlinked upon encryption.
   - **SHA-256 integrity hashes** are recorded. Downloads require cryptographic authentication and verify the calculated SHA-256 checksum before streaming.

3. **User Authentication & Role-Based Access Control (RBAC)**:
   - User registration and login protected with **bcrypt** (salt factor 10) and **JWT** (JSON Web Tokens).
   - Rate limiting on API routes and authentication endpoints to prevent brute-force attacks.
   - Distinction between standard **User** and **Admin (Root)** roles.

4. **Session Monitoring & Interactive FSM Inspector**:
   - Dedicated inspection cockpit displaying Session ID, User, File Name, Current State, Progress %, Start Time, Last Updated, and Expiration Deadline.
   - Interactive SVG/Canvas state diagram with dynamic color highlights:
     - 🟦 **Blue**: Active (`INITIATED`, `AUTHENTICATING`, `READY`, `UPLOADING`, `VERIFYING`)
     - 🟩 **Green**: `COMPLETED`
     - 🟥 **Red**: `FAILED`
     - 🟧 **Orange**: `CANCELLED`
     - ⬜ **Gray**: `EXPIRED`
   - Real-time interactive transition simulator to test valid and illegal state changes.

5. **Cybersecurity Administration Command Portal**:
   - User governance: View all operatives and suspend/block access.
   - System-wide transfer session monitor.
   - Immutable security audit log viewer with IP address tracking, status badges (`SUCCESS`, `WARNING`, `ALERT`, `FAILURE`), and telemetry metrics.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router DOM v6, Axios, Lucide React Icons, Recharts |
| **Backend** | Node.js, Express.js, REST API Architecture |
| **Database** | MongoDB, Mongoose ODM (with automatic embedded In-Memory fallback for zero-config evaluation) |
| **Security & Crypto** | AES-256-GCM, SHA-256 Hashing, JWT, bcryptjs, Multer, Helmet, Express Rate Limit |

---

## 📂 Project Structure

```text
secure-file-transfer/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── DashboardCard.jsx
│   │   │   ├── FileTable.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── SecurityActivity.jsx
│   │   │   ├── SessionHistory.jsx
│   │   │   ├── SessionStatus.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StateMachineDiagram.jsx
│   │   │   └── TransferProgress.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── FileManagement.jsx
│   │   │   ├── FileUpload.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── SessionMonitoring.jsx
│   │   │   ├── TransferHistory.jsx
│   │   │   └── UserProfile.jsx
│   │   ├── services/
│   │   │   ├── adminService.js
│   │   │   ├── api.js
│   │   │   ├── fileService.js
│   │   │   └── sessionService.js
│   │   ├── utils/
│   │   │   └── fsmConstants.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── .env
│   └── .env.example
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── fileController.js
│   │   └── sessionController.js
│   ├── middleware/
│   │   ├── adminMiddleware.js
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   ├── securityLogger.js
│   │   └── uploadMiddleware.js
│   ├── models/
│   │   ├── File.js
│   │   ├── SecurityLog.js
│   │   ├── TransferSession.js
│   │   └── User.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── fileRoutes.js
│   │   └── sessionRoutes.js
│   ├── services/
│   │   └── sessionExpirationService.js
│   ├── stateMachine/
│   │   ├── fsmConfig.js
│   │   └── transferFSM.js
│   ├── utils/
│   │   └── cryptoUtils.js
│   ├── uploads/
│   │   ├── encrypted/
│   │   └── temp/
│   ├── package.json
│   ├── server.js
│   ├── .env
│   └── .env.example
│
├── README.md
└── .gitignore
```

---

## ⚙️ Configuration & Environment Variables

### Backend Environment (`backend/.env`)

```env
PORT=5000
NODE_ENV=development

# MongoDB Connection String (automatic embedded fallback if local service is not active)
MONGO_URI=mongodb://127.0.0.1:27017/secure_file_transfer

# JWT Secret
JWT_SECRET=cyber_secure_transfer_jwt_key_98234789123891723981
JWT_EXPIRES_IN=7d

# 256-Bit Cryptographic Key (64 hex characters)
FILE_ENCRYPTION_KEY=b7d8f419c83692a76f281e5927ad014bc9103e5b72183cf91289df718293a401

# Inactivity Timeout (Minutes)
SESSION_TIMEOUT_MINUTES=30

# CORS Origin
CORS_ORIGIN=http://localhost:5173
```

### Frontend Environment (`frontend/.env`)

```env
VITE_API_URL=/api
```

---

## 🚀 Quick Start Guide (Windows / VS Code)

### Prerequisites
- **Node.js**: v18 or higher (tested on v26+)
- **MongoDB**: Local MongoDB Community Server, MongoDB Atlas, or rely on the automatic In-Memory engine.

### 1. Backend Setup & Launch

Open a Windows terminal or VS Code integrated terminal:

```powershell
cd secure-file-transfer/backend
npm install
npm run dev
```

*The backend server will launch on `http://localhost:5000`.*
*On first startup, default admin and demo user accounts are automatically seeded into the database.*

### 2. Frontend Setup & Launch

Open a second terminal window:

```powershell
cd secure-file-transfer/frontend
npm install
npm run dev
```

*The frontend application will launch on `http://localhost:5173`.*

---

## 🔑 Pre-Seeded Academic Evaluation Credentials

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Root Administrator** | `admin@cybersec.io` | `AdminPassword123!` | System Telemetry, User Blocking, All Sessions, Security Audit Logs |
| **Operative User** | `user@cybersec.io` | `UserPassword123!` | File Encryption, Vault Access, FSM Session Monitoring |

> 💡 **Tip:** On the Login page, click the **"Quick Academic Demo Accounts"** button to auto-fill credentials instantly!

---

## 🧪 Testing & Demonstration Walkthrough

1. **Authentication Testing**:
   - Log in using `admin@cybersec.io` or register a new account.
   - Verify JWT issuance and profile retrieval.

2. **FSM-Governed File Upload & Encryption**:
   - Navigate to **"Upload File"**.
   - Select any document, image, or text file.
   - Observe the live FSM pipeline progress:
     - `INITIATED` ➔ Handshake established
     - `AUTHENTICATING` ➔ User verified
     - `READY` ➔ Socket opened
     - `UPLOADING` ➔ Data streaming
     - `VERIFYING` ➔ AES-256-GCM ciphering & SHA-256 calculation
     - `COMPLETED` ➔ Cryptographic receipt generated with SHA-256 checksum.

3. **Secure Vault & Download Integrity**:
   - Navigate to **"File Vault"**.
   - Click **"Verify"** to test on-the-fly integrity without downloading.
   - Click **"Decrypt"** to download the file. The server decrypts with AES-256-GCM, compares the SHA-256 hash, and streams the verified plaintext.

4. **FSM Enforcement & Illegal Transition Rejection**:
   - Navigate to **"FSM Session Monitor"**.
   - Select an active or completed session.
   - In the **Interactive FSM Transition Engine**, pick an illegal target (e.g., attempt to move `COMPLETED` to `UPLOADING`).
   - Click **"Execute Transition"**.
   - Observe that the backend rejects the invalid transition with HTTP 400 and logs an alert in `SecurityLog`.

5. **Admin Governance & Security Logs**:
   - Log in as `admin@cybersec.io` and click **"Security Command"** in the sidebar.
   - Test user suspension by toggling **"Block User"**.
   - View recent security events, IP addresses, and state transition alerts.

---

## 📜 Academic Integrity & License

Developed as a college academic capstone project demonstrating advanced MERN stack engineering, state-driven software architecture, and practical cybersecurity paradigms.
Distributed under the ISC License.

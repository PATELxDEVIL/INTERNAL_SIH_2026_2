# Internal SIH 2026 — Registration Portal

The official registration and management portal for the **Internal Smart India Hackathon 2026** organized by the Research, Coding, Design, and Soft Skills clubs at **Vidush Somany Institute of Technology & Research (VSITR)**.

---

## ✨ Features

### Public Pages
- **Fully Responsive UI** — Beautifully scales across mobile, tablet, and desktop devices.
- **Dynamic Landing Page** — Animated hero image slider, real-time countdown timer (admin-controlled), Rules & FAQ accordion, and Organizing Clubs showcase.
- **Problem Statements Page** (`/problems`) — Publicly lists all problem statements that the Admin has marked as "Live".
- **Team Registration** (`/register`) — A multi-step registration wizard that enforces strict rules:
  - **Live Team Name Check**: Instant feedback if a team name is already taken.
  - **Exactly 6 members** per team (1 team leader + 5 members).
  - **At least 1 female** participant required.
  - **Unique enrollment numbers** required across the entire platform.
  - Restricted to specific departments (Computer Engineering, Computer Science and Engineering, Information Technology).
  - Team name must not include the institute name (VSITR / Vidush Somany).

### Team Leader Portal (`/team/login`)
- Secure login using auto-generated **Team ID** and **8-character password**.
- Submit and update **Mentor Details** (Phase 2 of registration).
- Browse and select an available **Problem Statement**.

### Admin Portal (`/admin/login`)
- **Dashboard Overview** — Stats for total teams, total participants, male/female ratio, pending mentor submissions.
- **Team Management** — View all registered teams with status, reset any team's password.
- **Problem Statements** — Upload new problem statements (with PDF), toggle Live/Offline status.
- **Portal Configuration**:
  - Upload individual **brand logos** (SIH, KSV, VSITR) for the navbar and footer.
  - Upload **hero slider images** for the landing page.
  - Update the **registration deadline** (reflected live on the countdown timer).

### Automated Emails (via Resend)
- **Team Leader** receives: Team ID, auto-generated password, and rules upon registration.
- **All members** receive: A confirmation notification upon successful registration.
- **Admin Password Reset**: Secure OTP delivered to the registered admin email.

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Styling | Vanilla CSS Modules (VSITR Red/Blue theme) |
| Database | **Neon Serverless Postgres (Relational Schema)** |
| Authentication | Bcrypt (password hashing) |
| Email | **Resend API** |
| File Storage | Local `/public/uploads` directory |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or higher
- A [Neon Serverless Postgres](https://neon.tech/) account (for `DATABASE_URL`)
- A [Resend](https://resend.com/) API Key (for `RESEND_API_KEY`)

### Installation

1. Clone the repository and navigate to the root directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the project root:
   ```env
   # Neon PostgreSQL Database
   DATABASE_URL="postgresql://<user>:<password>@<endpoint>.neon.tech/<dbname>?sslmode=require"
   
   # Resend Email API
   RESEND_API_KEY="re_your_api_key_here"
   ```
4. (First time only) Run the initialization script to create the 8 relational tables in your Neon database:
   ```bash
   node scripts/init-schema.js
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Default Credentials

### Admin Dashboard (`/admin/login`)
| Field | Value |
|---|---|
| Username | `admin` |
| Password | `password` |

> ⚠️ **Change the admin password immediately in production via the Dashboard profile.**

---

## 📁 Folder Structure

```
d:\Internal_SIH_2026\
├── public\
│   ├── logos\              # Default brand logos (SIH, KSV, VSITR)
│   └── uploads\            # Admin-uploaded images and PDFs
├── scripts\
│   ├── init-schema.js      # Creates relational DB tables in Neon
│   └── migrate.js          # (Legacy) Migrates old JSON blob data to relational tables
└── src\
    ├── app\
    │   ├── admin\          # Admin login + dashboard pages
    │   ├── api\            # Backend API routes
    │   ├── problems\       # Public problem statements page
    │   ├── register\       # Team registration wizard
    │   └── team\           # Team leader login + dashboard
    ├── components\         # Reusable UI components (Navbar, Footer, etc.)
    └── lib\
        ├── db.js           # Neon Postgres relational query helpers
        └── email.js        # Email sending utility using Resend API
```

---

## 🌐 Deployment

This portal is designed to be deployed to platforms like **Vercel**:

1. Push the repository to GitHub.
2. Connect the GitHub repo to Vercel.
3. Add all **Environment Variables** (`DATABASE_URL`, `RESEND_API_KEY`) to Vercel's project settings.
4. Deploy.

> ⚠️ **Do NOT commit `.env.local` to version control.** It contains sensitive credentials.

---

*© 2026 Internal SIH Hackathon — VSITR, KSV*

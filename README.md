<<<<<<< HEAD
# INTERNAL_SIH_2026
This is for internal SIH registration and managemant website.
=======
# Internal SIH 2026 — Registration Portal

The official registration and management portal for the **Internal Smart India Hackathon 2026** organized by the Research, Coding, Design, and Soft Skills clubs at **Vidush Somany Institute of Technology & Research (VSITR)**.

---

## ✨ Features

### Public Pages
- **Dynamic Landing Page** — Animated hero image slider, real-time countdown timer (admin-controlled), Rules & FAQ accordion, and Organizing Clubs showcase.
- **Problem Statements Page** (`/problems`) — Publicly lists all problem statements that the Admin has marked as "Live".
- **Team Registration** (`/register`) — A multi-step registration wizard that enforces:
  - Exactly 6 members per team (including team leader)
  - At least 1 female participant
  - Unique enrollment numbers per participant
  - No duplicate team names
  - Team name must not include institute name

### Team Leader Portal (`/team/login`)
- Secure login using auto-generated **Team ID** and **6-character password**.
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

### Automated Emails
- **Team Leader** receives: Team ID, auto-generated password, and rules upon registration.
- **All members** receive: A confirmation notification upon successful registration.

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Vanilla CSS Modules (VSITR Red/Blue theme) |
| Database | **Neon Serverless Postgres** |
| Authentication | Bcrypt (password hashing) |
| Email | Nodemailer (SMTP-based, with mock fallback) |
| File Storage | Local `/public/uploads` directory |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or higher
- A Neon Serverless Postgres account with a database (DATABASE_URL)

### Installation

1. Clone the repository and navigate to the root directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the project root:
   ```env
   DATABASE_URL="postgres://<user>:<password>@<endpoint>.neon.tech/<dbname>?sslmode=require"
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```
4. (First time only) Run the initialization script to seed the Neon database:
   ```bash
   node scripts/init-neon.js
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

> ⚠️ **Change the admin password immediately in production.**

---

## 📁 Folder Structure

```
d:\Internal_SIH_2026\
├── data\
│   ├── database.json       # (Legacy) Local JSON fallback storage
│   └── emails.log          # Mock email log (when SMTP not configured)
├── public\
│   ├── logos\              # Default brand logos (SIH, KSV, VSITR)
│   └── uploads\            # Admin-uploaded images and PDFs
├── scripts\
│   └── init-neon.js        # One-time initialization script for Neon Postgres
└── src\
    ├── app\
    │   ├── admin\          # Admin login + dashboard pages
    │   ├── api\            # All backend API routes
    │   │   ├── admin\      # auth, config, problems, teams
    │   │   ├── registration\
    │   │   └── team\       # auth, mentor, problems
    │   ├── problems\       # Public problem statements page
    │   ├── register\       # Team registration wizard
    │   └── team\           # Team leader login + dashboard
    ├── components\
    │   └── Navbar.jsx      # Sticky navbar with dynamic logos
        ├── db.js           # Neon Postgres adapter (readDB / writeDB)
        └── email.js        # Email sending utility (Nodemailer)
```

---

## 📧 Email Configuration

If `SMTP_HOST` is **not** set in `.env.local`, the application automatically runs in **mock mode** and logs all emails to `data/emails.log` instead of sending them.

To enable real email delivery:
1. For Gmail, go to your Google Account → Security → 2-Step Verification → **App Passwords**.
2. Generate a new app password and add it to `SMTP_PASS` in `.env.local`.
3. Restart the development server.

---

## 🌐 Deployment

This portal is designed to be deployed to platforms like **Vercel** or **Railway**:

1. Push the repository to GitHub.
2. Connect the GitHub repo to Vercel.
3. Add all **Environment Variables** from `.env.local` to Vercel's project settings.
4. Deploy.

> ⚠️ **Do NOT commit `.env.local` to version control.** It contains sensitive database credentials.

---

*© 2026 Internal SIH Hackathon — VSITR, KSV*
>>>>>>> 00ba9b2 (Initial commit)

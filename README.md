# ◎ Tokenly — Multi-Tenant Crypto Recognition Platform

A **SaaS** peer-to-peer employee recognition platform powered by **Solana SPL tokens**. Built with **Next.js**, **Supabase**, and ready to deploy on **Vercel**.

![Tokenly](https://img.shields.io/badge/Solana-SPL_Tokens-14F195?style=flat&logo=solana) ![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase) ![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?style=flat&logo=vercel)

## Features

### Multi-Tenant SaaS Architecture
- **Super Admin** — Manage all vendors, block/unblock access, view members
- **Vendor Management** — Add vendors with name, logo, and unique URL slug
- **Vendor-Branded Login** — Each vendor gets a branded sign-in page at `/v/{slug}`
- **User-Vendor Linking** — Users who sign up from a vendor page are auto-linked to that vendor
- **Multi-Vendor Users** — A single user can belong to multiple vendors with different roles
- **Blocking Cascade** — Blocking a vendor instantly prevents all its members from logging in

### Recognition & Rewards
- **Peer-to-Peer Recognition Feed** — Publicly celebrate teammate achievements
- **KUDOS Token System** — Send SPL tokens on Solana as recognition
- **Rewards Catalog** — Redeem tokens for gift cards, swag, crypto, experiences
- **Leaderboard & Analytics** — Track top contributors and recognition trends
- **Company Values** — Tag recognitions with organizational values

### Authentication & UX
- **Dual Authentication** — Email/password + Phantom wallet connect
- **Session Persistence** — Login survives page refresh via `sessionStorage`
- **Dark/Light Theme** — Toggle between themes
- **Mobile Responsive** — Adaptive layout with bottom nav

## User Hierarchy

```
Super Admin (platform-level)
  └── Vendor (tenant)
        ├── Vendor Admin (manages employees, updates logo)
        └── Employee (uses the app)
```

| Role | Capabilities |
|------|-------------|
| **Super Admin** | Create/edit/block vendors, view all members, manage platform |
| **Vendor Admin** | Update company logo/name, add/remove employees |
| **Employee** | Send/receive recognition, redeem rewards, view profile |

## Vendor-Branded Login

Each vendor gets a unique login URL:

```
https://yourdomain.com/v/acme-corp    → Acme Corp branded login
https://yourdomain.com/v/globex       → Globex branded login
https://yourdomain.com/                → Default Tokenly login
```

Users who sign up from a vendor page are automatically linked to that vendor as an employee.

## Demo Accounts

| Name | Email | Password |
|------|-------|----------|
| Alex Chen | alex@company.io | alex1234 |
| Maya Patel | maya@company.io | maya1234 |
| Jordan Lee | jordan@company.io | jordan1234 |

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ installed
- [Supabase](https://supabase.com/) project (free tier works)

### Local Development

```bash
# Clone the repo
git clone https://github.com/nravic22/tokenly.git
cd tokenly

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

### Database Setup

Run the SQL migrations in order in your Supabase SQL Editor:

1. `supabase/migrations/001_multi_tenant.sql` — Profiles, vendors, user-vendor roles, RLS policies
2. `supabase/migrations/002_vendor_slug.sql` — Vendor URL slugs
3. `supabase/migrations/003_fix_rls_recursion.sql` — RLS recursion fix

Then make yourself a super admin:

```sql
UPDATE profiles SET platform_role = 'super_admin' WHERE email = 'your@email.com';
```

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nravic22/tokenly)

Add the three environment variables in Vercel project settings before deploying.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Frontend | React 18 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Styling | CSS-in-JS (inline styles) |
| Fonts | DM Sans + Instrument Serif |
| Blockchain | Solana (SPL Tokens) |
| Wallet | Phantom Wallet |
| Hosting | Vercel |

## Project Structure

```
tokenly/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   └── vendors/          # Super Admin vendor CRUD
│   │   ├── auth/
│   │   │   ├── login/            # POST /api/auth/login
│   │   │   └── signup/           # POST /api/auth/signup
│   │   ├── user/
│   │   │   └── vendors/          # User's vendor memberships
│   │   └── vendor/
│   │       ├── employees/        # Vendor employee management
│   │       ├── profile/          # Vendor profile updates
│   │       └── public/[slug]/    # Public vendor branding (no auth)
│   ├── components/
│   │   └── Tokenly.js            # Main app component
│   ├── v/[slug]/                 # Vendor-branded login page
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── lib/
│   ├── auth.js                   # Auth helpers & role checks
│   └── supabase.js               # Supabase client init
├── supabase/
│   └── migrations/               # SQL migrations
├── next.config.js
├── package.json
└── README.md
```

## API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/signup` | POST | Public | Sign up (with optional vendor linking) |
| `/api/auth/login` | POST | Public | Login (returns vendor memberships) |
| `/api/admin/vendors` | GET | Super Admin | List all vendors |
| `/api/admin/vendors` | POST | Super Admin | Create vendor |
| `/api/admin/vendors/:id` | GET | Super Admin | Vendor details + members |
| `/api/admin/vendors/:id` | PATCH | Super Admin | Update/block vendor |
| `/api/admin/vendors/:id` | DELETE | Super Admin | Soft-block vendor |
| `/api/vendor/employees` | GET/POST | Vendor Admin | List/add employees |
| `/api/vendor/employees/:id` | PATCH/DELETE | Vendor Admin | Update/remove employee |
| `/api/vendor/profile` | PATCH | Vendor Admin | Update vendor logo/name |
| `/api/vendor/public/:slug` | GET | Public | Vendor branding for login page |
| `/api/user/vendors` | GET | Authenticated | User's vendor memberships |

## Roadmap

- [x] Supabase-backed auth (login & signup)
- [x] Multi-tenant vendor management
- [x] Super Admin dashboard
- [x] Vendor-branded login pages (`/v/{slug}`)
- [x] User-vendor auto-linking on signup
- [x] Role-based access control (RBAC)
- [x] RLS policies for data isolation
- [x] Dark/light theme
- [x] Mobile responsive layout
- [ ] Subdomain routing (`vendor.tokenly.com`)
- [ ] Solana wallet adapter (@solana/wallet-adapter-react)
- [ ] Real SPL token transfers on devnet
- [ ] Email notifications
- [ ] Vendor admin dashboard

## License

MIT

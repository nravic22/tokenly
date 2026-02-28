# ◎ Tokenly — Crypto Recognition Platform

A **Bonusly-like** peer-to-peer employee recognition platform powered by **Solana SPL tokens**. Built with **Next.js** and ready to deploy on **Vercel**.

![Tokenly](https://img.shields.io/badge/Solana-SPL_Tokens-14F195?style=flat&logo=solana) ![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js) ![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?style=flat&logo=vercel)

## Features

- **Peer-to-Peer Recognition Feed** — Publicly celebrate teammate achievements
- **KUDOS Token System** — Send SPL tokens on Solana as recognition
- **Rewards Catalog** — Redeem tokens for gift cards, swag, crypto, experiences
- **Leaderboard & Analytics** — Track top contributors and recognition trends
- **Dual Authentication** — Email/password with verification + Phantom wallet connect
- **Company Values** — Tag recognitions with organizational values

## Demo Accounts

| Name | Email | Password |
|------|-------|----------|
| Alex Chen | alex@company.io | alex1234 |
| Maya Patel | maya@company.io | maya1234 |
| Jordan Lee | jordan@company.io | jordan1234 |
| Sofia Rodriguez | sofia@company.io | sofia1234 |
| Kai Nakamura | kai@company.io | kai12345 |
| Priya Sharma | priya@company.io | priya1234 |

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ installed
- [Git](https://git-scm.com/) installed

### Local Development

```bash
# Clone the repo
git clone https://github.com/nravic22/tokenly.git
cd tokenly

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

### Option 1: One-Click Deploy (Easiest)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nravic22/tokenly)

### Option 2: Manual Deploy

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
3. Click **"Add New Project"** → Import your `tokenly` repo
4. Click **"Deploy"** — Vercel auto-detects Next.js
5. Your site is live at `https://tokenly.vercel.app`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Frontend | React 18 |
| Styling | CSS-in-JS (inline styles) |
| Fonts | DM Sans + Instrument Serif |
| Blockchain | Solana (SPL Tokens) |
| Wallet | Phantom Wallet |
| Hosting | Vercel |

## Project Structure

```
tokenly/
├── app/
│   ├── components/
│   │   └── Tokenly.js        # Main app component
│   ├── globals.css            # Global styles
│   ├── layout.js              # Root layout + metadata
│   └── page.js                # Home page entry
├── public/                    # Static assets
├── .gitignore
├── next.config.js
├── package.json
└── README.md
```

## Roadmap

- [ ] Supabase integration for real auth & database
- [ ] Solana wallet adapter (@solana/wallet-adapter-react)
- [ ] Real SPL token transfers on devnet
- [ ] The Graph integration for on-chain data indexing
- [ ] Team/department management
- [ ] Admin dashboard
- [ ] Email notifications
- [ ] Mobile responsive improvements

## License

MIT

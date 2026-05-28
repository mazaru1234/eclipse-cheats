# Eclipse Cheats

Premium cheat shop with admin panel, balance system, promo codes, referrals, and AES-256 encrypted license keys.

## Stack

- **Next.js 15** — App Router
- **Drizzle ORM** + **SQLite** (better-sqlite3)
- **AES-256-GCM** — License key encryption at rest
- **JWT** — Session auth
- Dark gaming UI (UI Pro Max style)

## Features

| Feature | Description |
|---------|-------------|
| Admin Panel | Products, categories, keys, promo codes, users, orders |
| Balance System | User wallet + admin adjustments |
| Promo Codes | Percent or fixed discounts |
| Referral System | 5% reward on referred purchases |
| Order Protection | HMAC-SHA256 hash per order |
| License Keys | Bulk import, AES-256 encrypted storage |
| Profile | Orders, balance history, referral link |

## Setup

```bash
npm install
cp .env.example .env
# Edit .env — set AES_SECRET_KEY (64 hex chars) and JWT_SECRET

npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Default admin:**
- Email: `admin@eclipse-cheats.local`
- Password: `ChangeMe123!`

## Admin Workflow

1. Create **categories** → `/admin/categories`
2. Add **products** → `/admin/products`
3. Import **license keys** (one per line) → `/admin/keys`
4. Top up user **balance** → `/admin/users`
5. Create **promo codes** → `/admin/promo-codes`

## Security Notes

- Change admin password and secrets before production
- Keys are never stored in plaintext — only AES-256-GCM ciphertext
- Each order gets a unique protection token + HMAC hash

## Production (eclipse-cheats.ru)

See **[DEPLOY.md](./DEPLOY.md)** for Docker/bare-metal setup, nginx, SSL, Platega webhook, and backups.

Quick checklist:

1. Copy `.env.production.example` → `.env.production`
2. Set `NEXT_PUBLIC_APP_URL=https://eclipse-cheats.ru`
3. Register Platega webhook: `https://eclipse-cheats.ru/api/payments/platega/webhook`
4. `docker compose up -d` or `bash deploy/build-standalone.sh`

# Shopify Integration Manager

An internal agency tool to manage Shopify API connections for multiple client stores.

## Overview

Since January 1, 2026, Shopify no longer allows creating Custom Apps from the store admin. All apps must be created through the [Shopify Partners Dev Dashboard](https://partners.shopify.com). This tool helps you:

- **Calculate required OAuth scopes** based on use case
- **Generate step-by-step Dev Dashboard configuration guides**
- **Manage OAuth flows** (Authorization Code + Client Credentials)
- **Securely store access tokens** in an encrypted vault
- **Monitor multi-client dashboard** with token health alerts

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM + PostgreSQL
- NextAuth.js (Credentials provider)
- AES-256-GCM encryption for tokens

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Shopify Partners account (for Dev Dashboard)

## Setup

### 1. Clone and Install

```bash
git clone <repo>
cd shopify-integration-manager
npm install
```

### 2. Configure Environment Variables

Create a `.env` file (or edit the existing one):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/shopify_integration_manager?schema=public"
NEXTAUTH_SECRET="your-random-secret-key"
NEXTAUTH_URL="http://localhost:3000"
SHOPIFY_CLIENT_ID="your-shopify-client-id"
SHOPIFY_CLIENT_SECRET="your-shopify-client-secret"
ENCRYPTION_KEY="your-32-byte-hex-key"
HOST="http://localhost:3000"
```

**Generate a secure encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Set Up Database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Seed Admin User

```bash
npx tsx prisma/seed.ts
```

Default login:
- Email: `admin@shopify-manager.com`
- Password: `admin123`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How to Create a Shopify App in Dev Dashboard

1. Go to [partners.shopify.com](https://partners.shopify.com) and log in
2. Click **Apps** → **Create app** → **"Create app manually"**
3. Give your app a name (e.g., "Acme Product Sync")
4. Go to **Configuration**:
   - Set **App URL** to your integration manager URL
   - Add **Allowed redirection URL**: `http://localhost:3000/api/shopify/callback`
5. Go to **API Access** → **Configure Admin API integration**
6. Enable the scopes your integration needs
7. Save and install the app on your client's store
8. Reveal the Admin API access token **ONCE** (you cannot see it again)
9. Use the OAuth flow in this dashboard, or paste the token manually

## Features

### Scope Calculator
- 60+ Shopify Admin API scopes organized by business function
- "Select All Read/Write" per category
- Recommended presets: Product Sync, Order Manager, Analytics Only, Full Access, Read-Only

### Dev Dashboard Config Generator
- Step-by-step copy-paste instructions
- Exact OAuth authorization URL
- Warnings for sensitive scopes (read_all_orders, write_, gift_cards, users)

### OAuth Flow Handler
- Authorization Code flow (for client stores)
- Client Credentials flow (machine-to-machine, 24h expiry)
- CSRF protection with state parameter
- Automatic token storage with encryption

### Token Vault
- AES-256-GCM encryption
- Token expiry tracking
- Auto-refresh for Client Credentials tokens
- Revocation support

### Multi-Store Dashboard
- All clients in one view
- Color-coded token health: Green (active), Yellow (expires <24h), Red (expired)
- Quick actions for each store

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/clients | Create client |
| GET | /api/clients | List clients |
| GET | /api/clients/:id | Get client details |
| POST | /api/configs | Create API config |
| GET | /api/configs/:id | Get config details |
| PUT | /api/configs/:id | Update config |
| DELETE | /api/configs/:id | Delete config |
| POST | /api/configs/:id/guide | Generate setup guide |
| GET | /api/configs/:id/guide | Retrieve guide |
| POST | /api/shopify/oauth/start | Start OAuth flow |
| GET | /api/shopify/callback | OAuth callback |
| POST | /api/shopify/token | Store token manually |
| POST | /api/shopify/client-credentials | M2M token fetch |
| GET | /api/configs/:id/token | Get token metadata |
| POST | /api/configs/:id/token/refresh | Refresh token |
| DELETE | /api/configs/:id/token | Revoke token |
| GET | /api/scopes | List all scopes |
| POST | /api/scopes/calculate | Get recommended scopes |

## Security Notes

- **NEVER** commit `.env` to version control
- **NEVER** expose `client_secret` or `access_token` in the frontend
- Tokens are encrypted with AES-256-GCM before database storage
- OAuth state parameter is validated and expires after 10 minutes
- All API routes require authentication

## License

MIT

# Shopify Integration Manager

A **Shopify Embedded App** that helps agencies and developers manage API configurations, OAuth scopes, and access tokens for multiple Shopify client stores.

## What It Does

When installed on a Shopify store, this app:

1. **Automatically receives an access token** from Shopify via OAuth
2. **Calculates required OAuth scopes** for any integration (60+ scopes organized by category)
3. **Generates step-by-step Dev Dashboard setup guides** for client stores
4. **Manages external OAuth flows** for other stores (Authorization Code + Client Credentials)
5. **Securely stores tokens** with AES-256-GCM encryption
6. **Monitors token health** with expiry alerts

## Who It's For

- Agencies managing 5–50+ Shopify clients
- Freelancers tired of manually configuring Custom Apps in the Dev Dashboard
- Developers who need a central place to track scopes, tokens, and API configs

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Prisma ORM** + PostgreSQL
- **Shopify OAuth** (no NextAuth — Shopify handles login)
- **AES-256-GCM** token encryption

## Architecture

```
┌─────────────────────────────────────┐
│         Shopify Admin               │
│  ┌─────────────────────────────┐    │
│  │   Embedded App (iframe)     │    │
│  │  - Dashboard                │    │
│  │  - Scope Calculator         │    │
│  │  - Token Vault              │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
           │
           ▼ Shopify OAuth
┌─────────────────────────────────────┐
│      Your Next.js App               │
│  - /api/auth         (OAuth start)  │
│  - /api/auth/callback (get token)   │
│  - /api/clients      (CRUD)         │
│  - /api/configs      (CRUD)         │
│  - /api/shopify/*    (OAuth flows)  │
└─────────────────────────────────────┘
           │
           ▼ Encrypted
┌─────────────────────────────────────┐
│      PostgreSQL Database            │
│  - ShopifySession (app token)       │
│  - Client (your client stores)      │
│  - ApiConfig (scope selections)     │
│  - Token (encrypted access tokens)  │
└─────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Supabase free tier)
- Shopify Partners account (free)

### 1. Clone and Install

```bash
cd shopify-integration-manager
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
SHOPIFY_API_KEY="your-shopify-app-client-id"
SHOPIFY_API_SECRET="your-shopify-app-client-secret"
SCOPES="read_products,read_orders,read_customers,read_inventory"
DATABASE_URL="postgresql://..."
HOST="http://localhost:3000"
ENCRYPTION_KEY="64-char-hex-string"
```

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Database Setup

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run Locally

```bash
npm run dev
```

### 5. Install on a Development Store

1. Create a Shopify app in [Partners Dashboard](https://partners.shopify.com)
2. Set App URL to `http://localhost:3000`
3. Set redirect URL to `http://localhost:3000/api/auth/callback`
4. Copy Client ID/Secret to `.env`
5. In Partners Dashboard, click "Select store" → "Install on development store"
6. Approve scopes → app opens embedded in Shopify Admin

## Deployment

See [DEPLOY.md](./DEPLOY.md) for full Vercel + Supabase deployment guide.

## Key Features

### Scope Calculator
- 60+ Shopify Admin API scopes
- Organized by business function (Products, Orders, Customers, etc.)
- "Select All Read/Write" per category
- Recommended presets: Product Sync, Order Manager, Analytics Only, Full Access, Read-Only

### Dev Dashboard Config Generator
- Step-by-step copy-paste instructions
- Exact OAuth authorization URL
- Warnings for sensitive scopes (`read_all_orders`, `write_`, `gift_cards`)

### Token Vault
- AES-256-GCM encryption
- Token expiry tracking
- Auto-refresh for Client Credentials flow
- Revocation support

### Multi-Client Dashboard
- All clients in one view
- Color-coded token health (Green/Yellow/Red)
- Quick actions per store

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth?shop=xxx` | Start Shopify OAuth install |
| GET | `/api/auth/callback` | Receive token from Shopify |
| GET/POST | `/api/clients` | List / create clients |
| GET/DELETE | `/api/clients/:id` | Get / delete client |
| POST | `/api/configs` | Create API config |
| GET/PUT/DELETE | `/api/configs/:id` | Manage config |
| POST/GET | `/api/configs/:id/guide` | Generate/retrieve setup guide |
| POST | `/api/shopify/oauth/start` | Start external OAuth |
| GET | `/api/shopify/callback` | External OAuth callback |
| POST | `/api/shopify/token` | Store token manually |
| POST | `/api/shopify/client-credentials` | Machine-to-machine token |
| GET | `/api/scopes` | List all scopes |
| POST | `/api/scopes/calculate` | Get recommended scopes |

## How Shopify Auth Works (No Login Page)

Unlike a regular web app, this uses **Shopify's OAuth**:

1. Merchant clicks "Install" in Shopify Admin
2. Shopify redirects to `/api/auth?shop=mystore.myshopify.com`
3. Your app redirects to Shopify's OAuth approval page
4. Merchant approves the scopes
5. Shopify redirects to `/api/auth/callback?code=...`
6. Your app exchanges the code for an **access token**
7. Token is stored encrypted in the database
8. Merchant sees your app embedded in their Shopify Admin

**No username. No password. No NextAuth.** Shopify handles everything.

## Security

- Tokens encrypted with AES-256-GCM before database storage
- `ENCRYPTION_KEY` never leaves the server
- Shopify session validation on every API request
- CSRF protection via state parameter in OAuth flow
- Never expose access tokens in frontend UI

## License

MIT

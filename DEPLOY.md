# Deployment Guide: Shopify Integration Manager as a Shopify App

This guide deploys your Shopify Integration Manager as a **real Shopify Embedded App** that merchants install from their Shopify admin.

---

## What This App Is Now

| Before | After |
|--------|-------|
| Standalone web app with email/password login | Shopify App — no login needed |
| You manually managed OAuth for each store | Shopify automatically gives the app a token on install |
| App lived outside Shopify | App runs **embedded inside Shopify Admin** |
| You created API configs manually | Same features, but now authenticated via Shopify sessions |

---

## The Architecture

```
Merchant clicks "Install App" in Shopify
        ↓
Shopify redirects to YOUR_APP/api/auth?shop=mystore.myshopify.com
        ↓
Your app redirects to Shopify OAuth approval page
        ↓
Merchant approves the scopes
        ↓
Shopify redirects to YOUR_APP/api/auth/callback?code=xxx
        ↓
Your app exchanges code for access token
        ↓
Token is stored encrypted in your database
        ↓
Merchant sees your app embedded in their Shopify Admin
```

---

## Step 1: Push Code to GitHub

### If you don't have GitHub:
1. Go to https://github.com and sign up
2. Download GitHub Desktop: https://desktop.github.com
3. Install and sign in

### Push your code:

**Using GitHub Desktop (easiest):**
1. Open GitHub Desktop
2. **File** → **Add Local Repository**
3. Browse to: `/Users/roshanreks/Desktop/shopify apiapp/shopify-integration-manager`
4. It says "create a repository" — click that
5. Name: `shopify-integration-manager`
6. Click **Create Repository**
7. Click **Publish Repository** (top right)
8. Keep it **Public**
9. Click **Publish Repository**

---

## Step 2: Create Your Database (Supabase)

1. Go to https://supabase.com and sign up
2. Click **New Project**
3. Name: `shopify-manager-db`
4. **Database Password:** Write this down. You'll need it.
5. Region: Pick closest to you (e.g., `US East`)
6. Click **Create New Project** (wait ~2 minutes)

### Get Your Connection String

1. Click **Connect** (top right)
2. Click **ORMs** → **Prisma**
3. Copy the **Connection String** with port `6543` (the pooling one):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklm.supabase.co:6543/postgres
   ```
4. **Save this** — you'll paste it into Vercel in Step 4

---

## Step 3: Create Your Shopify Partners App

**This is where you get the API keys.**

1. Go to https://partners.shopify.com
2. Sign up (free)
3. Click **Apps** in left sidebar
4. Click **Create app** → **Create app manually**
5. Name: `Integration Manager`
6. Click **Create**

### Configure the App

1. Click **Configuration** on the left
2. **App URL**: `https://shopify-integration-manager-yourname.vercel.app`
   > (Replace with your actual Vercel URL after Step 4 — use placeholder for now)
3. **Allowed redirection URL(s)**: Click **Add URL**
   ```
   https://shopify-integration-manager-yourname.vercel.app/api/auth/callback
   ```
4. Click **Save**

### Get Your Credentials

1. Click **Client credentials** tab
2. Copy **Client ID** → this is `SHOPIFY_API_KEY`
3. Copy **Client secret** → this is `SHOPIFY_API_SECRET`

### Set Your App's Scopes

1. Click **API access** on the left
2. Click **Configure** next to **Admin API access scopes**
3. Enable these scopes (your app needs these to function):
   - `read_products`
   - `read_orders`
   - `read_customers`
   - `read_inventory`
4. Click **Save**

---

## Step 4: Deploy to Vercel

1. Go to https://vercel.com and sign up with GitHub
2. Click **Add New Project**
3. Find `shopify-integration-manager` → click **Import**
4. Framework Preset should auto-detect `Next.js`
5. **DO NOT CLICK DEPLOY YET**

### Add Environment Variables

Click **Environment Variables** and add these ONE BY ONE:

| Name | Value | Where You Got It |
|------|-------|-----------------|
| `DATABASE_URL` | `postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:6543/postgres` | Step 2 |
| `SHOPIFY_API_KEY` | Your Client ID | Step 3, Client credentials tab |
| `SHOPIFY_API_SECRET` | Your Client secret | Step 3, Client credentials tab |
| `SCOPES` | `read_products,read_orders,read_customers,read_inventory` | Step 3, API access tab |
| `HOST` | `https://your-project.vercel.app` | Will be your Vercel URL |
| `ENCRYPTION_KEY` | Generate below | Terminal command below |

**Generate ENCRYPTION_KEY:**
Open Terminal and run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste it as `ENCRYPTION_KEY`.

> **For first deploy:** Use a placeholder for `HOST` like `https://temp.vercel.app`. After deploy, Vercel gives you the real URL. Update `HOST` and redeploy.

6. Click **Deploy**
7. Wait 2-3 minutes

### Get Your Real Vercel URL

After deploy succeeds, Vercel shows you a URL like:
```
https://shopify-integration-manager-abc123.vercel.app
```

### Update Environment Variables with Real URL

1. In Vercel, go to your project → **Settings** → **Environment Variables**
2. Update `HOST` with your real URL
3. Go back to Shopify Partners Dashboard
4. Update **App URL** and **Allowed redirection URL** with your real URL
5. In Vercel, go to **Deployments** → click three dots → **Redeploy**

---

## Step 5: Run Database Migrations

Your app is deployed but database tables don't exist yet.

Open Terminal:

```bash
cd "/Users/roshanreks/Desktop/shopify apiapp/shopify-integration-manager"
```

Temporarily edit `.env` to point at Supabase:
```bash
open -e .env
```
Change `DATABASE_URL` to your Supabase connection string. Save and close.

Run migrations:
```bash
npx prisma migrate deploy
```

This creates all tables (`ShopifySession`, `Client`, `ApiConfig`, `Token`).

Change `.env` back if you want to develop locally.

---

## Step 6: Install the App on a Store

### Option A — Install from Partners Dashboard (Recommended for Testing)

1. In Shopify Partners, go to your app
2. Click **Select store** → **Install on development store**
3. Pick a store (or create one)
4. Approve the scopes
5. You should see your app load inside Shopify Admin!

### Option B — Direct Install Link

Send this link to anyone:
```
https://your-app.vercel.app/api/auth?shop=mystore.myshopify.com
```

Replace `mystore` with their actual store name.

---

## Step 7: Using the App

Once installed and embedded in Shopify Admin:

### Add a Client Store
1. Click **Clients** in the sidebar
2. Click **Add Client**
3. Enter store URL and details
4. Save

### Create an API Configuration
1. Click **New Config**
2. Select the client
3. Pick a preset (Product Sync, Order Manager, etc.) or manually select scopes
4. Click **Create Configuration**

### Get the Setup Guide
1. Click on the config you just created
2. Go to **Setup Guide** tab
3. Click **Generate Setup Guide**
4. Follow the steps — or click **Start OAuth Flow** to authorize automatically

### Token Status
1. Go to **Token Status** tab
2. See if token is active, expired, or needs refresh
3. Click **Refresh Token** or **Revoke Token** as needed

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Invalid redirect_uri" | Make sure `HOST` env var and Shopify Partners redirect URL match EXACTLY |
| "Missing shop parameter" | App must be accessed with `?shop=mystore.myshopify.com` or installed from Partners |
| Build fails on Vercel | Check all 6 environment variables are set |
| Database error | Make sure `DATABASE_URL` uses port `6543` (Supabase pooling) |
| "Unauthorized" on API calls | Store hasn't installed the app or session expired — reinstall |
| App shows "Install" page inside Shopify | The `shop` parameter wasn't passed — Shopify should always pass it |

---

## Cost

| Service | Free Tier | Your Usage |
|---------|-----------|------------|
| **Vercel** | 100GB bandwidth, serverless | ~1-5GB/month |
| **Supabase** | 500MB database, 2GB bandwidth | ~50-100MB |
| **Shopify Partners** | Unlimited dev stores | Free |

**Total: $0/month** for up to ~50 clients.

---

## File Structure You Should Know

```
src/app/api/auth/route.ts              ← Shopify OAuth start
src/app/api/auth/callback/route.ts     ← Shopify OAuth callback (receives token)
src/lib/shopify-context.tsx            ← Detects Shopify iframe context
src/lib/session-storage.ts             ← Saves sessions to database
src/lib/shopify-session.ts             ← Validates Shopify requests
src/app/install/page.tsx               ← Manual install page
src/app/dashboard/                     ← Your app UI
prisma/schema.prisma                   ← Database schema
```

---

## What's Different From a Regular Web App?

| Feature | Regular App | Shopify App (This) |
|---------|------------|-------------------|
| Login | Email/password | Shopify OAuth |
| Who authenticates | Your app | Shopify |
| Where it runs | Browser tab | Inside Shopify Admin iframe |
| How you get API access | Manual OAuth setup | Automatic on install |
| Session storage | JWT cookie | Encrypted database |
| User identity | Your database | Shopify's user |

---

## Need Help?

- **Shopify App Bridge docs**: https://shopify.dev/docs/api/app-bridge
- **Shopify OAuth docs**: https://shopify.dev/docs/apps/build/authentication-authorization
- **This app's API routes**: See `src/app/api/` folder

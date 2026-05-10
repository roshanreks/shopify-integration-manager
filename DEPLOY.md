# Deployment Guide: Vercel + Supabase

This guide will deploy your Shopify Integration Manager to the internet in ~15 minutes.

## The Stack

| Service | What It Does | Why We Use It | Cost |
|---------|-------------|---------------|------|
| **Vercel** | Hosts your Next.js app | One-click deploy, automatic scaling, free SSL | Free tier |
| **Supabase** | PostgreSQL database + auth | Managed Postgres, free tier, works from anywhere | Free tier |
| **Shopify Partners** | OAuth app credentials | Required for Shopify API access | Free |

---

## Step 1: Create a GitHub Repo (Required for Vercel)

Vercel deploys from GitHub. You need to push your code there first.

### If you don't have a GitHub account:
1. Go to https://github.com and sign up
2. Download GitHub Desktop: https://desktop.github.com
3. Install and sign in

### Push your code to GitHub:

**Option A — Using GitHub Desktop (Easiest):**
1. Open GitHub Desktop
2. Click **File** → **Add Local Repository**
3. Browse to: `/Users/roshanreks/Desktop/shopify apiapp/shopify-integration-manager`
4. It will say "create a repository" — click that
5. Fill in:
   - Name: `shopify-integration-manager`
   - Description: `Internal tool for managing Shopify API connections`
6. Click **Create Repository**
7. Click **Publish Repository** (top right)
8. Keep it **public** (Vercel free tier works best with public repos)
9. Click **Publish**

**Option B — Using Terminal:**

```bash
# Go to your project folder
cd "/Users/roshanreks/Desktop/shopify apiapp/shopify-integration-manager"

# Create a GitHub repo via command line (install gh first if needed)
# Or just use GitHub Desktop above
```

---

## Step 2: Create Your Supabase Database

Supabase gives you a free PostgreSQL database that works from anywhere.

1. Go to https://supabase.com and sign up (use your Google/GitHub account)
2. Click **New Project**
3. Fill in:
   - Name: `shopify-manager-db`
   - Database Password: **Write this down** — you'll need it
   - Region: Pick the one closest to you (e.g., `US East`)
4. Click **Create New Project** (takes ~2 minutes)

### Get Your Database Connection String

1. Once the project is ready, click the **Connect** button (top right)
2. Click **ORMs**
3. Click **Prisma**
4. Copy the **Connection String** that looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklm.supabase.co:5432/postgres
   ```
5. **Save this somewhere** — you'll paste it into Vercel later

### Enable Pooling (Required for Vercel)

1. In Supabase, go to **Database** (left sidebar)
2. Click **Connection Pooling**
3. Make sure it's **enabled**
4. Copy the **Connection String** from the pooling section — it uses port `6543` instead of `5432`
5. This is the URL you'll use for `DATABASE_URL`

---

## Step 3: Deploy to Vercel

1. Go to https://vercel.com and sign up (use your GitHub account)
2. Click **Add New Project**
3. Find your `shopify-integration-manager` repo and click **Import**
4. On the configure screen:
   - Framework Preset: `Next.js` (should auto-detect)
   - Root Directory: `./` (leave as is)
5. **DO NOT CLICK DEPLOY YET** — click **Environment Variables** to expand it

### Add Environment Variables

Click **Add** for each of these:

| Variable Name | Value | Where You Got It |
|--------------|-------|-----------------|
| `DATABASE_URL` | Your Supabase pooling connection string | Step 2 above |
| `NEXTAUTH_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | Run in Terminal |
| `NEXTAUTH_URL` | Will be `https://your-project.vercel.app` | After first deploy, update this |
| `SHOPIFY_CLIENT_ID` | From Shopify Partners | Step 4 below |
| `SHOPIFY_CLIENT_SECRET` | From Shopify Partners | Step 4 below |
| `ENCRYPTION_KEY` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | Run in Terminal (different from NEXTAUTH_SECRET) |
| `HOST` | Same as `NEXTAUTH_URL` | `https://your-project.vercel.app` |

> **IMPORTANT:** For the first deploy, use a placeholder for `NEXTAUTH_URL` and `HOST` like `https://temp.vercel.app`. After the first deploy, Vercel will give you the real URL. Then you MUST update these two variables with the real URL and **Redeploy**.

6. Click **Deploy**
7. Wait 2-3 minutes for the build

---

## Step 4: Create Your Shopify Partners App

You need a Shopify Partners account to create apps. This is where you get `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET`.

1. Go to https://partners.shopify.com
2. Sign up (it's free)
3. Click **Apps** in the left sidebar
4. Click **Create app** → **Create app manually**
5. Name it: `Integration Manager` (or whatever you want)
6. Click **Create**

### Configure Your App

1. Click **Configuration** on the left
2. **App URL**: Paste your Vercel URL, e.g.:
   ```
   https://shopify-integration-manager.vercel.app
   ```
3. **Allowed redirection URL(s)**: Click **Add URL** and paste:
   ```
   https://shopify-integration-manager.vercel.app/api/shopify/callback
   ```
   > Replace `shopify-integration-manager` with your actual Vercel project name
4. Click **Save**

### Get Your Credentials

1. Click **Client credentials** tab (next to Configuration)
2. Copy **Client ID** → this is your `SHOPIFY_CLIENT_ID`
3. Copy **Client secret** → this is your `SHOPIFY_CLIENT_SECRET`

### Update Vercel Environment Variables

1. Go back to https://vercel.com
2. Click your project
3. Click **Settings** → **Environment Variables**
4. Update:
   - `SHOPIFY_CLIENT_ID` → paste the real Client ID
   - `SHOPIFY_CLIENT_SECRET` → paste the real Client Secret
   - `NEXTAUTH_URL` → paste your real Vercel URL
   - `HOST` → paste your real Vercel URL
5. Click **Save**
6. Go to **Deployments** tab
7. Click the three dots on your latest deploy → **Redeploy**

---

## Step 5: Run Database Migrations on Supabase

Your app is deployed but the database is empty. You need to create the tables.

### Option A — Using Supabase SQL Editor (Easiest)

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Run this SQL to create tables:

```sql
-- Run prisma migrate via connection
-- OR use the Supabase CLI if you have it installed
```

Actually, the easiest way is to run Prisma from your local computer pointing at Supabase:

### Option B — Run From Your Local Computer

1. Open Terminal
2. Go to your project:
   ```bash
   cd "/Users/roshanreks/Desktop/shopify apiapp/shopify-integration-manager"
   ```
3. Edit your `.env` file temporarily to point to Supabase:
   ```bash
   open -e .env
   ```
   Change `DATABASE_URL` to your Supabase pooling connection string
4. Run:
   ```bash
   npx prisma migrate deploy
   ```
   This creates all tables in your Supabase database
5. Run:
   ```bash
   npx tsx prisma/seed.ts
   ```
   This creates your admin login user
6. Change `.env` back to local database if you want to keep developing locally

---

## Step 6: Test Your Deployed App

1. Go to your Vercel URL: `https://your-project.vercel.app`
2. You should see the login page
3. Log in with:
   - Email: `admin@shopify-manager.com`
   - Password: `admin123`
4. You should see the Dashboard!

---

## Step 7: Your Day-to-Day Workflow

Now that it's live, here's how you use it for each client:

### Adding a New Client Store

1. Log into your deployed app
2. Click **Clients** → **Add Client**
3. Enter their store URL (e.g., `mystore.myshopify.com`)
4. Click **Create**

### Creating an API Configuration

1. Click **New Config** next to the client
2. Name it (e.g., "Product Sync")
3. Pick a preset or select scopes manually
4. Click **Create Configuration**

### Getting the Token (OAuth Flow)

1. On the Config Detail page, click **Setup Guide**
2. Click **Generate Setup Guide**
3. Follow the steps in the guide to configure your Shopify app in the Dev Dashboard
4. Click **Start OAuth Flow**
5. Approve the app on the client's store
6. The token is automatically saved encrypted in your database

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails on Vercel | Check that all environment variables are set |
| "Database connection failed" | Make sure you used the **pooling** connection string from Supabase (port 6543) |
| OAuth callback fails | Make sure `HOST` and `NEXTAUTH_URL` match your real Vercel URL |
| Can't login after deploy | Make sure you ran `npx tsx prisma/seed.ts` against your Supabase database |
| "Invalid redirect_uri" from Shopify | Make sure the callback URL in Shopify Partners matches exactly: `https://YOUR-URL.vercel.app/api/shopify/callback` |

---

## Cost Summary

| Service | Free Tier Limits | Your Usage |
|---------|-----------------|------------|
| **Vercel** | 100GB bandwidth, 10s serverless functions | You'll use ~1-5GB/month |
| **Supabase** | 500MB database, 2GB bandwidth | You'll use ~50-100MB |
| **Shopify Partners** | Unlimited dev stores | Free forever |

**Total monthly cost: $0** for up to ~50 clients.

---

## Want to Add More Features Later?

- **Auto-refresh tokens** → I can add a cron job
- **PDF onboarding guide** → I can add a PDF generator for clients
- **Email notifications** → I can add email alerts for expiring tokens
- **Multiple team members** → I can add user registration/invites

Just ask!

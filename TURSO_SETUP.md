# Turso Setup for Vercel (Required)

**You cannot deploy SQLite (`job_applications.db`) to Vercel.** Vercel serverless has no persistent disk, so the database file is lost on every deploy. Login works without a database, but all email/data APIs need **Turso** (free cloud SQLite).

## Step 1: Create a Turso account & database

1. Go to **[https://turso.tech](https://turso.tech)** and sign up (free).
2. Click **Create Database**.
3. Name it e.g. `jobapply` and pick a region close to you.
4. Open the database → copy the **Database URL**  
   Example: `libsql://jobapply-yourname.aws-ap-south-1.turso.io`
5. Go to **Tokens** (or "Create Token") → create a token and copy it.

## Step 2: Add env vars on Vercel

1. Open [Vercel Dashboard](https://vercel.com) → your project **apply-job-zeta**
2. **Settings** → **Environment Variables**
3. Add these for **Production** (and Preview if you use it):

| Name | Value |
|------|-------|
| `TURSO_DATABASE_URL` | `libsql://jobapply-yourname....turso.io` |
| `TURSO_AUTH_TOKEN` | your token from step 1 |

4. Click **Save**.

## Step 3: Redeploy

Env vars only apply after redeploy:

- **Deployments** → latest deployment → **⋯** → **Redeploy**

Or push a new commit to trigger deploy.

## Step 4: Verify

After login, open in browser:

```
https://apply-job-zeta.vercel.app/api/health/db
```

**Success:**
```json
{ "ok": true, "applicationCount": 0, "tursoConfigured": true }
```

**Still broken:**
```json
{ "ok": false, "message": "Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN on Vercel." }
```

## Step 5: Migrate existing local data (optional)

If you have data in local `job_applications.db`:

1. Add the same Turso vars to `.env.local`:
   ```env
   TURSO_DATABASE_URL=libsql://...
   TURSO_AUTH_TOKEN=...
   ```
2. Run locally:
   ```bash
   npm run migrate:turso
   ```

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Env vars only in Development | Set for **Production** on Vercel |
| Forgot to redeploy after adding vars | Redeploy the project |
| Wrong URL format | Use `libsql://...` from Turso dashboard |
| Missing token | Both URL **and** token are required |

## Why login works but APIs fail

| Route | Uses database? |
|-------|----------------|
| `/api/auth/login` | No — only checks access key + JWT |
| `/api/emails/*` | Yes — needs Turso |
| `/api/excel/export` | Yes — needs Turso |

That is why you can sign in but get 500 on everything else.

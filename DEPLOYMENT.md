# Deployment Guide (Vercel + Turso)

This app requires authentication and a remote database before public deployment.

## 1. Authentication setup

Copy [`.env.example`](.env.example) to `.env.local` and set:

```env
APP_ACCESS_KEYS=your-secret-key-1,another-key-for-someone-else
JWT_SECRET=generate-a-random-string-at-least-32-characters-long
JWT_EXPIRES_IN=7d
```

- **APP_ACCESS_KEYS**: Comma-separated access keys. Anyone with a valid key can sign in (no signup page).
- **JWT_SECRET**: Used to sign session tokens. Must be at least 32 characters. Keep it separate from access keys.
- **JWT_EXPIRES_IN**: Optional. Default `7d` (also supports `24h`, `30m`, etc.).

### How auth works

1. User visits `/login` and enters an access key.
2. Server validates the key against `APP_ACCESS_KEYS` (constant-time comparison).
3. On success, an `httpOnly` JWT cookie is set (`SameSite=Strict`, `Secure` in production).
4. [middleware.js](middleware.js) protects all pages, API routes, and static files under `/public`.
5. Use **Logout** in the app header to clear the session.

## 2. Turso database setup

Local SQLite does not persist on Vercel serverless. Use [Turso](https://turso.tech) for production.

### Create a Turso database

```bash
# Install Turso CLI: https://docs.turso.tech/cli
turso db create jobapply
turso db show jobapply --url
turso db tokens create jobapply
```

Add to `.env.local` and Vercel:

```env
TURSO_DATABASE_URL=libsql://your-db-name-your-org.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
```

For **local development without Turso**, omit these vars — the app falls back to `file:job_applications.db` in the project root.

### Migrate existing SQLite data

If you have data in `job_applications.db`:

```bash
npm run migrate:turso
```

This copies all rows into Turso (skips duplicates).

## 3. Email environment variables

Set in Vercel (same as local):

```env
SENDGRID_API_KEY=...
EMAIL_FROM=...
GMAIL_USER=...           # optional
GMAIL_APP_PASSWORD=...   # optional
```

## 4. Deploy to Vercel

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add **all** environment variables from `.env.example` in Project Settings → Environment Variables.
4. Deploy.

### Required Vercel env vars checklist

| Variable | Required |
|----------|----------|
| `APP_ACCESS_KEYS` | Yes |
| `JWT_SECRET` | Yes |
| `TURSO_DATABASE_URL` | Yes (production) |
| `TURSO_AUTH_TOKEN` | Yes (production) |
| `SENDGRID_API_KEY` | Yes (for SendGrid) |
| `EMAIL_FROM` | Yes |
| `GMAIL_USER` | Optional |
| `GMAIL_APP_PASSWORD` | Optional |
| `JWT_EXPIRES_IN` | Optional |

## 5. Verify after deploy

- [ ] Visiting `/` redirects to `/login` when not signed in
- [ ] Invalid access key shows a generic error
- [ ] Valid key grants access to the main app
- [ ] API calls without a cookie return `401`
- [ ] Data persists after adding emails (Turso connected)
- [ ] Excel export downloads without errors
- [ ] Logout returns you to `/login`

## Security notes

- Never commit `.env.local` or access keys to git.
- Use long, unique values for each key in `APP_ACCESS_KEYS`.
- Rotate `JWT_SECRET` if compromised (this invalidates all active sessions).
- Static files (e.g. `/prashant.pdf`) are protected by middleware — they require a valid session.

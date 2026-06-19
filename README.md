# AGTRENZ UI

React + TypeScript + Vite frontend for the AGTRENZ marketplace, seller dashboard, and admin dashboard.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## Vercel Deployment (recommended)

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import GitHub repo **`Amal-Joseph99/tnz`**
3. Vercel auto-detects **Vite** — confirm:

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Output directory | `dist` |

4. **Environment variables** (Production):

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SITE_URL=https://www.shopncart.store
```

5. Click **Deploy** — every push to `main` auto-deploys.

6. **Custom domain** (Vercel → Project → **Settings** → **Domains**):
   - Add `www.shopncart.store`
   - Add `shopncart.store` (Vercel redirects apex → www)

7. **Hostinger DNS** (switch nameservers back to **Hostinger default** if you moved to Cloudflare):

| Type | Name | Value |
|------|------|-------|
| CNAME | `www` | `cname.vercel-dns.com` (Vercel shows exact target) |

For apex `shopncart.store`, use the A record Vercel provides, or redirect at Hostinger to `www`.

SPA routing is handled by `vercel.json`.

## Environment Variables

Use `.env.example` as the local template.

## Supabase Note

Seller/admin login expects Supabase auth plus a backend role resolver RPC named `get_staff_role`.
Admin accounts must be created from the backend/database only, not from frontend signup.

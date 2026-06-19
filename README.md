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

## AWS Amplify Deployment

This repo includes `amplify.yml`. Connect GitHub in the Amplify console.

1. [AWS Amplify Console](https://ap-southeast-1.console.aws.amazon.com/amplify/home?region=ap-southeast-1) → **Create new app** → **Host web app** → GitHub → **`Amal-Joseph99/tnz`** → branch **`main`**
2. Amplify reads `amplify.yml` automatically:

| Setting | Value |
|---------|-------|
| Build | `npm ci` → `npm run build` |
| Output | `dist` |

3. **Environment variables** (Amplify → App settings → Environment variables):

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SITE_URL=https://main.d13h6a6205mdyf.amplifyapp.com
```

4. **SPA rewrite** (Amplify → App settings → Rewrites and redirects):

| Source | Target | Type |
|--------|--------|------|
| `</^[^.]+$\|\.(?!(css\|gif\|ico\|jpg\|js\|png\|txt\|svg\|woff\|woff2\|ttf\|map\|json\|webp)$)([^.]+$)/>` | `/index.html` | 200 (Rewrite) |

Or simpler rule already used on this app:

| Source | Target | Type |
|--------|--------|------|
| `/<*>` | `/index.html` | 404-200 |

5. **Custom domain (not on Amplify)** — `shopncart.store` / `www` are locked on another AWS account’s CloudFront. Use **Hostinger redirects** to the Amplify default URL instead:

   **Target:** `https://main.d13h6a6205mdyf.amplifyapp.com`

   1. In **Hostinger hPanel** → **Domains** → `shopncart.store` → **DNS / Nameservers**
   2. Set nameservers back to **Hostinger** (not Cloudflare). Current public NS must be Hostinger before redirects work.
   3. **Domains** → **Redirects** (not basic “Forward domain” — that often breaks HTTPS and drops paths)
   4. Create **301** redirects with **path preserved**:
      - `shopncart.store` → `https://main.d13h6a6205mdyf.amplifyapp.com`
      - `www.shopncart.store` → `https://main.d13h6a6205mdyf.amplifyapp.com`
   5. If **Redirects** is unavailable (domain-only plan), use **Forward domain** as a temporary fallback — note that HTTPS visitors may see a certificate warning until you add a Hostinger hosting plan or use path-aware redirects.

   Visitors will see the `amplifyapp.com` URL in the browser after redirect. Product/share links in the app use `VITE_SITE_URL` (`https://shopncart.store`) so paths like `/product/123` still work when redirects preserve the path.

6. **Live URLs**
   - App (served): `https://main.d13h6a6205mdyf.amplifyapp.com`
   - Public entry (redirect): `https://shopncart.store` and `https://www.shopncart.store`

## Environment Variables

Use `.env.example` as the local template.

## Supabase Note

Seller/admin login expects Supabase auth plus a backend role resolver RPC named `get_staff_role`.
Admin accounts must be created from the backend/database only, not from frontend signup.

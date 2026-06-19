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
VITE_SITE_URL=https://store.shopncart.store
```

4. **SPA rewrite** (Amplify → App settings → Rewrites and redirects):

| Source | Target | Type |
|--------|--------|------|
| `</^[^.]+$\|\.(?!(css\|gif\|ico\|jpg\|js\|png\|txt\|svg\|woff\|woff2\|ttf\|map\|json\|webp)$)([^.]+$)/>` | `/index.html` | 200 (Rewrite) |

Or simpler rule already used on this app:

| Source | Target | Type |
|--------|--------|------|
| `/<*>` | `/index.html` | 404-200 |

5. **Custom domain** (Amplify → Hosting → Custom domains):
   - Use **`store.shopncart.store`** (works on your AWS account)
   - `www.shopncart.store` is blocked by another AWS account’s CloudFront — use **Hostinger redirect** `www` → `store.shopncart.store` until that is cleared

6. **Live URLs**
   - Default: `https://main.d13h6a6205mdyf.amplifyapp.com`
   - Custom: `https://store.shopncart.store` (after DNS is connected)

## Environment Variables

Use `.env.example` as the local template.

## Supabase Note

Seller/admin login expects Supabase auth plus a backend role resolver RPC named `get_staff_role`.
Admin accounts must be created from the backend/database only, not from frontend signup.

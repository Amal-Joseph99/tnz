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

The production output is generated in `dist`.

## Cloudflare Pages Deployment

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select this repository and use:

| Setting | Value |
|---------|-------|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js version | 20 (or latest LTS) |

3. **Environment variables** (Production):

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SITE_URL=https://www.shopncart.store
```

4. **Custom domains** (Pages → your project → **Custom domains**):

- `www.shopncart.store`
- `shopncart.store` (redirect to `www` in Cloudflare if offered)

5. **DNS** (Hostinger nameservers → Cloudflare, or DNS only in Cloudflare):

| Type | Name | Content |
|------|------|---------|
| CNAME | `www` | `<your-project>.pages.dev` (Cloudflare shows exact target) |
| Redirect | `@` | `https://www.shopncart.store` |

SPA routing is handled by `public/_redirects` (copied to `dist` on build).

### Cloudflare build settings (important)

Your Cloudflare **Workers Builds** job may still be using the old deploy command. That makes every push **build** but **fail on deploy**.

In Cloudflare → **Workers & Pages** → **agtrenz** → **Settings** → **Build**:

| Setting | Correct value |
|---------|----------------|
| Production branch | `main` |
| Build command | `npm run build` |
| Deploy command | `npm run deploy` |

**Delete** the environment variable `CLOUDFLARE_API_TOKEN` from Cloudflare project settings if you added it manually — it breaks deploy auth.

### GitHub Actions auto-deploy (recommended)

This repo includes `.github/workflows/deploy-cloudflare.yml`. Add these **GitHub repository secrets** (Settings → Secrets → Actions):

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with **Workers Scripts:Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | `57cfd6f54a4c2fe8358748a00e679a2f` |
| `VITE_SUPABASE_URL` | your Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | your Supabase anon key |

Create token: [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) → Create Token → **Edit Cloudflare Workers** template.

After secrets are saved, every push to `main` deploys automatically via GitHub Actions.

## Environment Variables

Use `.env.example` as the local template.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SITE_URL=https://www.shopncart.store
```

## Supabase Note

Seller/admin login expects Supabase auth plus a backend role resolver RPC named `get_staff_role`.
Admin accounts must be created from the backend/database only, not from frontend signup.

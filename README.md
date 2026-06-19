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

**Option A — recommended (Pages Git, no Wrangler deploy):**

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Deploy command | *(leave empty)* |

**Option B — if Cloudflare requires a deploy command:**

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Deploy command | `npm run pages:deploy` |

`wrangler.toml` must be committed (`name = "agtrenz"` must match your Pages project name in Cloudflare).

If deploy fails with "Missing Pages project name", either push `wrangler.toml` or use:
`npx wrangler pages deploy dist --project-name agtrenz`

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

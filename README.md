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

## AWS Amplify Deployment

This repository includes `amplify.yml` for Amplify Hosting.

Amplify build settings:

- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`

## Environment Variables

Add these variables in AWS Amplify:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Use `.env.example` as the local template.

## Required SPA Rewrite

Because this app uses URL-based React routing, add this rewrite rule in AWS Amplify Hosting:

- Source address: `</^[^.]+$/>`
- Target address: `/index.html`
- Type: `200 (Rewrite)`

This is required for direct browser access to routes like:

- `/seller/dashboard`
- `/seller/profile`
- `/seller/products`
- `/admin/dashboard`
- `/buyer/signin`

## Supabase Note

Seller/admin login expects Supabase auth plus a backend role resolver RPC named `get_staff_role`.
Admin accounts must be created from the backend/database only, not from frontend signup.

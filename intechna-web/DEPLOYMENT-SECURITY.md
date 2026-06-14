# Deployment security checklist

## Required before public hosting

1. Set admin credentials in hosting environment variables:
   - `ADMIN_USER`
   - `ADMIN_PASSWORD` — use a long random password, at least 16-24 characters.
2. Keep `/admin` and `/api/admin/*` protected. If the variables are missing, admin is disabled with HTTP 503.
3. Use HTTPS only on production.
4. Do not commit `.env.local` or real passwords.
5. Store product datasheets/images under `public/uploads`; only upload trusted image/PDF files. Current limits: image <= 3MB, PDF <= 10MB; SVG is intentionally not allowed.
6. Security headers are enabled globally: CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy.
7. If admin editing is needed on production, use server hosting that supports Next.js API routes. Static-only hosting will not support the admin APIs.
7. After deployment, test:
   - `/admin` asks for login.
   - Wrong password returns 401.
   - `/robots.txt` disallows `/admin/` and `/api/admin/`.
   - `/sitemap.xml` does not include admin/API URLs.

## Current known item

`npm audit --omit=dev` reports a moderate PostCSS advisory through Next.js. Do **not** run `npm audit fix --force` because it proposes downgrading/breaking Next. Update Next.js normally when a patched stable version is available.

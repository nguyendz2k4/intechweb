# Intechna.vn security and operational risk assessment

## Current status

Checked against these risk groups:

1. Account/admin takeover
2. Data exposure
3. Malicious code/content injection
4. Outage or loss of access
5. SEO/reputation damage
6. Legal/compliance risk

## Risk matrix

| Risk group | Current level | What is already done | Remaining actions before production |
|---|---:|---|---|
| Admin takeover | Medium | `/admin` and `/api/admin/*` protected by Basic Auth using `ADMIN_USER` + `ADMIN_PASSWORD`; admin disabled if env is missing; no-store/noindex headers. | Use strong unique password; restrict admin by Cloudflare/WAF rule if possible; enable 2FA on hosting/domain/Cloudflare accounts; rotate password when handing over. |
| Data exposure | Low-Medium | No real secrets committed; `.env.example` only; `.gitignore` ignores `*.local`; sitemap excludes admin/API. | Never commit `.env.local`; keep hosting env vars private; backup `data/` and `public/uploads/`; avoid uploading confidential datasheets unless approved. |
| Malware/content injection | Medium | Upload API only accepts image/PDF MIME; SVG blocked; image <= 3MB, PDF <= 10MB; CSP/security headers enabled. | Only allow trusted admins; scan PDF/images before upload where possible; consider Cloudflare WAF + antivirus/malware scanning if uploads become public/customer-submitted. |
| Outage/loss of access | Medium | Next.js build passes; admin docs added; deployment checklist exists. | Use production hosting with rollback; backup before deploy; keep domain/hosting owner account documented; monitor uptime; do not rely on one person/device for credentials. |
| SEO/reputation | Low | Metadata/canonical/sitemap/robots present; `/admin` and `/api/admin` disallowed; JSON-LD present; security headers added. | Re-run Lighthouse/PageSpeed after real HTTPS deploy; submit sitemap to Google Search Console; avoid duplicate staging domains being indexed. |
| Legal/compliance | Medium | Contact/company info visible; datasheet download feature supports official product files. | Only use datasheets/images with rights to publish; add Privacy Policy/Terms if collecting form data; state company info accurately; avoid fake project/customer claims. |

## Minimum production baseline

- HTTPS enforced.
- Cloudflare proxy enabled for `intechna.vn` and `www.intechna.vn`.
- WAF/rate limiting for `/admin*` and `/api/admin*`.
- Strong `ADMIN_USER`/`ADMIN_PASSWORD` stored only in hosting environment variables.
- Hosting/domain/Cloudflare accounts protected by 2FA.
- Weekly backup for `data/` and `public/uploads/`; keep at least 4 recent copies.
- Source code stored in a private Git repository with owner access documented.
- Deployment has rollback or previous build restore.
- Sitemap submitted after launch.

## Cloudflare/WAF recommended rules

1. Force HTTPS: Always Use HTTPS + Automatic HTTPS Rewrites.
2. WAF custom rule: challenge or block `/admin*` and `/api/admin*` except trusted country/IP if possible.
3. Rate limit admin/API paths.
4. Enable Bot Fight Mode or equivalent bot protection.
5. Cache static assets only; do not cache `/admin*` or `/api/admin*`.

## Account handover checklist

- Domain registrar account + 2FA recovery method.
- Cloudflare account + zone access.
- Hosting account + deployment project.
- Git repository owner/admin access.
- Environment variables: names documented, values delivered through a secure channel only.
- Admin URL and credentials delivered separately.
- Backup location and restore steps.
- DNS records exported or screenshotted.
- Contact email/phone ownership confirmed.

## Known dependency item

`npm audit --omit=dev` currently reports a moderate PostCSS advisory through Next.js. Do not run `npm audit fix --force` because it suggests a breaking downgrade. Track Next.js stable updates and upgrade normally when patched.

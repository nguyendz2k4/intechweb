# Intechna.vn handover checklist

## 1. Source code

- Repository URL:
- Main branch:
- Deployment branch:
- Last tested commit/build:
- Node.js version:
- Build command: `npm run build`
- Start command: `npm run start`

## 2. Hosting

- Provider:
- Project/app name:
- Login owner:
- 2FA enabled: Yes/No
- Deployment method: Git / CLI / Manual
- Rollback method:
- Server region:

## 3. Environment variables

Do not write real passwords in this file. Store values in a password manager.

- `ADMIN_USER`
- `ADMIN_PASSWORD`

## 4. Domain/DNS

- Domain: `intechna.vn`
- Registrar:
- Nameserver provider:
- DNS records exported: Yes/No
- Cloudflare proxy enabled: Yes/No
- HTTPS forced: Yes/No

## 5. Admin access

- Admin URL: `/admin`
- Admin owner:
- Password delivery method:
- Password rotation date:
- Who can add/edit/delete content:

## 6. Content and upload data

- Admin content directory: `data/`
- Uploaded images: `public/uploads/images/`
- Uploaded datasheets: `public/uploads/datasheets/`
- Upload limits: image <= 3MB, PDF <= 10MB
- Backup schedule:
- Restore test date:

## 7. SEO launch checklist

- `/robots.txt` checked.
- `/sitemap.xml` checked.
- Google Search Console property created.
- Sitemap submitted.
- Main pages indexed check after launch.
- Staging/preview domains noindexed if public.

## 8. Legal/content ownership

- Product images have permission to publish.
- Datasheets are official/public or approved.
- Company address/phone/email verified.
- Privacy Policy added if forms store personal data.
- No fake customer/project claims.

## 9. Incident response

If admin is suspected compromised:

1. Change `ADMIN_PASSWORD` immediately in hosting env.
2. Redeploy/restart app.
3. Review changed files in `data/` and `public/uploads/`.
4. Restore from last clean backup if needed.
5. Rotate hosting/Git/Cloudflare passwords if broader compromise is suspected.

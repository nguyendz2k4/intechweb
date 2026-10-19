import './load-env.mjs'
import { mysqlOptions } from '../app/lib/db/mysql-client.mjs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
export function productionPreflight(env) {
  const missing = [],
    warnings = []
  const mfaRequired = env.ADMIN_MFA_REQUIRED !== 'false'
  const directPassword = !mfaRequired && Boolean(env.ADMIN_USER || env.ADMIN_PASSWORD)
  if (env.ADMIN_MFA_REQUIRED !== undefined && !['true', 'false'].includes(env.ADMIN_MFA_REQUIRED))
    missing.push('ADMIN_MFA_REQUIRED: trueOrFalse')
  for (const name of [
    'NEXT_PUBLIC_SITE_URL',
    'ADMIN_SESSION_SECRET',
    ...(mfaRequired ? ['ADMIN_CREDENTIAL_ENCRYPTION_KEY'] : []),
    'ADMIN_TRUSTED_ORIGINS',
    ...(!directPassword ? ['ADMIN_ACCOUNTS_JSON'] : []),
    'HEALTHCHECK_TOKEN',
  ])
    if (!env[name]) missing.push(name)
  for (const name of [
    'ADMIN_SESSION_SECRET',
    ...(mfaRequired ? ['ADMIN_CREDENTIAL_ENCRYPTION_KEY'] : []),
    'HEALTHCHECK_TOKEN',
  ])
    if (env[name] && Buffer.byteLength(env[name]) < 32) missing.push(`${name}: minimum32bytes`)
  try {
    mysqlOptions({ ...env, NODE_ENV: 'production' })
  } catch {
    missing.push('DATABASE: validMySQLConfiguration')
  }
  try {
    const site = new URL(env.NEXT_PUBLIC_SITE_URL ?? '')
    if (
      site.protocol !== 'https:' ||
      site.username ||
      site.password ||
      site.pathname !== '/' ||
      site.search ||
      site.hash ||
      site.hostname === 'website.example'
    )
      missing.push('NEXT_PUBLIC_SITE_URL: customerHTTPSOrigin')
  } catch {
    missing.push('NEXT_PUBLIC_SITE_URL: customerHTTPSOrigin')
  }
  const ttl = Number(env.ADMIN_SESSION_TTL_SECONDS ?? 3600)
  if (!Number.isInteger(ttl) || ttl < 900 || ttl > 86400)
    missing.push('ADMIN_SESSION_TTL_SECONDS: 900to86400')
  if (env.ADMIN_ENABLED === 'false') warnings.push('ADMIN_ENABLED: administration disabled')
  try {
    const origins = (env.ADMIN_TRUSTED_ORIGINS ?? '').split(',').filter(Boolean)
    if (
      !origins.length ||
      origins.some((origin) => {
        const url = new URL(origin.trim())
        return (
          url.protocol !== 'https:' ||
          url.username ||
          url.password ||
          url.pathname !== '/' ||
          url.search ||
          url.hash
        )
      })
    )
      missing.push('ADMIN_TRUSTED_ORIGINS: validHTTPS')
  } catch {
    missing.push('ADMIN_TRUSTED_ORIGINS: validHTTPS')
  }
  if (directPassword) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.@-]{2,79}$/.test(env.ADMIN_USER ?? ''))
      missing.push('ADMIN_USER: validUsername')
    if ((env.ADMIN_PASSWORD ?? '').length < 8 || (env.ADMIN_PASSWORD ?? '').length > 256)
      missing.push('ADMIN_PASSWORD: 8to256Characters')
  } else
    try {
      const accounts = JSON.parse(env.ADMIN_ACCOUNTS_JSON ?? 'null'),
        seen = new Set()
      if (
        !Array.isArray(accounts) ||
        !accounts.length ||
        accounts.length > 20 ||
        accounts.some((account) => {
          if (
            !account ||
            typeof account !== 'object' ||
            typeof account.username !== 'string' ||
            typeof account.passwordHash !== 'string' ||
            !/^[a-zA-Z0-9][a-zA-Z0-9_.@-]{2,79}$/.test(account.username ?? '') ||
            seen.has(account.username)
          )
            return true
          seen.add(account.username)
          return (
            !['admin', 'editor', 'support'].includes(account.role) ||
            !/^scrypt\$131072\$8\$1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{86}$/.test(
              account.passwordHash ?? '',
            ) ||
            (mfaRequired &&
              account.requireMfaSetup !== undefined &&
              account.requireMfaSetup !== true) ||
            (mfaRequired &&
              (account.requireMfaSetup === true
                ? account.totpSecret !== undefined
                : typeof account.totpSecret !== 'string' ||
                  !/^[A-Z2-7]{32,128}$/.test(account.totpSecret)))
          )
        })
      )
        missing.push('ADMIN_ACCOUNTS_JSON: validAccountsAndMFA')
    } catch {
      missing.push('ADMIN_ACCOUNTS_JSON: validAccountsAndMFA')
    }
  if (env.RATE_LIMIT_BACKEND !== 'database') missing.push('RATE_LIMIT_BACKEND: database')
  if (!env.RATE_LIMIT_TRUSTED_IP_HEADER)
    warnings.push('RATE_LIMIT_TRUSTED_IP_HEADER: shared quota until trusted ingress configured')
  if (
    env.UPLOADS_ENABLED !== 'false' &&
    !(
      (env.UPLOAD_STORAGE === 'local' && env.UPLOAD_LOCAL_PERSISTENT === 'true' && !env.VERCEL) ||
      (env.UPLOAD_STORAGE === 'vercel-blob' && env.BLOB_READ_WRITE_TOKEN)
    )
  )
    missing.push('UPLOAD_STORAGE: persistentLocalOrCustomerBlobRequiredOrDisableUploads')
  if (!env.RESEND_API_KEY || !env.CONTACT_NOTIFY_EMAIL || !env.CONTACT_FROM_EMAIL)
    warnings.push('CONTACT_EMAIL: notifications not fully configured')
  if (env.MIGRATION_DATABASE_URL || env.BACKUP_DATABASE_URL || env.RESTORE_DATABASE_URL)
    warnings.push('MAINTENANCE_CREDENTIALS: remove from web process')
  return {
    configurationReady: missing.length === 0,
    missing: [...new Set(missing)],
    warnings,
    externalVerificationRequired: [
      'owner/cloud permissions',
      'production separation',
      'TLS/ingress/storage durability',
      'monitor recipient and backup schedule',
      'restore drill on deployment',
    ],
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = productionPreflight(process.env)
  console.log(JSON.stringify(report, null, 2))
  if (!report.configurationReady) process.exitCode = 1
}

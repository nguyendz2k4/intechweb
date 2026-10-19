/** Mirrors the admin guard's configuration checks; returns field names, never values. */
export function diagnoseAdminEnvironment(env) {
  const issues = []
  const mfaRequired = env.ADMIN_MFA_REQUIRED !== 'false'
  if (env.ADMIN_MFA_REQUIRED !== undefined && !['true', 'false'].includes(env.ADMIN_MFA_REQUIRED))
    issues.push('ADMIN_MFA_REQUIRED: expectedTrueOrFalse')
  if (env.ADMIN_ENABLED === 'false') issues.push('ADMIN_ENABLED: disabled')
  if (Buffer.byteLength(env.ADMIN_SESSION_SECRET ?? '') < 32)
    issues.push('ADMIN_SESSION_SECRET: missingOrTooShort')
  if (
    mfaRequired &&
    env.NODE_ENV === 'production' &&
    Buffer.byteLength(env.ADMIN_CREDENTIAL_ENCRYPTION_KEY ?? '') < 32
  )
    issues.push('ADMIN_CREDENTIAL_ENCRYPTION_KEY: missingOrTooShort')
  try {
    const origins = (env.ADMIN_TRUSTED_ORIGINS ?? '').split(',').filter(Boolean)
    if (env.NODE_ENV === 'production' && !origins.length) throw new Error()
    for (const value of origins) {
      const url = new URL(value.trim())
      if (
        url.username ||
        url.password ||
        url.pathname !== '/' ||
        url.search ||
        url.hash ||
        !['http:', 'https:'].includes(url.protocol) ||
        (env.NODE_ENV === 'production' && url.protocol !== 'https:')
      )
        throw new Error()
    }
  } catch {
    issues.push('ADMIN_TRUSTED_ORIGINS: invalidOrMissingOrigin')
  }
  const ttl = Number(env.ADMIN_SESSION_TTL_SECONDS ?? 3600)
  if (!Number.isInteger(ttl) || ttl < 900 || ttl > 86400)
    issues.push('ADMIN_SESSION_TTL_SECONDS: expected900to86400')
  let accounts = [],
    enrollmentAccounts = 0
  const directPassword = !mfaRequired && Boolean(env.ADMIN_USER || env.ADMIN_PASSWORD)
  if (directPassword) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.@-]{2,79}$/.test(env.ADMIN_USER ?? ''))
      issues.push('ADMIN_USER: invalidOrMissingUsername')
    if ((env.ADMIN_PASSWORD ?? '').length < 8 || env.ADMIN_PASSWORD.length > 256)
      issues.push('ADMIN_PASSWORD: expected8to256Characters')
  } else if (env.ADMIN_ACCOUNTS_JSON) {
    try {
      accounts = JSON.parse(env.ADMIN_ACCOUNTS_JSON)
    } catch {
      issues.push('ADMIN_ACCOUNTS_JSON: invalidJSON')
    }
    if (!Array.isArray(accounts) || accounts.length < 1 || accounts.length > 20) {
      issues.push('ADMIN_ACCOUNTS_JSON: expectedAccountArray')
      accounts = []
    }
    const names = new Set()
    for (const [index, account] of accounts.entries()) {
      const field = `ADMIN_ACCOUNTS_JSON[${index}]`
      if (!account || typeof account !== 'object') {
        issues.push(`${field}: invalidAccount`)
        continue
      }
      if (
        typeof account.username !== 'string' ||
        !/^[a-zA-Z0-9][a-zA-Z0-9_.@-]{2,79}$/.test(account.username) ||
        names.has(account.username)
      )
        issues.push(`${field}.username: invalidOrDuplicate`)
      names.add(account.username)
      if (
        typeof account.passwordHash !== 'string' ||
        !/^scrypt\$131072\$8\$1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{86}$/.test(account.passwordHash)
      )
        issues.push(`${field}.passwordHash: invalidScryptFormat`)
      if (!['admin', 'editor', 'support'].includes(account.role))
        issues.push(`${field}.role: invalidRole`)
      if (mfaRequired && account.requireMfaSetup !== undefined && account.requireMfaSetup !== true)
        issues.push(`${field}.requireMfaSetup: mustBeBooleanTrue`)
      if (mfaRequired && account.requireMfaSetup === true) {
        enrollmentAccounts++
        if (account.totpSecret !== undefined)
          issues.push(`${field}: removeTotpSecretForFirstLoginSetup`)
      }
      if (
        mfaRequired &&
        account.totpSecret !== undefined &&
        (typeof account.totpSecret !== 'string' ||
          !/^[A-Z2-7]{32,128}$/.test(
            account.totpSecret.replace(/\s/g, '').toUpperCase().replace(/=+$/, ''),
          ))
      )
        issues.push(`${field}.totpSecret: invalidBase32`)
      if (
        mfaRequired &&
        env.NODE_ENV === 'production' &&
        !account.totpSecret &&
        account.requireMfaSetup !== true
      )
        issues.push(`${field}: missingTotpSecretOrFirstLoginSetup`)
    }
  } else if (env.NODE_ENV === 'production') issues.push('ADMIN_ACCOUNTS_JSON: missing')
  else if (
    !/^[a-zA-Z0-9][a-zA-Z0-9_.@-]{2,79}$/.test(env.ADMIN_USER ?? '') ||
    (env.ADMIN_PASSWORD ?? '').length < 12
  )
    issues.push('ADMIN_USER/ADMIN_PASSWORD: invalidDevelopmentCredentials')
  return {
    ready: issues.length === 0,
    issues,
    accounts: directPassword ? 1 : accounts.length,
    authenticationMode: mfaRequired ? 'mfa' : 'password',
    firstLoginEnrollment: enrollmentAccounts > 0,
  }
}

export function logAdminEnvironment(env) {
  const result = diagnoseAdminEnvironment(env)
  console.error(`[admin-config] ${JSON.stringify(result)}`)
}

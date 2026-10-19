import assert from 'node:assert/strict'
import { test } from 'node:test'
import { diagnoseAdminEnvironment } from '../scripts/admin-config-diagnostics.mjs'
import { validateAdminRequest } from '../app/lib/admin-auth'

const account = {
  username: 'owner@example.test',
  role: 'admin',
  passwordHash: `scrypt$131072$8$1$${'a'.repeat(22)}$${'b'.repeat(86)}`,
  requireMfaSetup: true,
}
const config = {
  NODE_ENV: 'production',
  ADMIN_ENABLED: 'true',
  ADMIN_SESSION_SECRET: 'fixture-session-secret-at-least-thirty-two-bytes',
  ADMIN_CREDENTIAL_ENCRYPTION_KEY: 'fixture-encryption-secret-at-least-thirty-two-bytes',
  ADMIN_TRUSTED_ORIGINS: 'https://intechna.vn',
  ADMIN_ACCOUNTS_JSON: JSON.stringify([account]),
}

test('private diagnostic agrees with the actual production guard and never includes credential values', () => {
  const saved = { ...process.env }
  const variants = [
    {
      ...config,
      ADMIN_MFA_REQUIRED: 'false',
      ADMIN_USER: 'password-owner@example.test',
      ADMIN_PASSWORD: 'private-password-fixture',
      ADMIN_ACCOUNTS_JSON: 'broken',
      ADMIN_CREDENTIAL_ENCRYPTION_KEY: '',
    },
    { ...config, ADMIN_MFA_REQUIRED: 'wrong' },
    config,
    { ...config, ADMIN_ACCOUNTS_JSON: '' },
    { ...config, ADMIN_ACCOUNTS_JSON: '[' },
    { ...config, ADMIN_ACCOUNTS_JSON: JSON.stringify({ ...account }) },
    {
      ...config,
      ADMIN_ACCOUNTS_JSON: JSON.stringify([{ ...account, passwordHash: 'private-broken-hash' }]),
    },
    { ...config, ADMIN_ACCOUNTS_JSON: JSON.stringify([{ ...account, requireMfaSetup: 'true' }]) },
    {
      ...config,
      ADMIN_ACCOUNTS_JSON: JSON.stringify([{ ...account, requireMfaSetup: undefined }]),
    },
    {
      ...config,
      ADMIN_ACCOUNTS_JSON: JSON.stringify([
        { ...account, requireMfaSetup: undefined, totpSecret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ' },
      ]),
    },
    { ...config, ADMIN_SESSION_SECRET: '' },
    { ...config, ADMIN_CREDENTIAL_ENCRYPTION_KEY: '' },
    { ...config, ADMIN_TRUSTED_ORIGINS: '[https://intechna.vn](https://intechna.vn)' },
    { ...config, ADMIN_TRUSTED_ORIGINS: '' },
    { ...config, ADMIN_ENABLED: 'false' },
    { ...config, ADMIN_SESSION_TTL_SECONDS: 'wrong' },
  ]
  try {
    for (const value of variants) {
      for (const key of Object.keys(process.env))
        if (key.startsWith('ADMIN_')) delete process.env[key]
      Object.assign(process.env, value)
      const result = diagnoseAdminEnvironment(process.env)
      const response = validateAdminRequest(
        new Request('https://intechna.vn/admin-login', { headers: { host: 'intechna.vn' } }),
      )
      assert.equal(result.ready, response === null)
      const serialized = JSON.stringify(result)
      for (const secret of [
        'private-password-fixture',
        account.username,
        account.passwordHash,
        config.ADMIN_SESSION_SECRET,
        config.ADMIN_CREDENTIAL_ENCRYPTION_KEY,
        'private-broken-hash',
        'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
      ])
        assert.ok(!serialized.includes(secret))
    }
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]
    Object.assign(process.env, saved)
  }
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { productionPreflight } from '../scripts/production-preflight.mjs'
test('production preflight reports config gaps without returning secret values', () => {
  const secret = 'PRIVATE_TEST_SECRET_'.repeat(4)
  const report = productionPreflight({
    DATABASE_URL: secret,
    ADMIN_SESSION_SECRET: secret,
    ADMIN_CREDENTIAL_ENCRYPTION_KEY: secret,
    HEALTHCHECK_TOKEN: secret,
    ADMIN_TRUSTED_ORIGINS: 'http://localhost:3000',
    ADMIN_ACCOUNTS_JSON: 'invalid',
  })
  assert.equal(report.configurationReady, false)
  assert.ok(report.missing.some((name) => name.includes('validHTTPS')))
  assert.ok(report.missing.some((name) => name.includes('MFA')))
  assert.ok(report.missing.some((name) => name.includes('validMySQLConfiguration')))
  assert.equal(JSON.stringify(report).includes(secret), false)
  for (const invalidAccount of [
    {
      username: 123,
      passwordHash: `scrypt$131072$8$1$${'a'.repeat(22)}$${'b'.repeat(86)}`,
      totpSecret: 'A'.repeat(32),
    },
    {
      username: 'owner',
      passwordHash: [`scrypt$131072$8$1$${'a'.repeat(22)}$${'b'.repeat(86)}`],
      totpSecret: 'A'.repeat(32),
    },
    {
      username: 'owner',
      passwordHash: `scrypt$131072$8$1$${'a'.repeat(22)}$${'b'.repeat(86)}`,
      totpSecret: ['A'.repeat(32)],
    },
  ])
    assert.ok(
      productionPreflight({
        ADMIN_ACCOUNTS_JSON: JSON.stringify([{ ...invalidAccount, role: 'admin' }]),
      }).missing.some((name) => name.includes('validAccountsAndMFA')),
    )
})
test('preflight can validate config while still requiring cloud/operational verification', () => {
  const secret = 'test-key-with-at-least-thirty-two-characters'
  const report = productionPreflight({
    DATABASE_URL: 'mysql://fixture:fixture@db.example.test/production',
    NEXT_PUBLIC_SITE_URL: 'https://customer.example.test',
    ADMIN_SESSION_SECRET: secret,
    ADMIN_CREDENTIAL_ENCRYPTION_KEY: secret,
    HEALTHCHECK_TOKEN: secret,
    ADMIN_TRUSTED_ORIGINS: 'https://admin.example.test',
    ADMIN_ACCOUNTS_JSON: JSON.stringify([
      {
        username: 'owner',
        role: 'admin',
        passwordHash: `scrypt$131072$8$1$${'a'.repeat(22)}$${'b'.repeat(86)}`,
        totpSecret: 'A'.repeat(32),
      },
    ]),
    RATE_LIMIT_BACKEND: 'database',
    UPLOADS_ENABLED: 'false',
  })
  assert.equal(report.configurationReady, true)
  assert.ok(report.externalVerificationRequired.length > 0)
})

test('preflight permits explicit first-login MFA enrollment without permitting a missing factor by default', () => {
  const account = {
    username: 'owner@example.test',
    role: 'admin',
    passwordHash: `scrypt$131072$8$1$${'a'.repeat(22)}$${'b'.repeat(86)}`,
    requireMfaSetup: true,
  }
  const report = (value) =>
    productionPreflight({ ADMIN_ACCOUNTS_JSON: JSON.stringify([value]) }).missing
  assert.ok(!report(account).includes('ADMIN_ACCOUNTS_JSON: validAccountsAndMFA'))
  for (const value of [
    { ...account, requireMfaSetup: undefined },
    { ...account, requireMfaSetup: false },
    { ...account, requireMfaSetup: 'true' },
    { ...account, totpSecret: 'A'.repeat(32) },
  ])
    assert.ok(report(value).includes('ADMIN_ACCOUNTS_JSON: validAccountsAndMFA'))
})

test('password-only preflight accepts direct cPanel credentials without JSON or MFA keys', () => {
  const secret = 'fixture-secret-with-at-least-thirty-two-characters'
  const env = {
    DATABASE_URL: 'mysql://fixture:fixture@db.example.test/production',
    NEXT_PUBLIC_SITE_URL: 'https://intechna.vn',
    ADMIN_SESSION_SECRET: secret,
    HEALTHCHECK_TOKEN: secret,
    ADMIN_TRUSTED_ORIGINS: 'https://intechna.vn',
    ADMIN_MFA_REQUIRED: 'false',
    ADMIN_USER: 'owner@example.test',
    ADMIN_PASSWORD: 'fixture-password-123',
    ADMIN_ACCOUNTS_JSON: 'broken old value',
    RATE_LIMIT_BACKEND: 'database',
    UPLOADS_ENABLED: 'false',
  }
  assert.equal(productionPreflight(env).configurationReady, true)
  assert.ok(!JSON.stringify(productionPreflight(env)).includes(env.ADMIN_PASSWORD))
  assert.equal(productionPreflight({ ...env, ADMIN_PASSWORD: '' }).configurationReady, false)
})

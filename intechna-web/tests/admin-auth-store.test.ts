import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { getMysqlDatabase } from '../app/lib/db/mysql-client.mjs'
import { changeCredentialWithDatabase, type Credential } from '../app/lib/admin-auth-store'
function databaseFixture() {
  const credentials = new Map<string, Credential>([
    [
      'owner',
      { passwordHash: 'newer-hash', totpEncrypted: 'newer-mfa', revision: 'newer-revision' },
    ],
  ])
  const sessions = new Map([
    ['fresh-cookie', 'owner'],
    ['other-cookie', 'other'],
  ])
  let commits = 0,
    rollbacks = 0
  let queue: Promise<unknown> = Promise.resolve()
  const db = {
    transaction: (work: (tx: unknown) => Promise<unknown>) => {
      const result = queue.then(async () => {
        const staged = new Map(credentials),
          stagedSessions = new Map(sessions)
        try {
          const result = await work({
            execute: async (statement: string, values: unknown[]) => {
              assert.ok(
                !values.some((value) => typeof value === 'string' && statement.includes(value)),
              )
              if (statement.startsWith('INSERT INTO security_admin_credentials')) {
                const username = values[0] as string
                if (!staged.has(username))
                  staged.set(username, {
                    passwordHash: null,
                    totpEncrypted: null,
                    revision: 'initial',
                  })
              } else if (statement.startsWith('UPDATE security_admin_credentials')) {
                const [passwordHash, totpEncrypted, revision, username] = values as [
                  string | null,
                  string | null,
                  string,
                  string,
                ]
                staged.set(username, { passwordHash, totpEncrypted, revision })
              } else if (statement.startsWith('DELETE FROM security_admin_sessions')) {
                for (const [hash, owner] of stagedSessions)
                  if (owner === values[0]) stagedSessions.delete(hash)
              } else throw new Error('Unexpected mutation')
              return { affectedRows: 1 }
            },
            query: async (statement: string, values: unknown[]) => {
              assert.match(statement, /FOR UPDATE$/)
              return [staged.get(values[0] as string)]
            },
          })
          credentials.clear()
          for (const entry of staged) credentials.set(...entry)
          sessions.clear()
          for (const entry of stagedSessions) sessions.set(...entry)
          commits++
          return result
        } catch (error) {
          rollbacks++
          throw error
        }
      })
      queue = result.catch(() => {})
      return result
    },
  } as unknown as ReturnType<typeof getMysqlDatabase>
  return {
    db,
    credentials,
    sessions,
    get commits() {
      return commits
    },
    get rollbacks() {
      return rollbacks
    },
  }
}
test('stale credential changes roll back and preserve newer credentials and fresh sessions', async () => {
  const f = databaseFixture()
  await assert.rejects(
    changeCredentialWithDatabase(
      f.db,
      'owner',
      'old-revision',
      { passwordHash: 'stale-hash', totpEncrypted: null },
      'stale-write',
    ),
    (error: unknown) => error instanceof Error && 'status' in error && error.status === 409,
  )
  assert.equal(f.credentials.get('owner')?.revision, 'newer-revision')
  assert.ok(f.sessions.has('fresh-cookie'))
  assert.ok(f.sessions.has('other-cookie'))
  assert.equal(f.commits, 0)
  assert.equal(f.rollbacks, 1)
})
test('successful credential changes commit credentials and revocation together', async () => {
  const f = databaseFixture()
  await changeCredentialWithDatabase(
    f.db,
    'owner',
    'newer-revision',
    { passwordHash: 'replacement-hash', totpEncrypted: 'replacement-mfa' },
    'replacement-revision',
  )
  assert.equal(f.credentials.get('owner')?.revision, 'replacement-revision')
  assert.equal(f.sessions.has('fresh-cookie'), false)
  assert.ok(f.sessions.has('other-cookie'))
  assert.equal(f.commits, 1)
})
test('initial changes bind hostile usernames and concurrent changes accept one revision only', async () => {
  const f = databaseFixture(),
    username = "owner'; DELETE FROM security_admin_sessions; --"
  await changeCredentialWithDatabase(
    f.db,
    username,
    'initial',
    { passwordHash: 'new-hash', totpEncrypted: null },
    'first-revision',
  )
  assert.equal(f.credentials.get(username)?.revision, 'first-revision')
  assert.ok(f.sessions.has('fresh-cookie'))
  const results = await Promise.allSettled([
    changeCredentialWithDatabase(
      f.db,
      'owner',
      'newer-revision',
      { passwordHash: 'first-hash', totpEncrypted: null },
      'revision-one',
    ),
    changeCredentialWithDatabase(
      f.db,
      'owner',
      'newer-revision',
      { passwordHash: 'second-hash', totpEncrypted: null },
      'revision-two',
    ),
  ])
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
  assert.equal(f.credentials.get('owner')?.revision, 'revision-one')
})

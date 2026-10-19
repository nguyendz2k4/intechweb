import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fixtureQueryResult, fixturePool } from '../scripts/ci-build-fixture.mjs'
test('MySQL CI fixture honors parameters and covers an empty catalog', () => {
  const query =
    'select `slug`, `status` from `products` where `products`.`status` = ? order by `products`.`created_at`'
  assert.deepEqual(fixtureQueryResult({ query, params: ['published'] })[0], [
    ['ci-switch', 'published'],
  ])
  assert.deepEqual(fixtureQueryResult({ query, params: ['published'] }, true)[0], [])
  assert.deepEqual(
    fixtureQueryResult({
      query: 'select `slug` from `products` where `products`.`slug` = ? limit ?',
      params: ['missing', 1],
    })[0],
    [],
  )
})
test('CI adapter blocks real connections, mutations and unsupported tables', () => {
  assert.throws(() => fixturePool(), /isolated/)
  for (const query of [
    'delete from `products`',
    'select `slug` from `products`; drop table products',
    'select `username` from `security_admin_credentials`',
    'select `unknown` from `products`',
  ])
    assert.throws(() => fixtureQueryResult({ query }), /rejects|does not support/)
})

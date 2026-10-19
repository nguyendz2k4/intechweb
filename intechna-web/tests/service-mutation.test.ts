import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ApiError } from '../app/lib/api-security'
import { saveServiceContent, type ServiceRepository } from '../app/lib/service-mutation'
import type { Service } from '../app/lib/db/schema'

const existing: Service = {
  id: 1,
  slug: 'network-service',
  title: 'Original service',
  description: 'Original content',
  keywords: 'LAN',
  deliverables: ['Network plan'],
  benefits: ['Maintainable'],
  status: 'published',
}

function repositoryFixture() {
  const rows = new Map([[existing.slug, { ...existing }]])
  const calls: string[] = []
  const repository: ServiceRepository = {
    async createService(input) {
      calls.push('create')
      if (rows.has(input.slug)) return null
      const row = { id: rows.size + 1, ...input }
      rows.set(input.slug, row)
      return row
    },
    async upsertService(input) {
      calls.push('upsert')
      const row = { id: rows.get(input.slug)?.id ?? rows.size + 1, ...input }
      rows.set(input.slug, row)
      return row
    },
  }
  return { rows, calls, repository }
}

function request(method: 'POST' | 'PUT', changes: Record<string, unknown> = {}) {
  const { id: _id, ...content } = existing
  return new Request('https://example.test/api/admin/services', {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...content, title: 'Replacement service', ...changes }),
  })
}

test('POST rejects duplicate service slugs with 409 and preserves the existing content', async () => {
  const fixture = repositoryFixture()
  await assert.rejects(
    saveServiceContent(request('POST'), fixture.repository),
    (error: unknown) => error instanceof ApiError && error.status === 409,
  )
  assert.deepEqual(fixture.rows.get(existing.slug), existing)
  assert.deepEqual(fixture.calls, ['create'])
})

test('POST creates new service content with 201, while PUT updates with 200', async () => {
  const fixture = repositoryFixture()
  const created = await saveServiceContent(
    request('POST', { slug: 'new-network-service' }),
    fixture.repository,
  )
  assert.equal(created.status, 201)
  assert.equal(created.service.slug, 'new-network-service')
  const updated = await saveServiceContent(request('PUT'), fixture.repository)
  assert.equal(updated.status, 200)
  assert.equal(updated.service.title, 'Replacement service')
  assert.equal(updated.service.id, existing.id)
  assert.deepEqual(fixture.calls, ['create', 'upsert'])
})

test('PUT still creates a first CMS override for a static service without a stored row', async () => {
  const fixture = repositoryFixture()
  const result = await saveServiceContent(
    request('PUT', { slug: 'static-network-service' }),
    fixture.repository,
  )
  assert.equal(result.status, 200)
  assert.equal(fixture.rows.get('static-network-service')?.title, 'Replacement service')
  assert.deepEqual(fixture.calls, ['upsert'])
})

test('malformed service input is rejected before initializing persistence', async () => {
  let loaded = false
  await assert.rejects(
    saveServiceContent(request('POST', { title: {} }), async () => {
      loaded = true
      return repositoryFixture().repository
    }),
    (error: unknown) => error instanceof ApiError && error.status === 400,
  )
  assert.equal(loaded, false)
})

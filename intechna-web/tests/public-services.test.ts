import assert from 'node:assert/strict'
import { test } from 'node:test'
import { servicePages, solutionPages } from '../app/data'
import {
  mergePublicServices,
  mergePublicSolutions,
  type StoredService,
} from '../app/lib/public-services-data'
import { serviceInput } from '../app/lib/cms-input'
const service: StoredService = {
  slug: 'qa-service',
  title: 'QA service',
  description: 'Description',
  keywords: 'LAN, WiFi',
  deliverables: ['Network plan'],
  benefits: ['Maintainable'],
  status: 'published',
}
test('CMS published services join public, drafts hide static fallback and deletion restores originals', () => {
  assert.deepEqual(mergePublicServices([]), servicePages)
  const original = servicePages[0]
  const override = { ...service, slug: original.slug, title: 'Updated service' }
  assert.equal(
    mergePublicServices([override]).find((s) => s.slug === original.slug)?.title,
    'Updated service',
  )
  assert.equal(
    mergePublicServices([{ ...override, status: 'draft' }]).some((s) => s.slug === original.slug),
    false,
  )
  assert.equal(
    mergePublicServices([service]).find((s) => s.slug === 'qa-service')?.keywords.length,
    2,
  )
  assert.equal(
    mergePublicServices([{ ...service, status: 'draft' }]).some((s) => s.slug === 'qa-service'),
    false,
  )
})

test('published CMS entries become solution cards and details without replacing static solutions', () => {
  const result = mergePublicSolutions([
    service,
    { ...service, slug: 'private-solution', status: 'draft' },
  ])
  for (const original of solutionPages) {
    assert.deepEqual(
      result.find((item) => item.slug === original.slug),
      {
        ...original,
        contentType: 'solution',
      },
    )
  }
  const added = result.find((item) => item.slug === service.slug)
  assert.ok(added?.contentType === 'service')
  assert.equal(added.title, service.title)
  assert.deepEqual(added.keywords, ['LAN', 'WiFi'])
  assert.deepEqual(added.deliverables, service.deliverables)
  assert.deepEqual(added.benefits, service.benefits)
  assert.ok(!result.some((item) => item.slug === 'private-solution'))
})

test('solution overrides respect publication and deletion restores the original', () => {
  const original = solutionPages[0]
  const override = { ...service, slug: original.slug }
  const published = mergePublicSolutions([override])
  assert.equal(published.filter((item) => item.slug === original.slug).length, 1)
  assert.equal(published.find((item) => item.slug === original.slug)?.title, service.title)
  assert.ok(
    !mergePublicSolutions([{ ...override, status: 'draft' }]).some(
      (item) => item.slug === original.slug,
    ),
  )
  assert.equal(
    mergePublicSolutions([]).find((item) => item.slug === original.slug)?.title,
    original.title,
  )
})
test('service input validates publication completeness and refuses layout controls', () => {
  const { slug, title, description, keywords, deliverables, benefits, status } = service
  const input = { slug, title, description, keywords, deliverables, benefits, status }
  assert.equal(serviceInput(input).status, 'published')
  assert.throws(() => serviceInput({ ...input, benefits: [] }), /ít nhất/)
  assert.throws(() => serviceInput({ ...input, deliverables: ['x'.repeat(501)] }))
  assert.throws(() => serviceInput({ ...input, layout: 'image-left' }), /không được phép/)
  assert.equal(
    serviceInput({ ...input, status: 'draft', deliverables: [], benefits: [] }).status,
    'draft',
  )
})

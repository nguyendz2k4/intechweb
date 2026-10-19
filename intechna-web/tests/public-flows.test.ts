import assert from 'node:assert/strict'
import { test } from 'node:test'
import { catalogSearchString, filterCatalog } from '../app/catalog-utils'
import { productList } from './catalog-fixture'
import { publicWarrantyRecord, validateWarrantyQuery } from '../app/lib/warranty'

test('a shared catalog URL applies brand and category together', () => {
  const params = new URLSearchParams('brand=Cisco&category=switch')
  const result = filterCatalog(productList, params)
  assert.ok(result.length > 0)
  assert.ok(
    result.every((product) => product.brand === 'Cisco' && product.categorySlug === 'switch'),
  )
  assert.deepEqual(filterCatalog(productList, new URLSearchParams(params.toString())), result)
})
test('fixed brand pages keep their brand when query parameters try to change it', () => {
  const result = filterCatalog(productList, new URLSearchParams('brand=fortinet'), 'Cisco')
  assert.ok(result.length > 0)
  assert.ok(result.every((product) => product.brand === 'Cisco'))
})
test('catalog queries and unknown filters produce honest results', () => {
  const model = productList[0]
  assert.ok(
    filterCatalog(productList, new URLSearchParams({ q: model.name })).some(
      (p) => p.slug === model.slug,
    ),
  )
  assert.equal(filterCatalog(productList, new URLSearchParams('q=nonexistent-model-xyz')).length, 0)
  assert.equal(
    filterCatalog(productList, new URLSearchParams('category=nonexistent-category')).length,
    0,
  )
  assert.equal(
    catalogSearchString({ q: 'WiFi 6', brand: ['cisco', 'fortinet'] }),
    'q=WiFi+6&brand=cisco',
  )
})
const source = {
  code: 'INTECH-2026-0001',
  serial: 'SERIAL1234',
  product: 'Switch',
  customer: 'Công ty TNHH Minh Phúc',
  purchaseDate: '2026-01-01',
  warrantyUntil: '2026-10-12',
  status: 'Còn bảo hành',
  notes: 'Private internal information',
  id: 42,
}
test('warranty responses mask customers and never expose internal fields', () => {
  const result = publicWarrantyRecord(source, new Date('2026-10-12T00:00:00Z'))
  assert.equal(result.customer, 'Công ty TNHH M*** P***')
  assert.ok(!('notes' in result) && !('id' in result))
  assert.equal(result.coverage, 'valid')
})
test('coverage lasts through the expiry date in Vietnam, then expires at midnight', () => {
  assert.equal(publicWarrantyRecord(source, new Date('2026-10-12T16:59:59Z')).coverage, 'valid')
  const expired = publicWarrantyRecord(source, new Date('2026-10-12T17:00:00Z'))
  assert.equal(expired.coverage, 'expired')
  assert.equal(expired.days, -1)
})
test('missing or invalid expiry dates never claim valid coverage', () => {
  for (const warrantyUntil of [null, '2026-02-30', 'not-a-date']) {
    const result = publicWarrantyRecord(
      { ...source, warrantyUntil },
      new Date('2026-10-12T00:00:00Z'),
    )
    assert.equal(result.coverage, 'unconfirmed')
    assert.equal(result.days, null)
  }
})
test('warranty rejects partial serials, names and wildcard queries', () => {
  for (const query of ['', '12345', 'Nguyễn Văn An', '%SERIAL%', 'a'.repeat(129)])
    assert.ok(validateWarrantyQuery(query))
  assert.equal(validateWarrantyQuery('INTECH-2026-0001'), null)
  assert.equal(validateWarrantyQuery('FGT60F.ABC-123'), null)
})

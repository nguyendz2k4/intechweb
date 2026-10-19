import assert from 'node:assert/strict'
import { test } from 'node:test'
import { productInput } from '../app/lib/cms-input'
import { productSlug, productPriceLabel, wordCount } from '../app/lib/product-fields'

const product = { name: 'Bộ nhớ RAM', brand: 'Netac', category: 'Switch', categorySlug: 'switch' }
test('pasted Vietnamese, compatibility characters and trademarks create a stable URL', () => {
  for (const [text, expected] of [
    [' Intel® Core™ i3‑14100\u00a0', 'intel-core-i3-14100'],
    ['Ｎｅｔａｃ Đèn\u200b điện', 'netac-den-dien'],
  ])
    assert.equal(productSlug(text), expected)
  const pasted = { ...product, name: ' Intel® Core™ i3‑14100 ', brand: 'INTEL' }
  assert.equal(productInput(pasted).slug, productSlug(`${pasted.brand}-${pasted.name}`))
  assert.equal(productInput({ ...product, slug: 'Đường dẫn Dán vào' }).slug, 'duong-dan-dan-vao')
  assert.equal(productInput({ ...product, slug: 'old-url' }, true).slug, 'old-url')
})
test('summary accepts 1000 words, rejects 1001, and preserves multi-line text', () => {
  const summary = Array(1000).fill('thiếtbị').join('\n')
  assert.equal(wordCount(summary), 1000)
  assert.equal(productInput({ ...product, summary }).summary, summary)
  assert.throws(() => productInput({ ...product, summary: summary + ' dư' }), /1.000/)
})
test('VND price is optional, whole and positive; clearing it restores contact mode', () => {
  assert.equal(productInput(product).priceVnd, null)
  assert.equal(productInput({ ...product, priceVnd: 2500000 }).priceVnd, 2500000)
  assert.equal(productInput({ ...product, priceVnd: null }).priceVnd, null)
  assert.equal(productPriceLabel(null), 'Liên hệ')
  assert.match(productPriceLabel(2500000), /2\.500\.000/)
  for (const priceVnd of [0, -1, 1.5, '2000', Infinity, 1e15])
    assert.throws(() => productInput({ ...product, priceVnd }))
})

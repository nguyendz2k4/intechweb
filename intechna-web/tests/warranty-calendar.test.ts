import assert from 'node:assert/strict'
import { test } from 'node:test'
import { adminWarrantyRecord, publicWarrantyRecord } from '../app/lib/warranty'

const source = {
  code: 'INTECH-2026-REGRESSION',
  serial: 'SERIAL1234',
  customer: 'Customer',
  product: 'Switch',
  purchaseDate: '2026-01-01',
  warrantyUntil: '2026-10-13',
  status: 'Còn bảo hành',
  note: 'Private internal note',
}

test('admin and public expire together at Vietnam midnight, independent of host timezone', () => {
  const previousTimezone = process.env.TZ
  try {
    for (const timezone of ['UTC', 'America/Los_Angeles', 'Asia/Ho_Chi_Minh']) {
      process.env.TZ = timezone
      const lastSecond = new Date('2026-10-13T16:59:59Z')
      assert.equal(adminWarrantyRecord(source, lastSecond).status, 'Còn bảo hành')
      assert.equal(publicWarrantyRecord(source, lastSecond).coverage, 'valid')
      const midnight = new Date('2026-10-13T17:00:00Z')
      assert.equal(adminWarrantyRecord(source, midnight).status, 'Hết hạn')
      assert.equal(publicWarrantyRecord(source, midnight).coverage, 'expired')
      assert.equal(publicWarrantyRecord(source, midnight).days, -1)
    }
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ
    else process.env.TZ = previousTimezone
  }
})

test('invalid and missing expiry dates are unconfirmed in admin and public', () => {
  for (const warrantyUntil of [null, '', '2026-02-30']) {
    const record = { ...source, warrantyUntil }
    assert.equal(adminWarrantyRecord(record).status, 'Cần xác nhận thời hạn')
    assert.equal(publicWarrantyRecord(record).coverage, 'unconfirmed')
  }
})

test('explicit expiry and special warranties follow the same expiry calculation', () => {
  const now = new Date('2026-10-13T12:00:00Z')
  const expired = { ...source, status: 'Hết hạn bảo hành' }
  assert.equal(adminWarrantyRecord(expired, now).status, 'Hết hạn')
  assert.equal(publicWarrantyRecord(expired, now).coverage, 'expired')
  const special = { ...source, status: 'Bảo hành đặc biệt' }
  assert.equal(adminWarrantyRecord(special, now).status, 'Bảo hành đặc biệt')
  const afterExpiry = new Date('2026-10-13T17:00:00Z')
  assert.equal(adminWarrantyRecord(special, afterExpiry).status, 'Hết hạn')
  assert.equal(publicWarrantyRecord(special, afterExpiry).coverage, 'expired')
  assert.equal(adminWarrantyRecord(source, now).note, source.note)
  assert.equal('note' in publicWarrantyRecord(source, now), false)
})

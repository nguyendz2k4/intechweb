import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  addWarrantyMonths,
  adminWarrantyRecord,
  formatWarrantyDate,
  warrantyStatusForEditing,
} from '../app/lib/warranty'

test('historical purchase dates determine the term independently of the current year', () => {
  assert.equal(addWarrantyMonths('2024-06-15', 12), '2025-06-15')
  assert.equal(addWarrantyMonths('2024-06-15', 24), '2026-06-15')
  assert.equal(addWarrantyMonths('2024-06-15', 36), '2027-06-15')
  assert.equal(formatWarrantyDate('2024-06-15'), '15/06/2024')
  assert.equal(
    adminWarrantyRecord(
      { warrantyUntil: addWarrantyMonths('2024-06-15', 12), status: 'Còn bảo hành' },
      new Date('2026-10-17T00:00:00Z'),
    ).status,
    'Hết hạn',
  )
})

test('calendar terms clamp leap-day and month-end purchases without spilling into March', () => {
  assert.equal(addWarrantyMonths('2024-02-29', 12), '2025-02-28')
  assert.equal(addWarrantyMonths('2024-02-29', 24), '2026-02-28')
  assert.equal(addWarrantyMonths('2024-02-29', 36), '2027-02-28')
  assert.equal(addWarrantyMonths('2024-02-29', 48), '2028-02-29')
  assert.equal(addWarrantyMonths('2024-01-31', 1), '2024-02-29')
  assert.equal(addWarrantyMonths('2025-01-31', 1), '2025-02-28')
  assert.equal(addWarrantyMonths('2024-08-31', 1), '2024-09-30')
})

test('invalid purchase dates and invalid terms do not create a false expiry date', () => {
  for (const date of ['', '2024-02-30', '2024-13-01', '15/06/2024']) {
    assert.equal(addWarrantyMonths(date, 12), '')
  }
  for (const months of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(addWarrantyMonths('2024-06-15', months), '')
  }
})

test('extending a date-expired record restores coverage while manual expiry is preserved', () => {
  const now = new Date('2026-10-17T00:00:00Z')
  const calculatedExpiry = warrantyStatusForEditing({
    status: 'Hết hạn',
    storedStatus: 'Còn bảo hành',
  })
  assert.equal(calculatedExpiry, 'Còn bảo hành')
  assert.equal(
    adminWarrantyRecord({ warrantyUntil: '2027-06-15', status: calculatedExpiry }, now).status,
    'Còn bảo hành',
  )
  const manualExpiry = warrantyStatusForEditing({
    status: 'Hết hạn',
    storedStatus: 'Hết hạn bảo hành',
  })
  assert.equal(manualExpiry, 'Hết hạn')
  assert.equal(
    adminWarrantyRecord({ warrantyUntil: '2027-06-15', status: manualExpiry }, now).status,
    'Hết hạn',
  )
  assert.equal(
    warrantyStatusForEditing({ status: 'Hết hạn', storedStatus: 'Bảo hành đặc biệt' }),
    'Bảo hành đặc biệt',
  )
  assert.equal(warrantyStatusForEditing({ status: 'Hết hạn', storedStatus: null }), 'Còn bảo hành')
})

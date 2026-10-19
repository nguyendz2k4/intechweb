import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ApiError } from '../app/lib/api-security'
import { checkHealthDatabase, requiredPrivileges } from '../app/lib/health-check'
import type { WarrantyRecord } from '../app/lib/db/schema'
import {
  removeWarrantyContent,
  saveWarrantyContent,
  type WarrantyRepository,
} from '../app/lib/warranty-mutation'

const input = {
  serial: 'SERIAL-2024-001',
  customer: 'Khách hàng cũ',
  product: 'Switch 24 cổng',
  purchaseDate: '2024-02-29',
  warrantyUntil: '2025-02-28',
  status: 'Còn bảo hành',
  note: 'Nhập lại hồ sơ trước khi mở website.',
}
const now = new Date('2026-10-17T03:00:00Z')

function repositoryFixture() {
  const rows = new Map<string, WarrantyRecord>()
  const generations: number[] = []
  const repository: WarrantyRepository = {
    async getNextWarrantyCode() {
      generations.push(1)
      return `INT-TEST${rows.size + 1}`
    },
    async createWarranty(data) {
      const record = { id: rows.size + 1, ...data }
      rows.set(record.code, record)
      return record
    },
    async updateWarranty(data) {
      const existing = rows.get(data.code)
      if (!existing) return null
      const record = { ...existing, ...data }
      rows.set(record.code, record)
      return record
    },
    async deleteWarranty(code) {
      return rows.delete(code)
    },
  }
  return { repository, rows, generations }
}

function request(method: 'POST' | 'PUT' | 'DELETE', body: Record<string, unknown>) {
  return new Request('https://example.test/api/admin/warranty', {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

test('historical warranty creation has a year-free code and immediately returns expired coverage', async () => {
  const fixture = repositoryFixture()
  const result = await saveWarrantyContent(request('POST', input), fixture.repository, now)
  assert.equal(result.status, 201)
  assert.equal(result.record.code, 'INT-TEST1')
  assert.equal(result.record.purchaseDate, '2024-02-29')
  assert.equal(result.record.warrantyUntil, '2025-02-28')
  assert.equal(result.record.status, 'Hết hạn')
  assert.equal(result.record.storedStatus, 'Còn bảo hành')
  assert.equal(result.record.note, input.note)
  assert.deepEqual(fixture.generations, [1])
  assert.equal(fixture.rows.get(result.record.code)?.status, 'Còn bảo hành')
})

test('creation without purchase date also uses a year-free code', async () => {
  const fixture = repositoryFixture()
  const result = await saveWarrantyContent(
    request('POST', { ...input, purchaseDate: '', warrantyUntil: '' }),
    fixture.repository,
    new Date('2025-12-31T17:00:00Z'),
  )
  assert.equal(result.record.code, 'INT-TEST1')
  assert.equal(result.record.status, 'Cần xác nhận thời hạn')
  assert.deepEqual(fixture.generations, [1])
})

test('editing preserves code and identity while correcting dates, serial and customer information', async () => {
  const fixture = repositoryFixture()
  const created = await saveWarrantyContent(request('POST', input), fixture.repository, now)
  const result = await saveWarrantyContent(
    request('PUT', {
      ...input,
      code: created.record.code,
      serial: 'CORRECTED-SERIAL',
      customer: 'Khách hàng đã cập nhật',
      product: 'Switch 48 cổng',
      purchaseDate: '2025-01-01',
      warrantyUntil: '2027-01-01',
      note: 'Đã kiểm tra hóa đơn.',
    }),
    fixture.repository,
    now,
  )
  assert.equal(result.status, 200)
  assert.equal(result.record.id, created.record.id)
  assert.equal(result.record.code, 'INT-TEST1')
  assert.equal(result.record.serial, 'CORRECTED-SERIAL')
  assert.equal(result.record.customer, 'Khách hàng đã cập nhật')
  assert.equal(result.record.product, 'Switch 48 cổng')
  assert.equal(result.record.purchaseDate, '2025-01-01')
  assert.equal(result.record.status, 'Còn bảo hành')
  assert.deepEqual(fixture.generations, [1])
  assert.equal(fixture.rows.size, 1)
  assert.equal(fixture.rows.get(created.record.code)?.note, 'Đã kiểm tra hóa đơn.')
})

test('deleting targets one immutable warranty code and missing rows return 404', async () => {
  const fixture = repositoryFixture()
  const first = await saveWarrantyContent(request('POST', input), fixture.repository, now)
  const second = await saveWarrantyContent(
    request('POST', { ...input, serial: 'SECOND-SERIAL' }),
    fixture.repository,
    now,
  )
  assert.equal(
    await removeWarrantyContent(request('DELETE', { code: first.record.code }), fixture.repository),
    first.record.code,
  )
  assert.equal(fixture.rows.has(first.record.code), false)
  assert.equal(fixture.rows.has(second.record.code), true)
  await assert.rejects(
    removeWarrantyContent(request('DELETE', { code: first.record.code }), fixture.repository),
    (error: unknown) => error instanceof ApiError && error.status === 404,
  )
  await assert.rejects(
    saveWarrantyContent(
      request('PUT', { ...input, code: first.record.code }),
      fixture.repository,
      now,
    ),
    (error: unknown) => error instanceof ApiError && error.status === 404,
  )
  assert.equal(fixture.rows.size, 1)
})

test('invalid updates and delete bodies are rejected before opening persistence', async () => {
  let loaded = false
  const storage = async () => {
    loaded = true
    return repositoryFixture().repository
  }
  for (const body of [
    { ...input, code: 'INT-TEST1', warrantyUntil: '2024-02-28' },
    { ...input, code: 'INT-TEST1', purchaseDate: '2024-02-30' },
    { ...input, code: 'INT-TEST1', status: 'arbitrary' },
    { ...input, code: 'INT-TEST1', id: 2 },
    { ...input, code: {} },
    input,
  ]) {
    await assert.rejects(
      saveWarrantyContent(request('PUT', body), storage, now),
      (error: unknown) => error instanceof ApiError && error.status === 400,
    )
  }
  for (const body of [{ code: [] }, { code: 'INT-TEST1', serial: 'SECOND-SERIAL' }, {}]) {
    await assert.rejects(
      removeWarrantyContent(request('DELETE', body), storage),
      (error: unknown) => error instanceof ApiError && error.status === 400,
    )
  }
  await assert.rejects(
    saveWarrantyContent(request('POST', { ...input, code: 'CLIENT-CODE' }), storage, now),
    (error: unknown) => error instanceof ApiError && error.status === 400,
  )
  assert.equal(loaded, false)
})

test('database readiness requires warranty edit and delete privileges', async () => {
  let warrantyPermissions = ['SELECT', 'INSERT']
  const database = {
    transaction: async (
      run: (tx: { query: (sql: string) => Promise<unknown[]> }) => Promise<boolean>,
    ) =>
      run({
        async query(sql: string) {
          if (sql === 'SELECT DATABASE() AS name') return [{ name: 'intech' }]
          if (sql === 'SHOW GRANTS FOR CURRENT_USER')
            return Object.entries(requiredPrivileges).map(([table, permissions]) => ({
              grant: `GRANT ${(table === 'warranty' ? warrantyPermissions : permissions).join(', ')} ON \`intech\`.\`${table}\` TO 'website'@'localhost'`,
            }))
          return []
        },
      }),
  } as unknown as Parameters<typeof checkHealthDatabase>[0]
  assert.equal(await checkHealthDatabase(database), false)
  warrantyPermissions = ['SELECT', 'INSERT', 'UPDATE']
  assert.equal(await checkHealthDatabase(database), false)
  warrantyPermissions.push('DELETE')
  assert.equal(await checkHealthDatabase(database), true)
})

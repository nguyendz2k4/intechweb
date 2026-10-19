import assert from 'node:assert/strict'
import { test } from 'node:test'
import { zipSync, strToU8 } from 'fflate'
import { docxTables, csvTable, warrantiesFromTables } from '../app/lib/warranty-file'
import { planWarrantyImport, validateWarrantyImport } from '../app/lib/warranty-import'
import { displayWarrantyCode, publicWarrantyRecord } from '../app/lib/warranty'

const cell = (value: string, span = 1) =>
  `<w:tc><w:tcPr><w:gridSpan w:val="${span}"/></w:tcPr><w:p><w:r><w:t>${value}</w:t></w:r></w:p></w:tc>`
const row = (values: string[]) => `<w:tr>${values.join('')}</w:tr>`
test('Word component matrix preserves models, split runs, leading zeroes and merged mouse cells', () => {
  const xml = `<w:document xmlns:w="w"><w:body><w:tbl>${row([cell('STT'), cell('Serial Number bộ máy tính'), cell('Bo mạch chủ'), cell('Chuột', 2)])}${row([cell('STT'), cell('Serial Number bộ máy tính'), cell('Model A &amp; B'), cell('Mouse M1', 2)])}${row([cell('1'), cell('PC-00001'), cell('0001234').replace('0001234', '000</w:t></w:r><w:r><w:t>1234'), cell('MOUSE001', 2)])}</w:tbl></w:body></w:document>`
  const bytes = zipSync({ 'word/document.xml': strToU8(xml) })
  const result = warrantiesFromTables(docxTables(bytes))
  assert.equal(result.records.length, 2)
  assert.equal(result.records[0].serial, '0001234')
  assert.equal(result.records[0].model, 'Model A & B')
  assert.equal(result.records[1].systemSerial, 'PC-00001')
  assert.equal(result.records[1].product, 'Chuột')
})
test('CSV handles quoted commas, Vietnamese column labels, BOM and dates without inferring purchase date', () => {
  const csv =
    '\ufeffSerial,Sản phẩm,Model,Serial bộ máy,Ngày mua,Hạn bảo hành\r\n0001234,"Ổ cứng, SSD",ABC,PC-00001,29/02/2024,28/02/2025\r\n'
  const result = warrantiesFromTables([csvTable(csv)])
  assert.equal(result.records[0].serial, '0001234')
  assert.equal(result.records[0].product, 'Ổ cứng, SSD')
  assert.equal(result.records[0].purchaseDate, '2024-02-29')
  assert.equal(result.records[0].customer, '')
  assert.throws(() => csvTable('Serial,Product\n"bad'), /CSV/)
})
test('invalid/oversized documents and entity declarations are rejected', () => {
  assert.throws(() => docxTables(new Uint8Array([1, 2, 3])))
  assert.throws(() =>
    docxTables(zipSync({ 'word/document.xml': strToU8('<!DOCTYPE x><w:document/>') })),
  )
  assert.throws(() => docxTables(zipSync({ 'word/document.xml': new Uint8Array(5 * 1024 * 1024) })))
  assert.throws(
    () =>
      warrantiesFromTables([
        [['Serial', 'Sản phẩm'], ...Array.from({ length: 501 }, (_, i) => [`SN${i}`, 'SSD'])],
      ]),
    /500/,
  )
})
const entry = {
  serial: 'SN000123',
  product: 'Bo mạch chủ',
  model: 'Model 1',
  customer: 'Đơn vị',
  purchaseDate: '2024-02-29',
  warrantyUntil: '2025-02-28',
  note: 'Serial bộ máy: PC001',
  status: 'Còn bảo hành',
}
test('preview and commit use the same validation; duplicates are skipped and invalid dates cannot save', () => {
  const { lines } = validateWarrantyImport({
    action: 'preview',
    rows: [
      entry,
      { ...entry, serial: 'sn000123' },
      { ...entry, serial: 'EXIST001' },
      { ...entry, purchaseDate: '2024-02-30' },
    ],
  })
  const plan = planWarrantyImport(lines, ['exist001'])
  assert.deepEqual([plan.newCount, plan.duplicateCount, plan.errorCount], [1, 2, 1])
  assert.equal(plan.ready[0].model, 'Model 1')
  assert.equal(plan.ready[0].note, 'Serial bộ máy: PC001')
  assert.throws(() => validateWarrantyImport({ action: 'commit', rows: [] }))
  assert.throws(() => validateWarrantyImport({ action: 'commit', rows: [entry], admin: true }))
  assert.equal(
    validateWarrantyImport({ action: 'commit', rows: [{ ...entry, code: 'override' }] }).lines[0]
      .data,
    null,
  )
})
test('legacy codes have a short public alias; the model is public but internal notes are not', () => {
  const code = 'INTECH-2026-C9B9CA2FE18A'
  assert.equal(displayWarrantyCode(code), 'INT-C9B9CA2FE18A')
  const result = publicWarrantyRecord({ ...entry, code })
  assert.equal(result.code, 'INT-C9B9CA2FE18A')
  assert.equal(result.model, 'Model 1')
  assert.ok(!('note' in result))
})

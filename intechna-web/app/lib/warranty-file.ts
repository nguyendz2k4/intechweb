import { unzipSync, strFromU8 } from 'fflate'
import { XMLParser, XMLValidator } from 'fast-xml-parser'

export type ImportedWarranty = {
  serial: string
  product: string
  model: string
  systemSerial: string
  customer: string
  purchaseDate: string
  warrantyUntil: string
  note: string
}
export const IMPORT_LIMIT = 500
export const FILE_LIMIT = 5 * 1024 * 1024
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
const emptyRow = (): ImportedWarranty => ({
  serial: '',
  product: '',
  model: '',
  systemSerial: '',
  customer: '',
  purchaseDate: '',
  warrantyUntil: '',
  note: '',
})

// Ordered OOXML nodes keep serials stored across multiple Word runs intact.
type XmlNode = { [key: string]: XmlNode[] | string | Record<string, string> }
function children(node: XmlNode, name: string): XmlNode[] {
  const value = node[name]
  return Array.isArray(value) ? value : []
}
function descendants(nodes: XmlNode[], name: string): XmlNode[] {
  return nodes.flatMap((node) =>
    Object.entries(node).flatMap(([key, value]) =>
      key === name ? [node] : Array.isArray(value) ? descendants(value, name) : [],
    ),
  )
}
function cellText(nodes: XmlNode[]): string {
  return nodes
    .map((node) =>
      Object.entries(node)
        .map(([key, value]) => {
          if (key === '#text') return typeof value === 'string' ? value : ''
          if (key === 'w:tab' || key === 'w:br') return ' '
          if (Array.isArray(value)) return cellText(value) + (key === 'w:p' ? ' ' : '')
          return ''
        })
        .join(''),
    )
    .join('')
}
export function docxTables(bytes: Uint8Array): string[][][] {
  if (!bytes.length || bytes.length > FILE_LIMIT) throw new Error('File Word tối đa 5 MB.')
  let files: Record<string, Uint8Array>
  try {
    let matches = 0
    files = unzipSync(bytes, {
      filter: (file) => {
        if (file.name !== 'word/document.xml') return false
        if (++matches > 1 || file.originalSize > 4 * 1024 * 1024)
          throw new Error('XML quá lớn hoặc trùng lặp.')
        return true
      },
    })
  } catch {
    throw new Error('File Word không hợp lệ hoặc vượt giới hạn giải nén.')
  }
  if (!files['word/document.xml']) throw new Error('Vui lòng chọn file Word .docx có bảng serial.')
  const xml = strFromU8(files['word/document.xml'])
  if (/<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true)
    throw new Error('Nội dung Word không hợp lệ.')
  const nodes = new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    parseTagValue: false,
    trimValues: false,
  }).parse(xml) as XmlNode[]
  return descendants(nodes, 'w:tbl').map((table) =>
    children(table, 'w:tbl')
      .filter((node) => node['w:tr'])
      .map((row) => {
        const cells: string[] = []
        for (const cell of children(row, 'w:tr').filter((node) => node['w:tc'])) {
          const content = children(cell, 'w:tc')
          const span = descendants(content, 'w:gridSpan')[0]?.[':@'] as
            Record<string, string> | undefined
          const count = Number(span?.['@_w:val'] ?? 1)
          if (!Number.isInteger(count) || count < 1 || count > 50)
            throw new Error('Bảng Word có cấu trúc cột không hợp lệ.')
          cells.push(...Array<string>(count).fill(cellText(content).trim().replace(/\s+/g, ' ')))
        }
        return cells
      }),
  )
}

export function csvTable(text: string): string[][] {
  const first = text.split(/\r?\n/, 1)[0]
  const delimiter = first.includes('\t') ? '\t' : first.includes(';') ? ';' : ','
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"'
        i++
      } else quoted = !quoted
    } else if (!quoted && (c === delimiter || c === '\n' || c === '\r')) {
      row.push(value.trim())
      value = ''
      if (c !== delimiter) {
        if (row.some(Boolean)) rows.push(row)
        row = []
        if (c === '\r' && text[i + 1] === '\n') i++
      }
    } else value += c
  }
  if (quoted) throw new Error('File CSV thiếu dấu đóng ngoặc kép.')
  row.push(value.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}
function importDate(value: string) {
  const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(value)
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : value
}
export function warrantiesFromTables(tables: string[][][]) {
  const records: ImportedWarranty[] = []
  const warnings: string[] = []
  for (const table of tables) {
    const headerIndex = table.findIndex((row) =>
      row.some((cell) =>
        /^(serial|serialnumber|soserial|soserialthietbi|serialnumberbomaytinh)$/.test(
          normalize(cell),
        ),
      ),
    )
    if (headerIndex < 0) continue
    const header = table[headerIndex].map(normalize)
    const systemColumn = header.indexOf('serialnumberbomaytinh')
    if (systemColumn >= 0) {
      const models = table[headerIndex + 1]
      if (!models) continue
      for (const row of table.slice(headerIndex + 2)) {
        const systemSerial = row[systemColumn]?.trim()
        if (!systemSerial) continue
        const merged = new Set<string>()
        for (let col = systemColumn + 1; col < header.length; col++) {
          if (!header[col]) continue
          const serial = row[col]?.trim() ?? ''
          const product = table[headerIndex][col]
          const model = models[col]?.trim() ?? ''
          // Word may span one cell over two grid columns (e.g. Chuột in the supplied file).
          const key = `${product}\0${model}\0${serial}`
          if (merged.has(key)) continue
          merged.add(key)
          records.push({ ...emptyRow(), serial, product, model, systemSerial })
        }
      }
    } else {
      const column = (...names: string[]) => header.findIndex((name) => names.includes(name))
      const serial = column('serial', 'serialnumber', 'soserial', 'soserialthietbi')
      const product = column('sanpham', 'tensanpham', 'linhkien', 'product')
      if (product < 0) {
        warnings.push('Bỏ qua bảng thiếu cột Sản phẩm.')
        continue
      }
      for (const row of table.slice(headerIndex + 1)) {
        if (!row.some(Boolean)) continue
        const get = (...names: string[]) => row[column(...names)]?.trim() ?? ''
        records.push({
          serial: row[serial] ?? '',
          product: row[product] ?? '',
          model: get('model'),
          systemSerial: get('serialbomay', 'systemserial'),
          customer: get('khachhang', 'customer'),
          purchaseDate: importDate(get('ngaymua', 'purchasedate')),
          warrantyUntil: importDate(get('hanbaohanh', 'warrantyuntil')),
          note: get('ghichu', 'note'),
        })
      }
    }
  }
  if (!records.length)
    throw new Error(
      'Không tìm thấy bảng serial. Dùng file Word như mẫu hoặc CSV có cột Serial, Sản phẩm, Model.',
    )
  if (records.length > IMPORT_LIMIT)
    throw new Error(`Mỗi lần nhập tối đa ${IMPORT_LIMIT} linh kiện. Vui lòng chia nhỏ file.`)
  return { records, warnings }
}
export async function parseWarrantyFile(file: File) {
  if (!file.size || file.size > FILE_LIMIT)
    throw new Error('Chọn file .docx hoặc .csv có dung lượng tối đa 5 MB.')
  if (/\.docx$/i.test(file.name))
    return warrantiesFromTables(docxTables(new Uint8Array(await file.arrayBuffer())))
  if (/\.csv$/i.test(file.name)) return warrantiesFromTables([csvTable(await file.text())])
  throw new Error(
    'Hỗ trợ Word .docx và CSV UTF-8. Vui lòng chuyển file .doc/.xlsx sang định dạng này.',
  )
}

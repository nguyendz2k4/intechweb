import { deflateRawSync } from 'node:zlib'

function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return (crc ^ 0xffffffff) >>> 0
}

/** Standard ZIP32 with UTF-8 names and deflate; no shell or platform-specific archiver. */
export function sourceZip(entries) {
  const local = [],
    central = []
  let offset = 0
  if (entries.length > 65535) throw new Error('Source archive has too many files.')
  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8')
    if (
      !entry.name ||
      entry.name.startsWith('/') ||
      entry.name.includes('\\') ||
      entry.name
        .split('/')
        .some((part) => !part || part === '.' || part === '..' || part.includes(':'))
    )
      throw new Error('Unsafe ZIP entry.')
    const bytes = Buffer.from(entry.bytes)
    const compressed = deflateRawSync(bytes, { level: 9 })
    const checksum = crc32(bytes)
    const header = Buffer.alloc(30)
    header.writeUInt32LE(0x04034b50)
    header.writeUInt16LE(20, 4)
    header.writeUInt16LE(0x0800, 6)
    header.writeUInt16LE(8, 8)
    header.writeUInt16LE(33, 12) // 1980-01-01; deterministic metadata.
    header.writeUInt32LE(checksum, 14)
    header.writeUInt32LE(compressed.length, 18)
    header.writeUInt32LE(bytes.length, 22)
    header.writeUInt16LE(name.length, 26)
    local.push(header, name, compressed)
    const record = Buffer.alloc(46)
    record.writeUInt32LE(0x02014b50)
    record.writeUInt16LE(20, 4)
    record.writeUInt16LE(20, 6)
    record.writeUInt16LE(0x0800, 8)
    record.writeUInt16LE(8, 10)
    record.writeUInt16LE(33, 14)
    record.writeUInt32LE(checksum, 16)
    record.writeUInt32LE(compressed.length, 20)
    record.writeUInt32LE(bytes.length, 24)
    record.writeUInt16LE(name.length, 28)
    record.writeUInt32LE(offset, 42)
    central.push(record, name)
    offset += header.length + name.length + compressed.length
    if (offset >= 0xffffffff) throw new Error('Source archive exceeds ZIP32 limits.')
  }
  const directory = Buffer.concat(central)
  const footer = Buffer.alloc(22)
  footer.writeUInt32LE(0x06054b50)
  footer.writeUInt16LE(entries.length, 8)
  footer.writeUInt16LE(entries.length, 10)
  footer.writeUInt32LE(directory.length, 12)
  footer.writeUInt32LE(offset, 16)
  return Buffer.concat([...local, directory, footer])
}

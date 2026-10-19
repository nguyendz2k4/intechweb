import { ApiError } from './api-security'

export type UploadKind = 'image' | 'datasheet'
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024
export const MAX_PDF_BYTES = 10 * 1024 * 1024
export const MAX_MULTIPART_BYTES = MAX_PDF_BYTES + 64 * 1024
// Keep server uploads below Vercel's request limit, including multipart headers.
export const MAX_BLOB_FILE_BYTES = 3 * 1024 * 1024
export const MAX_BLOB_MULTIPART_BYTES = MAX_BLOB_FILE_BYTES + 64 * 1024

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return new TextDecoder('ascii').decode(bytes.subarray(start, end))
}

export function validateUpload(bytes: Uint8Array, contentType: string, kind: UploadKind): string {
  if (!bytes.length || bytes.length > (kind === 'datasheet' ? MAX_PDF_BYTES : MAX_IMAGE_BYTES))
    throw new ApiError('Dung lượng tệp không hợp lệ.', 413)
  const mime = contentType.toLowerCase()
  if (kind === 'datasheet') {
    if (
      mime !== 'application/pdf' ||
      !/^%PDF-[12]\.\d/.test(ascii(bytes, 0, 8)) ||
      !ascii(bytes, Math.max(0, bytes.length - 1024), bytes.length).includes('%%EOF')
    )
      throw new ApiError('Datasheet phải là tệp PDF hợp lệ.')
    return '.pdf'
  }
  if (
    mime === 'image/jpeg' &&
    bytes.length >= 4 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff &&
    bytes[bytes.length - 2] === 0xff &&
    bytes[bytes.length - 1] === 0xd9
  )
    return '.jpg'
  if (
    mime === 'image/png' &&
    bytes.length >= 45 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value) &&
    ascii(bytes, 12, 16) === 'IHDR' &&
    [0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130].every(
      (value, index) => bytes[bytes.length - 12 + index] === value,
    )
  ) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    if (
      !view.getUint32(16) ||
      !view.getUint32(20) ||
      view.getUint32(16) > 16384 ||
      view.getUint32(20) > 16384 ||
      view.getUint32(16) * view.getUint32(20) > 100_000_000
    )
      throw new ApiError('Kích thước ảnh quá lớn hoặc không hợp lệ.')
    return '.png'
  }
  if (
    mime === 'image/gif' &&
    bytes.length >= 14 &&
    ['GIF87a', 'GIF89a'].includes(ascii(bytes, 0, 6)) &&
    bytes[bytes.length - 1] === 0x3b
  ) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    const width = view.getUint16(6, true),
      height = view.getUint16(8, true)
    if (!width || !height || width > 16384 || height > 16384 || width * height > 100_000_000)
      throw new ApiError('Kích thước ảnh quá lớn hoặc không hợp lệ.')
    return '.gif'
  }
  if (
    mime === 'image/webp' &&
    bytes.length >= 20 &&
    ascii(bytes, 0, 4) === 'RIFF' &&
    ascii(bytes, 8, 12) === 'WEBP' &&
    ['VP8 ', 'VP8L', 'VP8X'].includes(ascii(bytes, 12, 16)) &&
    new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(4, true) ===
      bytes.length - 8
  )
    return '.webp'
  throw new ApiError('Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF hợp lệ; SVG không được phép.')
}

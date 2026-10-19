import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { ApiError } from './api-security'
import {
  MAX_BLOB_FILE_BYTES,
  MAX_BLOB_MULTIPART_BYTES,
  MAX_MULTIPART_BYTES,
  validateUpload,
  type UploadKind,
} from './upload-security'

export type UploadStorage = { provider: 'local' } | { provider: 'vercel-blob'; token: string }

type BlobOptions = {
  access: 'public'
  contentType: string
  token: string
  addRandomSuffix: false
  allowOverwrite: false
}
type StorageDependencies = {
  putBlob?: (
    pathname: string,
    payload: Buffer,
    options: BlobOptions,
  ) => Promise<{ url: string; downloadUrl: string }>
  writeLocal?: (pathname: string, payload: Uint8Array) => Promise<void>
}

export function configuredUploadStorage(env: NodeJS.ProcessEnv = process.env): UploadStorage {
  const provider = env.UPLOAD_STORAGE || (env.NODE_ENV === 'production' ? '' : 'local')
  if (provider === 'vercel-blob') {
    const token = env.BLOB_READ_WRITE_TOKEN?.trim()
    if (!token)
      throw new ApiError(
        'Kho lưu trữ tệp chưa được cấu hình. Vui lòng liên hệ quản trị hệ thống.',
        503,
      )
    return { provider, token }
  }
  if (
    provider === 'local' &&
    !env.VERCEL &&
    (env.NODE_ENV !== 'production' || env.UPLOAD_LOCAL_PERSISTENT === 'true')
  )
    return { provider }
  throw new ApiError('Kho lưu trữ tệp chưa được cấu hình. Vui lòng liên hệ quản trị hệ thống.', 503)
}

export function uploadMultipartLimit(storage: UploadStorage) {
  return storage.provider === 'vercel-blob' ? MAX_BLOB_MULTIPART_BYTES : MAX_MULTIPART_BYTES
}

async function writeLocal(pathname: string, payload: Uint8Array) {
  const filename = path.join(process.cwd(), 'public', pathname)
  await fs.mkdir(path.dirname(filename), { recursive: true })
  await fs.writeFile(filename, payload, { flag: 'wx' })
}

async function putBlob(pathname: string, payload: Buffer, options: BlobOptions) {
  const { put } = await import('@vercel/blob')
  return put(pathname, payload, options)
}

/** Store validated public product assets; no client filename controls the path or MIME. */
export async function storeUpload(
  bytes: Uint8Array,
  contentType: string,
  kind: UploadKind,
  storage: UploadStorage,
  dependencies: StorageDependencies = {},
) {
  if (storage.provider === 'vercel-blob' && bytes.length > MAX_BLOB_FILE_BYTES)
    throw new ApiError('Tệp tải lên tối đa 3 MB trên kho lưu trữ hiện tại.', 413)
  const extension = validateUpload(bytes, contentType, kind)
  const mimeByExtension: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
  }
  const mime = mimeByExtension[extension]
  if (!mime) throw new ApiError('Loại tệp tải lên không hợp lệ.')
  const folder = kind === 'datasheet' ? 'datasheets' : 'images'
  const filename = `${randomUUID()}${extension}`
  const pathname = `uploads/${folder}/${filename}`
  if (storage.provider === 'vercel-blob') {
    const blob = await (dependencies.putBlob ?? putBlob)(pathname, Buffer.from(bytes), {
      access: 'public',
      token: storage.token,
      contentType: mime,
      addRandomSuffix: false,
      allowOverwrite: false,
    })
    return { filename, url: kind === 'datasheet' ? blob.downloadUrl : blob.url }
  }
  await (dependencies.writeLocal ?? writeLocal)(pathname, bytes)
  return { filename, url: `/${pathname}` }
}

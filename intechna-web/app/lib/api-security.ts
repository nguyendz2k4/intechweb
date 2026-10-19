import { createHash } from 'node:crypto'
import { isIP } from 'node:net'
import { databaseConfigured, getMysqlDatabase } from './db/mysql-client.mjs'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const privateHeaders = { 'Cache-Control': 'no-store, max-age=0' }

export function apiErrorResponse(
  error: unknown,
  message = 'Hệ thống tạm thời chưa khả dụng. Vui lòng thử lại sau.',
): Response {
  return Response.json(
    { error: error instanceof ApiError ? error.message : message },
    {
      status: error instanceof ApiError ? error.status : 503,
      headers: privateHeaders,
    },
  )
}

export async function readRequestBytes(request: Request, maxBytes: number): Promise<Uint8Array> {
  const length = request.headers.get('content-length')
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > maxBytes)) {
    throw new ApiError('Nội dung gửi lên quá lớn hoặc không hợp lệ.', 413)
  }
  if (!request.body) throw new ApiError('Thiếu nội dung yêu cầu.')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) {
        await reader.cancel()
        throw new ApiError('Nội dung gửi lên quá lớn.', 413)
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

export async function readJsonObject(
  request: Request,
  maxBytes = 64 * 1024,
): Promise<Record<string, unknown>> {
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json'
  ) {
    throw new ApiError('Yêu cầu phải sử dụng JSON.', 415)
  }
  const bytes = await readRequestBytes(request, maxBytes)
  let value: unknown
  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch {
    throw new ApiError('Nội dung JSON không hợp lệ.')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('Nội dung phải là một đối tượng JSON.')
  }
  return value as Record<string, unknown>
}

export function assertAllowedKeys(body: Record<string, unknown>, allowed: readonly string[]): void {
  if (Object.keys(body).some((key) => !allowed.includes(key)))
    throw new ApiError('Yêu cầu chứa trường không được phép.')
}

type TextOptions = { required?: boolean; min?: number; max: number; pattern?: RegExp }
export function textField(
  body: Record<string, unknown>,
  key: string,
  options: TextOptions,
): string {
  const raw = body[key]
  if (raw === undefined && !options.required) return ''
  if (typeof raw !== 'string') throw new ApiError(`Trường ${key} phải là chuỗi.`)
  const value = raw.trim()
  if (
    (options.required && !value) ||
    value.length < (options.min ?? 0) ||
    value.length > options.max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value) ||
    (value && options.pattern && !options.pattern.test(value))
  ) {
    throw new ApiError(`Trường ${key} không hợp lệ.`)
  }
  return value
}

export function integerField(
  body: Record<string, unknown>,
  key: string,
  options: { required?: boolean; min: number; max: number; default?: number },
): number | undefined {
  const raw = body[key]
  if (raw === undefined && !options.required) return options.default
  if (
    typeof raw !== 'number' ||
    !Number.isSafeInteger(raw) ||
    raw < options.min ||
    raw > options.max
  )
    throw new ApiError(`Trường ${key} phải là số nguyên hợp lệ.`)
  return raw
}

export function booleanField(
  body: Record<string, unknown>,
  key: string,
  fallback = false,
): boolean {
  if (body[key] === undefined) return fallback
  if (typeof body[key] !== 'boolean') throw new ApiError(`Trường ${key} phải là true hoặc false.`)
  return body[key]
}

export function stringArrayField(
  body: Record<string, unknown>,
  key: string,
  options: { maxItems: number; maxLength: number },
): string[] {
  if (body[key] === undefined) return []
  const values = body[key]
  if (!Array.isArray(values) || values.length > options.maxItems)
    throw new ApiError(`Danh sách ${key} không hợp lệ.`)
  return values.map((value) =>
    textField({ value }, 'value', { required: true, max: options.maxLength }),
  )
}

export function httpUrlField(
  body: Record<string, unknown>,
  key: string,
  options: { max?: number; allowLocal?: boolean } = {},
): string {
  const value = textField(body, key, { max: options.max ?? 2048 })
  if (!value) return ''
  if (
    options.allowLocal &&
    /^\/(?!\/)[a-zA-Z0-9/_.-]+$/.test(value) &&
    !value.split('/').includes('..')
  )
    return value
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new ApiError(`URL ${key} không hợp lệ.`)
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password)
    throw new ApiError(`URL ${key} không hợp lệ.`)
  return parsed.href
}

export function dateField(body: Record<string, unknown>, key: string): string {
  const value = textField(body, key, { max: 10 })
  if (!value) return ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ApiError(`Ngày ${key} không hợp lệ.`)
  const date = new Date(`${value}T00:00:00Z`)
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value ||
    value < '1900-01-01' ||
    value > '2200-12-31'
  )
    throw new ApiError(`Ngày ${key} không hợp lệ.`)
  return value
}

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!,
  )
}

type RateEntry = { count: number; expiresAt: number }
const memoryBuckets = new Map<string, RateEntry>()
const maxMemoryBuckets = 10_000

// The ingress must remove any client supplied value and overwrite this header.
// An unset/malformed header uses one conservative shared bucket; X-Forwarded-For is never trusted implicitly.
export function rateLimitIdentity(request: Request): string {
  const header = process.env.RATE_LIMIT_TRUSTED_IP_HEADER?.trim().toLowerCase()
  const address = header ? request.headers.get(header)?.trim() : undefined
  return address && isIP(address) ? address : 'shared'
}

function limited(retryAfter: number): Response {
  return Response.json(
    { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
    {
      status: 429,
      headers: { ...privateHeaders, 'Retry-After': String(Math.max(1, retryAfter)) },
    },
  )
}

export async function enforceRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
  identifier = '',
): Promise<Response | null> {
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    !Number.isSafeInteger(windowMs) ||
    windowMs < 1000
  )
    throw new Error('Invalid rate limit policy')
  const key = createHash('sha256')
    .update(`${scope}\0${rateLimitIdentity(request)}\0${identifier.slice(0, 256)}`)
    .digest('hex')
  const production = process.env.NODE_ENV === 'production'
  const backend =
    process.env.RATE_LIMIT_BACKEND ?? (production || databaseConfigured() ? 'database' : 'memory')
  if (backend === 'database' && databaseConfigured()) {
    try {
      const row = await getMysqlDatabase().transaction(async (tx) => {
        await tx.execute(
          `INSERT INTO security_rate_limits (bucket_hash, count, expires_at)
          VALUES (?, 1, TIMESTAMPADD(MICROSECOND, ?, UTC_TIMESTAMP(3)))
          ON DUPLICATE KEY UPDATE
            count=IF(expires_at <= UTC_TIMESTAMP(3), 1, LEAST(count+1, ?)),
            expires_at=IF(expires_at <= UTC_TIMESTAMP(3), TIMESTAMPADD(MICROSECOND, ?, UTC_TIMESTAMP(3)), expires_at)`,
          [key, windowMs * 1000, limit + 1, windowMs * 1000],
        )
        const rows = await tx.query<{ count: number; retry_after: number }>(
          'SELECT count, GREATEST(1, CEIL(TIMESTAMPDIFF(MICROSECOND, UTC_TIMESTAMP(3), expires_at)/1000000)) AS retry_after FROM security_rate_limits WHERE bucket_hash=?',
          [key],
        )
        return rows[0]
      })
      if (!row) throw new Error('Rate limit backend unavailable')
      return Number(row.count) > limit ? limited(Number(row.retry_after)) : null
    } catch {
      return apiErrorResponse(
        new ApiError('Hệ thống tạm thời chưa khả dụng. Vui lòng thử lại sau.', 503),
      )
    }
  }
  if (production || backend !== 'memory')
    return apiErrorResponse(
      new ApiError('Hệ thống tạm thời chưa khả dụng. Vui lòng thử lại sau.', 503),
    )
  const now = Date.now()
  for (const [bucketKey, bucket] of memoryBuckets)
    if (bucket.expiresAt <= now) memoryBuckets.delete(bucketKey)
  let bucket = memoryBuckets.get(key)
  if (!bucket) {
    if (memoryBuckets.size >= maxMemoryBuckets) return limited(Math.ceil(windowMs / 1000))
    bucket = { count: 0, expiresAt: now + windowMs }
    memoryBuckets.set(key, bucket)
  }
  bucket.count = Math.min(bucket.count + 1, limit + 1)
  return bucket.count > limit ? limited(Math.ceil((bucket.expiresAt - now) / 1000)) : null
}

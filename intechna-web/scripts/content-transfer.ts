import { createMysqlDatabase, type getMysqlDatabase } from '../app/lib/db/mysql-client.mjs'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ApiError, assertAllowedKeys } from '../app/lib/api-security'
import { postInput, productInput, serviceInput } from '../app/lib/cms-input'

const maxContentBytes = 20 * 1024 * 1024
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const defaultFile = path.join(appRoot, 'data', 'owner', 'content.json')

type ProductContent = ReturnType<typeof productInput>
type PostContent = ReturnType<typeof postInput> & { publishedAt: string | null }
type ServiceContent = ReturnType<typeof serviceInput>
export type ContentEnvelope = {
  version: 1
  exportedAt: string
  counts: { products: number; posts: number; services: number }
  products: ProductContent[]
  posts: PostContent[]
  services: ServiceContent[]
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ApiError(`${label} phải là một đối tượng.`)
  return value as Record<string, unknown>
}

function requireFields(value: Record<string, unknown>, fields: readonly string[]) {
  if (fields.some((field) => !Object.prototype.hasOwnProperty.call(value, field))) {
    throw new ApiError(
      'Bản ghi phải có đủ các trường theo mẫu, kể cả giá trị rỗng hoặc danh sách rỗng.',
    )
  }
}

function dateTime(value: unknown, nullable = false): string | null {
  if (nullable && value === null) return null
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)
  )
    throw new ApiError('Thời gian phải là ISO 8601 UTC hoặc null nếu được phép.')
  const date = new Date(value)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 19) !== value.slice(0, 19))
    throw new ApiError('Thời gian không hợp lệ.')
  return date.toISOString()
}

function contentArray<T extends { slug: string }>(
  value: unknown,
  label: string,
  maxItems: number,
  validate: (item: Record<string, unknown>) => T,
): T[] {
  if (!Array.isArray(value) || value.length > maxItems)
    throw new ApiError(`${label} phải là danh sách có tối đa ${maxItems} mục.`)
  const slugs = new Set<string>()
  return value.map((raw) => {
    const item = validate(object(raw, label))
    if (slugs.has(item.slug)) throw new ApiError(`${label} chứa đường dẫn bị trùng.`)
    slugs.add(item.slug)
    return item
  })
}

/** Validate every record before constructing any import query; IDs and private tables are never accepted. */
export function validateContentEnvelope(value: unknown): ContentEnvelope {
  const body = object(value, 'Tệp nội dung')
  assertAllowedKeys(body, ['version', 'exportedAt', 'counts', 'products', 'posts', 'services'])
  if (body.version !== 1) throw new ApiError('Phiên bản tệp nội dung chưa được hỗ trợ.')
  const exportedAt = dateTime(body.exportedAt)!
  const products = contentArray(body.products, 'products', 10_000, (raw) => {
    requireFields(raw, [
      'slug',
      'name',
      'brand',
      'category',
      'categorySlug',
      'summary',
      'badges',
      'specs',
      'applications',
      'imageUrl',
      'datasheetUrl',
      'status',
    ])
    return productInput(raw, true)
  })
  const posts = contentArray(body.posts, 'posts', 3000, (raw) => {
    requireFields(raw, ['slug', 'title', 'description', 'body', 'status', 'publishedAt'])
    const { publishedAt, ...fields } = raw
    return { ...postInput(fields, true), publishedAt: dateTime(publishedAt, true) }
  })
  const services = contentArray(body.services, 'services', 1000, (raw) => {
    requireFields(raw, ['slug', 'title', 'description', 'keywords'])
    if (['status', 'deliverables', 'benefits'].some((field) => Object.hasOwn(raw, field)))
      requireFields(raw, ['status', 'deliverables', 'benefits'])
    return serviceInput(raw, true)
  })
  const counts = object(body.counts, 'counts')
  assertAllowedKeys(counts, ['products', 'posts', 'services'])
  for (const [name, records] of Object.entries({ products, posts, services })) {
    if (!Number.isSafeInteger(counts[name]) || counts[name] !== records.length)
      throw new ApiError('Số lượng khai báo không khớp nội dung.')
  }
  return {
    version: 1,
    exportedAt,
    counts: { products: products.length, posts: posts.length, services: services.length },
    products,
    posts,
    services,
  }
}

type Database = ReturnType<typeof getMysqlDatabase>
function jsonArrays(row: Record<string, unknown>, columns: string[]) {
  for (const column of columns)
    row[column] =
      row[column] === null
        ? []
        : typeof row[column] === 'string'
          ? JSON.parse(row[column] as string)
          : row[column]
  return row
}
export async function exportContent(db: Database): Promise<ContentEnvelope> {
  const data = await db.transaction(
    async (tx) => ({
      products: (
        await tx.query<Record<string, unknown>>(
          "SELECT slug,name,brand,category,category_slug AS categorySlug,COALESCE(summary,'') AS summary,price_vnd AS priceVnd,badges,specs,applications,COALESCE(image_url,'') AS imageUrl,COALESCE(datasheet_url,'') AS datasheetUrl,status FROM products ORDER BY slug",
        )
      ).map((row) => jsonArrays(row, ['badges', 'specs', 'applications'])),
      posts: (
        await tx.query<Record<string, unknown>>(
          "SELECT slug,title,COALESCE(description,'') AS description,COALESCE(body,'') AS body,status,published_at AS publishedAt FROM posts ORDER BY slug",
        )
      ).map((row) => ({
        ...row,
        publishedAt:
          row.publishedAt === null
            ? null
            : new Date(row.publishedAt as string | Date).toISOString(),
      })),
      services: (
        await tx.query<Record<string, unknown>>(
          "SELECT slug,title,COALESCE(description,'') AS description,COALESCE(keywords,'') AS keywords,deliverables,benefits,status FROM services ORDER BY slug",
        )
      ).map((row) => jsonArrays(row, ['deliverables', 'benefits'])),
    }),
    { readOnly: true, isolation: 'REPEATABLE READ' },
  )
  return validateContentEnvelope({
    version: 1,
    exportedAt: new Date().toISOString(),
    counts: {
      products: data.products.length,
      posts: data.posts.length,
      services: data.services.length,
    },
    ...data,
  })
}
/** Validate the whole file first. All upserts commit or roll back together. */
export async function importContent(db: Database, input: unknown) {
  const content = validateContentEnvelope(input)
  const definitions = {
    products: {
      slug: 'slug',
      name: 'name',
      brand: 'brand',
      category: 'category',
      categorySlug: 'category_slug',
      summary: 'summary',
      priceVnd: 'price_vnd',
      badges: 'badges',
      specs: 'specs',
      applications: 'applications',
      imageUrl: 'image_url',
      datasheetUrl: 'datasheet_url',
      status: 'status',
    },
    posts: {
      slug: 'slug',
      title: 'title',
      description: 'description',
      body: 'body',
      status: 'status',
      publishedAt: 'published_at',
    },
    services: {
      slug: 'slug',
      title: 'title',
      description: 'description',
      keywords: 'keywords',
      deliverables: 'deliverables',
      benefits: 'benefits',
      status: 'status',
    },
  }
  await db.transaction(async (tx) => {
    for (const table of ['products', 'posts', 'services'] as const) {
      const columns = Object.values(definitions[table])
      const statement =
        'INSERT INTO ' +
        table +
        ' (' +
        columns.join(',') +
        ') VALUES (' +
        columns.map(() => '?').join(',') +
        ') ON DUPLICATE KEY UPDATE ' +
        columns
          .filter((column) => column !== 'slug')
          .map((column) => column + '=VALUES(' + column + ')')
          .join(',')
      for (const row of content[table]) {
        const values = Object.keys(definitions[table]).map((key) => {
          const value = (row as unknown as Record<string, unknown>)[key]
          return Array.isArray(value)
            ? JSON.stringify(value)
            : key === 'publishedAt' && value !== null
              ? new Date(value as string)
              : value
        })
        await tx.execute(statement, values)
      }
    }
  })
  return content.counts
}

function outputPath(file: string) {
  const destination = path.resolve(file)
  const relative = path.relative(path.join(appRoot, 'public'), destination)
  if (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
    throw new ApiError('Tệp bàn giao phải nằm ngoài thư mục public.')
  if (path.extname(destination).toLowerCase() !== '.json')
    throw new ApiError('Tệp bàn giao phải có phần mở rộng .json.')
  return destination
}

async function readContent(file: string) {
  if ((await stat(file)).size > maxContentBytes) throw new ApiError('Tệp nội dung vượt quá 20 MiB.')
  const buffer = await readFile(file)
  if (buffer.byteLength > maxContentBytes) throw new ApiError('Tệp nội dung vượt quá 20 MiB.')
  let value: unknown
  try {
    value = JSON.parse(buffer.toString('utf8').replace(/^\uFEFF/, ''))
  } catch {
    throw new ApiError('Tệp không phải JSON hợp lệ.')
  }
  return validateContentEnvelope(value)
}

async function main() {
  const command = process.argv[2]
  if (!['export', 'import', 'validate'].includes(command) || process.argv.length > 4)
    throw new ApiError(
      'Dùng: tsx scripts/content-transfer.ts export|import|validate [đường-dẫn.json]',
    )
  const file = outputPath(process.argv[3] ?? defaultFile)
  if (command === 'validate') {
    const content = await readContent(file)
    console.log(JSON.stringify({ operation: 'validated', counts: content.counts }))
    return
  }
  await import('./load-env.mjs')
  const sql = createMysqlDatabase()
  try {
    if (command === 'export') {
      const content = await exportContent(sql)
      const data = `${JSON.stringify(content, null, 2)}\n`
      if (Buffer.byteLength(data) > maxContentBytes)
        throw new ApiError('Nội dung xuất vượt quá 20 MiB.')
      await mkdir(path.dirname(file), { recursive: true, mode: 0o700 })
      await writeFile(file, data, { mode: 0o600 })
      console.log(JSON.stringify({ operation: 'exported', file, counts: content.counts }))
    } else {
      const content = await readContent(file)
      const counts = await importContent(sql, content)
      console.log(JSON.stringify({ operation: 'imported', counts }))
      console.log(
        'Nội dung đã được nhập. Triển khai lại website hoặc làm mới cache để kiểm tra dữ liệu.',
      )
    }
  } finally {
    await sql.close()
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(
      error instanceof ApiError
        ? error.message
        : 'Thao tác nội dung thất bại. Kiểm tra tệp, kết nối và migration bằng công cụ quản trị riêng; thông tin nhạy cảm không được ghi ra đây.',
    )
    process.exitCode = 1
  })
}

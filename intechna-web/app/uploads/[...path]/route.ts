import { promises as fs } from 'node:fs'
import path from 'node:path'
import { MAX_IMAGE_BYTES, MAX_PDF_BYTES, validateUpload } from '@/app/lib/upload-security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const mimeTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
}
const uuidFile =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|gif|webp|pdf)$/
const unavailable = () =>
  Response.json(
    { error: 'Không tìm thấy tệp.' },
    { status: 404, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } },
  )

// Public product media only. UUID files written after server startup need a route;
// Next.js otherwise enumerates the public directory only at startup in production.
export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await context.params
  if (!Array.isArray(parts) || parts.length !== 2) return unavailable()
  const [folder, filename] = parts
  if (!['images', 'datasheets'].includes(folder) || !uuidFile.test(filename)) return unavailable()
  const extension = path.extname(filename)
  if ((folder === 'datasheets') !== (extension === '.pdf')) return unavailable()
  try {
    const root = await fs.realpath(path.join(process.cwd(), 'public', 'uploads'))
    const file = await fs.realpath(path.join(root, folder, filename))
    const relative = path.relative(root, file)
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative))
      return unavailable()
    const info = await fs.stat(file)
    const maxSize = folder === 'datasheets' ? MAX_PDF_BYTES : MAX_IMAGE_BYTES
    if (!info.isFile() || info.size <= 0 || info.size > maxSize) return unavailable()
    const bytes = await fs.readFile(file)
    const mime = mimeTypes[extension]
    if (validateUpload(bytes, mime, folder === 'datasheets' ? 'datasheet' : 'image') !== extension)
      return unavailable()
    return new Response(bytes, {
      headers: {
        'Content-Type': mime,
        'Content-Length': String(bytes.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        ...(extension === '.pdf'
          ? {
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Content-Security-Policy': "default-src 'none'; sandbox",
            }
          : {}),
      },
    })
  } catch {
    return unavailable()
  }
}

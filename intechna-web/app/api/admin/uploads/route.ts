import { promises as fs } from 'node:fs'
import path from 'node:path'
import { NextResponse } from 'next/server'

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
const maxImageSize = 3 * 1024 * 1024
const maxPdfSize = 10 * 1024 * 1024
const uploadDir = path.join(process.cwd(), 'public', 'uploads')

function safeName(name: string) {
  const ext = path.extname(name).toLowerCase()
  const base = path.basename(name, ext).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'file'
  return `${base}-${Date.now()}${ext}`
}

export async function POST(request: Request) {
  const form = await request.formData()
  const file = form.get('file')
  const kind = form.get('kind') === 'datasheet' ? 'datasheets' : 'images'

  if (!(file instanceof File)) return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  if (!allowedTypes.has(file.type)) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  if (kind === 'datasheets' && file.type !== 'application/pdf') return NextResponse.json({ error: 'Datasheet phải là file PDF' }, { status: 400 })
  if (kind === 'images' && !file.type.startsWith('image/')) return NextResponse.json({ error: 'Ảnh sản phẩm phải là file hình' }, { status: 400 })
  if (kind === 'images' && file.size > maxImageSize) return NextResponse.json({ error: 'Ảnh sản phẩm tối đa 3MB' }, { status: 400 })
  if (kind === 'datasheets' && file.size > maxPdfSize) return NextResponse.json({ error: 'Datasheet tối đa 10MB' }, { status: 400 })

  const dir = path.join(uploadDir, kind)
  await fs.mkdir(dir, { recursive: true })
  const filename = safeName(file.name)
  await fs.writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()))

  return NextResponse.json({ url: `/uploads/${kind}/${filename}` })
}

import { NextResponse } from 'next/server'
import { deleteService, getServices, upsertService } from '@/app/lib/db/queries'

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function GET() {
  return NextResponse.json(await getServices())
}

export async function POST(request: Request) {
  const body = await request.json()
  if (!body.title || !body.description) return NextResponse.json({ error: 'Missing title or description' }, { status: 400 })
  const service = { title: body.title, slug: body.slug || slugify(body.title), description: body.description, keywords: body.keywords || '' }
  return NextResponse.json(await upsertService(service), { status: 201 })
}

export async function PUT(request: Request) { return POST(request) }

export async function DELETE(request: Request) {
  const { slug } = await request.json()
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  return NextResponse.json(await deleteService(slug))
}


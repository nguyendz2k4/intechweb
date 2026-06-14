import { NextResponse } from 'next/server'
import { deleteAdminProduct, getAdminProducts, saveAdminProduct } from '../../../lib/admin-store'

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function GET() {
  return NextResponse.json(await getAdminProducts())
}

export async function POST(request: Request) {
  const body = await request.json()
  if (!body.name || !body.brand) return NextResponse.json({ error: 'Missing name or brand' }, { status: 400 })
  const categorySlug = body.categorySlug || 'switch'
  const product = {
    slug: body.slug || slugify(`${body.brand}-${body.name}`),
    name: body.name,
    brand: body.brand,
    category: body.category || 'Sản phẩm',
    categorySlug,
    badges: body.badges || ['Admin', 'Catalog'],
    summary: body.summary || `Model ${body.name} được thêm vào catalog để tư vấn cấu hình và báo giá theo dự án.`,
    specs: body.specs || ['Tư vấn theo hiện trạng thực tế', 'Chọn cấu hình theo số user/băng thông', 'Có thể kết hợp trong gói thi công'],
    applications: body.applications || ['Hạ tầng mạng doanh nghiệp', 'Dự án cần tư vấn cấu hình', 'Liên hệ báo giá'],
    imageUrl: body.imageUrl || '',
    datasheetUrl: body.datasheetUrl || '',
  }
  return NextResponse.json(await saveAdminProduct(product), { status: 201 })
}

export async function PUT(request: Request) {
  return POST(request)
}

export async function DELETE(request: Request) {
  const { slug } = await request.json()
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  return NextResponse.json(await deleteAdminProduct(slug))
}

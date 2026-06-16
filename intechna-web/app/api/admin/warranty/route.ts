import { NextResponse } from 'next/server'
import { getWarrantyRecords, getNextWarrantyCode, createWarranty } from '@/app/lib/db/queries'

export async function GET() {
  try {
    const records = await getWarrantyRecords()
    return NextResponse.json(records)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.serial || !body.customer || !body.product) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ các trường bắt buộc (Serial, Khách hàng, Sản phẩm)' },
        { status: 400 }
      )
    }

    const year = new Date().getFullYear()
    const code = await getNextWarrantyCode(year)

    const record = {
      code,
      serial: body.serial,
      customer: body.customer,
      product: body.product,
      purchaseDate: body.purchaseDate || '',
      warrantyUntil: body.warrantyUntil || '',
      status: body.status || 'Còn bảo hành',
      note: body.note || '',
    }

    const created = await createWarranty(record)
    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

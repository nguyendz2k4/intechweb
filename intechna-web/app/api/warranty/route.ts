import { NextResponse } from 'next/server'
import { or, sql } from 'drizzle-orm'
import { warranty } from '@/app/lib/db/schema'
import {
  displayWarrantyCode,
  publicWarrantyRecord,
  validateWarrantyQuery,
} from '@/app/lib/warranty'
import { ApiError, apiErrorResponse, enforceRateLimit } from '@/app/lib/api-security'

const privateHeaders = { 'Cache-Control': 'private, no-store, max-age=0' }

export async function GET(request: Request) {
  if (process.env.WARRANTY_LOOKUP_ENABLED === 'false')
    return apiErrorResponse(
      new ApiError('Tra cứu bảo hành tạm thời chưa khả dụng. Vui lòng gọi hotline.', 503),
    )
  const blocked = await enforceRateLimit(request, 'public:warranty', 20, 10 * 60 * 1000)
  if (blocked) return blocked
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  const validation = validateWarrantyQuery(query)
  if (validation)
    return NextResponse.json({ error: validation }, { status: 400, headers: privateHeaders })

  try {
    const { db } = await import('@/app/lib/db')
    const lookup = query.toLowerCase()
    const shortCode = displayWarrantyCode(query).toLowerCase()
    const records = await db
      .select({
        code: warranty.code,
        serial: warranty.serial,
        customer: warranty.customer,
        product: warranty.product,
        model: warranty.model,
        purchaseDate: warranty.purchaseDate,
        warrantyUntil: warranty.warrantyUntil,
        status: warranty.status,
      })
      .from(warranty)
      .where(
        or(
          sql`lower(${warranty.code}) = ${lookup}`,
          sql`lower(${warranty.serial}) = ${lookup}`,
          sql`lower(${warranty.code}) = ${shortCode}`,
          sql`(${warranty.code} REGEXP '^(INTECH|INT)-[0-9]{4}-[A-Fa-f0-9]{12}$' AND lower(concat('INT-', substring_index(${warranty.code}, '-', -1))) = ${shortCode})`,
        ),
      )
      .limit(2)
    if (records.length > 1)
      throw new ApiError('Có nhiều hồ sơ khớp. Vui lòng tra cứu bằng mã phiếu đầy đủ.')

    return NextResponse.json(records[0] ? publicWarrantyRecord(records[0]) : null, {
      headers: privateHeaders,
    })
  } catch (error) {
    if (error instanceof ApiError) return apiErrorResponse(error)
    return NextResponse.json(
      { error: 'Hệ thống tra cứu tạm thời chưa khả dụng. Vui lòng thử lại sau.' },
      { status: 503, headers: privateHeaders },
    )
  }
}

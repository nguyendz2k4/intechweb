import { NextResponse } from 'next/server'
import { searchWarranty } from '@/app/lib/db/queries'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  if (!q.trim()) return NextResponse.json(null)
  const result = await searchWarranty(q)
  return NextResponse.json(result)
}

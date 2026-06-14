import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { db } from '@/app/lib/db/index'
import { contactSubmissions } from '@/app/lib/db/schema'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: Request) {
  const body = await request.json()
  const { name, phone, email, note } = body

  if (!name?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: 'Thiếu họ tên hoặc số điện thoại' }, { status: 400 })
  }

  // 1. Lưu vào database
  await db.insert(contactSubmissions).values({
    name:  name.trim(),
    phone: phone.trim(),
    email: email?.trim() ?? '',
    note:  note?.trim() ?? '',
  })

  // 2. Gửi email thông báo cho chủ (nếu đã cấu hình Resend)
  if (resend && process.env.CONTACT_NOTIFY_EMAIL) {
    await resend.emails.send({
      from:    'Intech Website <onboarding@resend.dev>',
      to:      process.env.CONTACT_NOTIFY_EMAIL,
      replyTo: email || undefined,
      subject: `[Intech] Yêu cầu tư vấn mới từ ${name} — ${phone}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Yêu cầu tư vấn mới</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; background: #f8fafc; font-weight: bold; width: 140px; border: 1px solid #e2e8f0;">Họ tên</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">Điện thoại</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;"><a href="tel:${phone}">${phone}</a></td>
            </tr>
            ${email ? `<tr>
              <td style="padding: 10px; background: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">Email</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;"><a href="mailto:${email}">${email}</a></td>
            </tr>` : ''}
            ${note ? `<tr>
              <td style="padding: 10px; background: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">Nhu cầu</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${note}</td>
            </tr>` : ''}
          </table>
          <p style="color: #64748b; font-size: 13px; margin-top: 24px;">
            Gửi tự động từ website intechna.vn
          </p>
        </div>
      `,
    })
  }

  return NextResponse.json({ ok: true })
}

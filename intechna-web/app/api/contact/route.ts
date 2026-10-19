import { Resend } from 'resend'
import {
  ApiError,
  apiErrorResponse,
  assertAllowedKeys,
  enforceRateLimit,
  escapeHtml,
  readJsonObject,
  textField,
} from '@/app/lib/api-security'

export async function POST(request: Request) {
  if (process.env.CONTACT_ENABLED === 'false')
    return apiErrorResponse(
      new ApiError('Biểu mẫu liên hệ tạm thời chưa khả dụng. Vui lòng gọi hotline.', 503),
    )
  const blocked = await enforceRateLimit(request, 'public:contact', 5, 10 * 60 * 1000)
  if (blocked) return blocked
  try {
    const body = await readJsonObject(request, 16 * 1024)
    assertAllowedKeys(body, ['name', 'phone', 'email', 'note'])
    const name = textField(body, 'name', { required: true, max: 120, pattern: /^[^\r\n]+$/ })
    const phone = textField(body, 'phone', {
      required: true,
      min: 8,
      max: 20,
      pattern: /^[+\d\s().-]+$/,
    })
    if (phone.replace(/\D/g, '').length < 8) throw new ApiError('Số điện thoại không hợp lệ.')
    const email = textField(body, 'email', {
      max: 254,
      pattern: /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/,
    })
    const note = textField(body, 'note', { max: 3000 })
    const { db } = await import('@/app/lib/db')
    const { contactSubmissions } = await import('@/app/lib/db/schema')
    await db.insert(contactSubmissions).values({ name, phone, email, note })

    // Saved submissions are accepted even when optional email delivery fails.
    // Only an event name enters logs; provider errors and customer data stay private.
    if (process.env.RESEND_API_KEY && process.env.CONTACT_NOTIFY_EMAIL) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const fields = [
          ['Họ tên', name],
          ['Điện thoại', phone],
          ['Email', email],
          ['Nhu cầu', note],
        ]
        const result = await resend.emails.send({
          from: process.env.CONTACT_FROM_EMAIL || 'Intech Website <onboarding@resend.dev>',
          to: process.env.CONTACT_NOTIFY_EMAIL,
          replyTo: email || undefined,
          subject: '[Intech] Yêu cầu tư vấn mới',
          html: `<div style="font-family:sans-serif;max-width:600px"><h2>Yêu cầu tư vấn mới</h2><table>${fields
            .filter(([, value]) => value)
            .map(
              ([label, value]) =>
                `<tr><th style="text-align:left;padding:10px">${label}</th><td style="padding:10px;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`,
            )
            .join('')}</table><p>Gửi tự động từ website Intech.</p></div>`,
        })
        if (result.error) console.warn('contact.notification_failed')
      } catch {
        console.warn('contact.notification_failed')
      }
    }
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

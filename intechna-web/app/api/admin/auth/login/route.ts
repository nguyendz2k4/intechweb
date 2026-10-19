import {
  adminSessionCookie,
  adminEnrollmentCookie,
  adminEnrollmentRequestToken,
  adminEnrollmentUsername,
  beginAdminLogin,
  beginAdminEnrollment,
  confirmAdminEnrollment,
  createAdminSession,
  validateAdminRequest,
} from '@/app/lib/admin-auth'
import { consumeAdminTotp } from '@/app/lib/admin-auth-replay'
import {
  ApiError,
  apiErrorResponse,
  assertAllowedKeys,
  enforceRateLimit,
  readJsonObject,
  textField,
} from '@/app/lib/api-security'

export const runtime = 'nodejs'
const noStore = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

function sessionResponse({ token, session }: Awaited<ReturnType<typeof createAdminSession>>) {
  console.info(
    JSON.stringify({
      event: 'admin.login_succeeded',
      actor: session.username,
      role: session.role,
      at: new Date().toISOString(),
    }),
  )
  const response = Response.json(session, { headers: noStore })
  response.headers.append('Set-Cookie', adminSessionCookie(token, session.expiresAt))
  response.headers.append('Set-Cookie', adminEnrollmentCookie())
  return response
}

export async function POST(request: Request) {
  const requestError = validateAdminRequest(request)
  if (requestError) return requestError
  try {
    const globalLimit = await enforceRateLimit(request, 'admin-login', 20, 60_000)
    if (globalLimit) return globalLimit
    const body = await readJsonObject(request, 2048)
    assertAllowedKeys(body, ['action', 'username', 'password', 'code'])
    if (body.action === 'mfa-confirm') {
      const token = adminEnrollmentRequestToken(request)
      const username = await adminEnrollmentUsername(token)
      if (!username)
        throw new ApiError(
          'Phiên thiết lập đã hết hạn hoặc đã hoàn tất. Vui lòng đăng nhập lại.',
          401,
        )
      const limited = await enforceRateLimit(
        request,
        'admin-enrollment-confirm',
        5,
        300_000,
        username,
      )
      if (limited) return limited
      const code = textField(body, 'code', { required: true, max: 6, pattern: /^\d{6}$/ })
      return sessionResponse(await confirmAdminEnrollment(token, code))
    }
    if (body.action !== undefined) throw new ApiError('Thao tác đăng nhập không hợp lệ.')
    const username = textField(body, 'username', { required: true, max: 80 })
    // Preserve password whitespace; trimming would silently change credentials.
    if (
      typeof body.password !== 'string' ||
      body.password.length === 0 ||
      body.password.length > 256
    )
      throw new ApiError('Thông tin đăng nhập không hợp lệ.')
    const code =
      body.code === undefined ? '' : textField(body, 'code', { max: 6, pattern: /^\d{6}$/ })
    const accountLimit = await enforceRateLimit(
      request,
      'admin-login-account',
      5,
      300_000,
      username.toLowerCase(),
    )
    if (accountLimit) return accountLimit
    const authenticated = await beginAdminLogin(username, body.password, code)
    if (!authenticated) {
      console.info(JSON.stringify({ event: 'admin.login_failed', at: new Date().toISOString() }))
      return Response.json(
        { error: 'Tên đăng nhập, mật khẩu hoặc mã xác thực không hợp lệ.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    if (authenticated.step === 'mfa-setup') {
      const setup = await beginAdminEnrollment(authenticated, adminEnrollmentRequestToken(request))
      return Response.json(
        {
          step: 'mfa-setup',
          username: authenticated.username,
          secret: setup.secret,
          expiresIn: setup.expiresIn,
        },
        {
          headers: { ...noStore, 'Set-Cookie': adminEnrollmentCookie(setup.token) },
        },
      )
    }
    if (authenticated.step === 'mfa-required')
      return Response.json({ step: 'mfa-required' }, { headers: noStore })
    if (
      authenticated.totpCounter !== null &&
      !(await consumeAdminTotp(authenticated.replayIdentity, authenticated.totpCounter))
    ) {
      console.info(JSON.stringify({ event: 'admin.login_failed', at: new Date().toISOString() }))
      return Response.json(
        { error: 'Mã xác thực đã được sử dụng. Vui lòng chờ mã tiếp theo.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    return sessionResponse(
      await createAdminSession(authenticated.username, undefined, authenticated.version),
    )
  } catch (error) {
    return apiErrorResponse(error)
  }
}

import {
  adminMfaEnabled,
  adminMfaRequired,
  adminRequestToken,
  adminTotpReplayIdentity,
  assertAdminCredentialVersion,
  authenticateAdmin,
  clearAdminSessionCookie,
  currentAdminSessionCount,
  decryptAdminTotp,
  encryptAdminTotp,
  generateAdminTotp,
  getAdminSession,
  hashAdminPassword,
  matchTotpCounter,
  requireAdmin,
} from '@/app/lib/admin-auth'
import {
  changeCredential,
  loadCredential,
  pendingMfa,
  revokeSessions,
} from '@/app/lib/admin-auth-store'
import { consumeAdminTotp } from '@/app/lib/admin-auth-replay'
import { logAdminAction } from '@/app/lib/admin-audit'
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

export async function GET(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied
  try {
    const session = (await getAdminSession(request))!
    return Response.json(
      {
        username: session.username,
        role: session.role,
        mfaEnabled: await adminMfaEnabled(session.username),
        mfaRequired: adminMfaRequired(),
        activeSessions: await currentAdminSessionCount(session.username),
        expiresAt: session.expiresAt,
      },
      { headers: noStore },
    )
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied
  try {
    const session = (await getAdminSession(request))!
    const limited = await enforceRateLimit(request, 'admin:security', 5, 300_000, session.username)
    if (limited) return limited
    const body = await readJsonObject(request, 4096)
    assertAllowedKeys(body, ['action', 'password', 'code', 'currentCode', 'newPassword'])
    const action = textField(body, 'action', { required: true, max: 30 })
    if (!['password', 'mfa-begin', 'mfa-confirm', 'revoke-all'].includes(action))
      throw new ApiError('Thao tác bảo mật không hợp lệ.')
    if (!adminMfaRequired() && ['mfa-begin', 'mfa-confirm'].includes(action))
      throw new ApiError('Xác thực hai bước đang tắt trên website này.')
    if (typeof body.password !== 'string' || !body.password.length || body.password.length > 256)
      throw new ApiError('Vui lòng nhập mật khẩu hiện tại.')
    const code = textField(body, action === 'mfa-confirm' ? 'currentCode' : 'code', {
      max: 6,
      pattern: /^\d{6}$/,
    })
    const authenticated = await authenticateAdmin(session.username, body.password, code)
    if (!authenticated) throw new ApiError('Mật khẩu hoặc mã xác thực hiện tại không hợp lệ.')
    if (
      authenticated.totpCounter !== null &&
      !(await consumeAdminTotp(authenticated.replayIdentity, authenticated.totpCounter))
    )
      throw new ApiError('Mã xác thực đã được dùng. Vui lòng chờ mã tiếp theo.')
    const credential = await loadCredential(session.username)
    await assertAdminCredentialVersion(session.username, authenticated.version)
    const token = adminRequestToken(request)!
    if (action === 'mfa-begin') {
      const secret = generateAdminTotp()
      await pendingMfa(token, encryptAdminTotp(session.username, secret))
      await logAdminAction(request, 'auth.mfa_begin', 'self')
      return Response.json(
        {
          secret,
          uri: `otpauth://totp/${encodeURIComponent(`Intech:${session.username}`)}?secret=${secret}&issuer=Intech&algorithm=SHA1&digits=6&period=30`,
          expiresIn: 600,
        },
        { headers: noStore },
      )
    }
    if (action === 'password') {
      if (
        typeof body.newPassword !== 'string' ||
        body.newPassword.length < 12 ||
        body.newPassword.length > 256 ||
        body.newPassword === body.password
      )
        throw new ApiError('Mật khẩu mới cần 12–256 ký tự và khác mật khẩu hiện tại.')
      await changeCredential(session.username, credential.revision, {
        passwordHash: await hashAdminPassword(body.newPassword),
        totpEncrypted: credential.totpEncrypted,
      })
      await logAdminAction(request, 'auth.password_change', 'self', session)
    } else if (action === 'mfa-confirm') {
      const pending = await pendingMfa(token)
      if (!pending) throw new ApiError('Thiết lập MFA đã hết hạn. Vui lòng bắt đầu lại.', 409)
      const secret = decryptAdminTotp(session.username, pending)
      const newCode = textField(body, 'code', { required: true, max: 6, pattern: /^\d{6}$/ })
      const counter = matchTotpCounter(secret, newCode)
      if (counter === null) throw new ApiError('Mã từ ứng dụng xác thực mới chưa đúng.')
      if (!(await consumeAdminTotp(adminTotpReplayIdentity(session.username, secret), counter)))
        throw new ApiError('Mã mới đã được sử dụng. Vui lòng chờ mã tiếp theo.')
      await changeCredential(session.username, credential.revision, {
        passwordHash: credential.passwordHash,
        totpEncrypted: pending,
      })
      await logAdminAction(request, 'auth.mfa_change', 'self', session)
    } else {
      await revokeSessions(session.username)
      await logAdminAction(request, 'auth.revoke_all', 'self', session)
    }
    return Response.json(
      { ok: true, message: 'Đã cập nhật bảo mật và thu hồi các phiên. Vui lòng đăng nhập lại.' },
      { headers: { ...noStore, 'Set-Cookie': clearAdminSessionCookie() } },
    )
  } catch (error) {
    return apiErrorResponse(error)
  }
}

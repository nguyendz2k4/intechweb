'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { adminRequest, errorMessage, Notice, type AdminNotice } from '../AdminUi'

type Security = {
  username: string
  mfaEnabled: boolean
  mfaRequired: boolean
  activeSessions: number
}
export function AccountSecurity() {
  const [info, setInfo] = useState<Security | null>(null)
  const [password, setPassword] = useState(''),
    [code, setCode] = useState('')
  const [nextPassword, setNextPassword] = useState(''),
    [confirmPassword, setConfirmPassword] = useState('')
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null),
    [newCode, setNewCode] = useState('')
  const [notice, setNotice] = useState<AdminNotice>(null),
    [busy, setBusy] = useState(false)
  const load = useCallback(
    (signal?: AbortSignal) =>
      adminRequest<Security>('/api/admin/auth/security', { signal })
        .then((data) => {
          if (signal?.aborted) return
          setInfo(data)
          setNotice(null)
        })
        .catch((error: unknown) => {
          if (signal?.aborted) return
          setNotice({ type: 'error', message: errorMessage(error) })
        }),
    [],
  )
  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])
  async function action(kind: string, event?: FormEvent) {
    event?.preventDefault()
    if (busy) return
    if (kind === 'password' && nextPassword !== confirmPassword) {
      setNotice({ type: 'error', message: 'Hai mật khẩu mới chưa khớp.' })
      return
    }
    setBusy(true)
    setNotice(null)
    try {
      const result = await adminRequest<{ secret?: string; uri?: string }>(
        '/api/admin/auth/security',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: kind,
            password,
            code: kind === 'mfa-confirm' ? newCode : code,
            currentCode: code,
            newPassword: nextPassword,
          }),
        },
      )
      if (kind === 'mfa-begin' && result.secret && result.uri) {
        setSetup({ secret: result.secret, uri: result.uri })
        setCode('')
        setNotice({
          type: 'success',
          message: 'Thêm khóa vào ứng dụng xác thực, rồi nhập mã mới để hoàn tất trong 10 phút.',
        })
      } else {
        setPassword('')
        setNextPassword('')
        setSetup(null)
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Credential changes require a fresh document and server session check.
        window.location.assign('/admin-login')
      }
    } catch (error) {
      setNotice({ type: 'error', message: errorMessage(error) })
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Notice notice={notice} />
      {!info ? (
        <section className="admin-card">
          <p>Đang tải thông tin tài khoản…</p>
          <button className="admin-btn" onClick={() => void load()}>
            Tải lại
          </button>
        </section>
      ) : (
        <>
          <section className="admin-card">
            <h2>{info.username}</h2>
            <p>
              {!info.mfaRequired
                ? 'Đăng nhập bằng tài khoản và mật khẩu.'
                : info.mfaEnabled
                  ? 'Xác thực hai bước đang bật.'
                  : 'Xác thực hai bước chưa bật.'}{' '}
              · {info.activeSessions} phiên đang hoạt động
            </p>
          </section>
          <div className="admin-split">
            <section className="admin-card">
              <h2>Xác nhận chủ tài khoản</h2>
              <div className="admin-form">
                <label>
                  <span>Mật khẩu hiện tại</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    maxLength={256}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={busy}
                  />
                </label>
                {info.mfaEnabled && (
                  <label>
                    <span>Mã xác thực hiện tại</span>
                    <input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      disabled={busy}
                    />
                  </label>
                )}
                {info.mfaEnabled && (
                  <p>Mỗi mã xác thực chỉ dùng một lần. Sau một thao tác, hãy chờ mã tiếp theo.</p>
                )}
              </div>
            </section>
            <section className="admin-card">
              <h2>Đổi mật khẩu</h2>
              <form className="admin-form" onSubmit={(event) => void action('password', event)}>
                <label>
                  <span>Mật khẩu mới</span>
                  <input
                    required
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={256}
                    value={nextPassword}
                    onChange={(event) => setNextPassword(event.target.value)}
                    disabled={busy}
                  />
                </label>
                <label>
                  <span>Nhập lại mật khẩu mới</span>
                  <input
                    required
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={256}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={busy}
                  />
                </label>
                <button className="admin-btn primary" disabled={busy || !password}>
                  Đổi mật khẩu và đăng xuất
                </button>
              </form>
            </section>
            {info.mfaRequired && (
              <section className="admin-card">
                <h2>{info.mfaEnabled ? 'Đổi ứng dụng xác thực' : 'Bật xác thực hai bước'}</h2>
                {!setup ? (
                  <>
                    <p>
                      Dùng ứng dụng xác thực trên điện thoại. Thiết lập chỉ hoàn tất sau khi mã mới
                      được xác nhận.
                    </p>
                    <button
                      className="admin-btn"
                      disabled={busy || !password}
                      onClick={() => void action('mfa-begin')}
                    >
                      Bắt đầu thiết lập MFA
                    </button>
                  </>
                ) : (
                  <form
                    className="admin-form"
                    onSubmit={(event) => void action('mfa-confirm', event)}
                  >
                    <p>
                      Chọn thêm tài khoản bằng khóa thiết lập trong ứng dụng, tên Intech, mã dựa
                      trên thời gian.
                    </p>
                    <label>
                      <span>Khóa thiết lập riêng tư</span>
                      <input readOnly value={setup.secret} autoComplete="off" />
                    </label>
                    <a className="admin-btn" href={setup.uri}>
                      Mở ứng dụng xác thực
                    </a>
                    <label>
                      <span>Mã từ ứng dụng mới</span>
                      <input
                        required
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={newCode}
                        onChange={(event) => setNewCode(event.target.value)}
                      />
                    </label>
                    <button className="admin-btn primary" disabled={busy || !password}>
                      Xác nhận MFA và đăng xuất
                    </button>
                    <button
                      className="admin-btn"
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setSetup(null)
                        setNewCode('')
                      }}
                    >
                      Hủy thiết lập
                    </button>
                  </form>
                )}
              </section>
            )}
            <section className="admin-card">
              <h2>Thu hồi mọi phiên</h2>
              <p>
                Đăng xuất tài khoản này trên tất cả thiết bị, kể cả cookie đã bị sao chép. Bạn cần
                đăng nhập lại.
              </p>
              <button
                className="admin-btn danger"
                disabled={busy || !password}
                onClick={() => void action('revoke-all')}
              >
                Đăng xuất trên mọi thiết bị
              </button>
            </section>
          </div>
        </>
      )}
    </>
  )
}

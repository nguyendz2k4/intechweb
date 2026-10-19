'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'

type LoginStep = 'credentials' | 'mfa-required' | 'mfa-setup'

export default function AdminLogin({ initialError = '' }: { initialError?: string }) {
  const [error, setError] = useState(initialError)
  const [pending, setPending] = useState(false)
  const [step, setStep] = useState<LoginStep>('credentials')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [setupKey, setSetupKey] = useState('')
  const [copied, setCopied] = useState(false)

  function startOver() {
    setStep('credentials')
    setPassword('')
    setCode('')
    setSetupKey('')
    setCopied(false)
    setError('')
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError('')
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          step === 'mfa-setup'
            ? { action: 'mfa-confirm', code }
            : { username, password, ...(step === 'mfa-required' ? { code } : {}) },
        ),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'Đăng nhập chưa thành công. Vui lòng thử lại.')
        setCode('')
        return
      }
      if (result.step === 'mfa-setup' && typeof result.secret === 'string') {
        setSetupKey(result.secret)
        setPassword('')
        setCode('')
        setStep('mfa-setup')
        return
      }
      if (result.step === 'mfa-required') {
        setCode('')
        setStep('mfa-required')
        return
      }
      setPassword('')
      setSetupKey('')
      // Reload the document so server components read the newly issued session cookie.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/admin')
    } catch {
      setError('Không thể kết nối. Vui lòng thử lại sau.')
    } finally {
      setPending(false)
    }
  }

  const title =
    step === 'mfa-setup'
      ? 'Thiết lập xác thực lần đầu'
      : step === 'mfa-required'
        ? 'Nhập mã xác thực'
        : 'Chào mừng trở lại'

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <Link href="/" className="admin-brand">
          <span className="admin-mark">I</span>
          <strong>INTECH</strong>
        </Link>
        <p className="admin-eyebrow">QUẢN TRỊ NỘI DUNG</p>
        <h1 id="admin-login-title">{title}</h1>
        <p className="admin-note">
          {step === 'mfa-setup'
            ? 'Thêm tài khoản vào Google Authenticator, rồi xác nhận mã để vào trang quản trị.'
            : step === 'mfa-required'
              ? `Mở Google Authenticator và nhập mã của tài khoản ${username}.`
              : 'Nhập tài khoản và mật khẩu để đăng nhập quản trị.'}
        </p>
        <form onSubmit={login} className="admin-form">
          {step === 'credentials' ? (
            <>
              <label>
                Email hoặc tên đăng nhập
                <input
                  name="username"
                  autoComplete="username"
                  required
                  maxLength={80}
                  autoCapitalize="none"
                  spellCheck={false}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={pending}
                />
              </label>
              <label>
                Mật khẩu
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={256}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={pending}
                />
              </label>
            </>
          ) : (
            <>
              {step === 'mfa-setup' && (
                <>
                  <ol>
                    <li>
                      Mở Google Authenticator trên điện thoại, bấm dấu + và chọn Nhập khóa thiết
                      lập.
                    </li>
                    <li>
                      Đặt tên tài khoản là INTECH: {username}. Dán khóa bên dưới và chọn Dựa trên
                      thời gian.
                    </li>
                    <li>Bấm Thêm, rồi nhập mã 6 số đang hiển thị trong ứng dụng.</li>
                  </ol>
                  <label>
                    Khóa thiết lập Google Authenticator
                    <input
                      name="setup-key"
                      readOnly
                      value={setupKey}
                      autoComplete="off"
                      spellCheck={false}
                      onFocus={(event) => event.currentTarget.select()}
                    />
                  </label>
                  <button
                    type="button"
                    className="admin-btn"
                    disabled={pending}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(setupKey)
                        setCopied(true)
                      } catch {
                        setError('Chạm vào ô khóa để chọn và sao chép thủ công.')
                      }
                    }}
                  >
                    {copied ? 'Đã sao chép khóa' : 'Sao chép khóa'}
                  </button>
                  <p className="admin-note">
                    Chỉ thiết lập một lần. Những lần đăng nhập sau dùng mã từ tài khoản này, không
                    cần thêm khóa mới.
                  </p>
                </>
              )}
              <label>
                Mã xác thực 2 bước
                <input
                  key={step}
                  name="code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  placeholder="6 chữ số từ Google Authenticator"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  disabled={pending}
                />
              </label>
              {step === 'mfa-required' && (
                <p className="admin-note">
                  Mỗi lần đăng nhập đều cần mã xác thực. Dùng tài khoản đã thêm trong Google
                  Authenticator.
                </p>
              )}
            </>
          )}
          {error && (
            <p role="alert" className="admin-note error">
              {error}
            </p>
          )}
          <button type="submit" className="admin-btn primary" disabled={pending}>
            {pending
              ? 'Đang xác thực…'
              : step === 'credentials'
                ? 'Đăng nhập'
                : step === 'mfa-setup'
                  ? 'Xác nhận và vào quản trị'
                  : 'Đăng nhập'}
          </button>
          {step !== 'credentials' && (
            <button type="button" className="admin-btn" disabled={pending} onClick={startOver}>
              Nhập lại tài khoản
            </button>
          )}
        </form>
        <Link href="/" className="admin-login-back">
          ← Về website Intech
        </Link>
      </section>
    </main>
  )
}

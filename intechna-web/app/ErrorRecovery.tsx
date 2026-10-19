'use client'

import styles from './not-found.module.css'

export default function ErrorRecovery({ reset, digest }: { reset: () => void; digest?: string }) {
  // Native links restart the whole document even if the root layout or client router failed.
  return (
    <>
      <title>Trang tạm thời gặp sự cố | Intech</title>
      <meta name="robots" content="noindex" />
      <main className={styles.page} aria-labelledby="error-title">
        <div className={styles.content}>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Error recovery requires full document navigation, including when the root layout failed. */}
          <a className={styles.brand} href="/" aria-label="Intech — về trang chủ">
            intech<span>.</span>
          </a>
          <p className={styles.code} aria-hidden="true">
            500
          </p>
          <h1 id="error-title" className={styles.title}>
            Trang tạm thời gặp sự cố.
          </h1>
          <p className={styles.description}>
            Chúng tôi chưa thể tải nội dung lúc này. Bạn có thể thử lại hoặc quay về trang chủ. Nếu
            sự cố tiếp diễn, hãy liên hệ Intech để được hỗ trợ.
          </p>
          <div className={styles.actions}>
            <button className={styles.primary} type="button" onClick={reset}>
              Thử lại
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Error recovery must restart the document when the root layout failed. */}
            <a className={styles.secondary} href="/">
              Về trang chủ
            </a>
          </div>
          <p className={styles.support}>
            <a href="/lien-he">Liên hệ hỗ trợ</a>
            {digest && <span className={styles.reference}>Mã sự cố: {digest}</span>}
          </p>
        </div>
      </main>
    </>
  )
}

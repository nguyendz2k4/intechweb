import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './not-found.module.css'

export const metadata: Metadata = {
  title: 'Không tìm thấy trang',
  description:
    'Trang bạn tìm kiếm không tồn tại. Quay lại trang chủ hoặc khám phá danh mục thiết bị mạng Intech.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <main className={styles.page} aria-labelledby="not-found-title">
      <div className={styles.content}>
        <Link className={styles.brand} href="/" aria-label="Intech — về trang chủ">
          intech<span>.</span>
        </Link>
        <p className={styles.code} aria-hidden="true">
          404
        </p>
        <h1 id="not-found-title" className={styles.title}>
          Không tìm thấy trang.
        </h1>
        <p className={styles.description}>
          Đường dẫn có thể đã thay đổi hoặc trang không còn tồn tại. Bạn có thể bắt đầu lại từ trang
          chủ hoặc khám phá danh mục thiết bị của Intech.
        </p>
        <nav className={styles.actions} aria-label="Tiếp tục khám phá Intech">
          <Link className={styles.primary} href="/">
            Về trang chủ
          </Link>
          <Link className={styles.secondary} href="/san-pham/catalog">
            Xem danh mục sản phẩm
          </Link>
        </nav>
        <p className={styles.support}>
          Cần hỗ trợ tìm thiết bị? <Link href="/lien-he">Liên hệ Intech</Link>
        </p>
      </div>
    </main>
  )
}

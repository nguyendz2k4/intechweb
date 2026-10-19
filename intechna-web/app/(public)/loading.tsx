import styles from './loading.module.css'

export default function PublicLoading() {
  return (
    <main className={styles.loading}>
      <p className={styles.status} role="status" aria-live="polite" aria-atomic="true">
        <span className={styles.dot} aria-hidden="true" />
        Đang tải nội dung…
      </p>
      <div role="region" aria-label="Nội dung trang" aria-busy="true">
        <div aria-hidden="true">
          <div className={styles.intro}>
            <div className={`${styles.placeholder} ${styles.eyebrow}`} />
            <div className={`${styles.placeholder} ${styles.title}`} />
            <div className={`${styles.placeholder} ${styles.description}`} />
          </div>
          <div className={styles.cards}>
            {[0, 1, 2].map((index) => (
              <div className={styles.card} key={index}>
                <div className={`${styles.placeholder} ${styles.image}`} />
                <div className={`${styles.placeholder} ${styles.cardTitle}`} />
                <div className={`${styles.placeholder} ${styles.cardDescription}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

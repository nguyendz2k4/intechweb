'use client'

import ErrorRecovery from './ErrorRecovery'

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <html lang="vi">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0 }}>
        <ErrorRecovery reset={retry} digest={error.digest} />
      </body>
    </html>
  )
}

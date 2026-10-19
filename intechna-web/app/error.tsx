'use client'

import ErrorRecovery from './ErrorRecovery'

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return <ErrorRecovery reset={retry} digest={error.digest} />
}

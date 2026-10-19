import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'

// Passenger may require() this entry point. Keep startup free of top-level await.
process.env.NODE_ENV ??= 'production'
let startupStage = 'passenger-config'

function reportStartupFailure(error) {
  // Never log raw exception messages: dependency errors can include credentials.
  const code =
    typeof error?.code === 'string' && /^[A-Z][A-Z0-9_]{0,63}$/.test(error.code)
      ? error.code
      : 'UNKNOWN'
  console.error(
    `Website startup failed [stage=${startupStage}, code=${code}]. Check the production build and environment privately.`,
  )
}

async function startServer() {
  const passenger = globalThis.PhusionPassenger
  // Explicit binding prevents Next or other libraries from taking Passenger's socket.
  passenger?.configure({ autoInstall: false })
  startupStage = 'environment-load'
  await import('./scripts/load-env.mjs')
  startupStage = 'admin-config-check'
  const { logAdminEnvironment } = await import('./scripts/admin-config-diagnostics.mjs')
  logAdminEnvironment(process.env)
  startupStage = 'build-mode'
  if (process.env.NEXT_STANDALONE === 'true')
    throw new Error('Custom server requires the normal Next.js build.')

  startupStage = 'next-import'
  const { default: next } = await import('next')
  startupStage = 'server-config'
  const port = Number(process.env.PORT || 3000)
  const hostname = process.env.HOSTNAME || '0.0.0.0'
  if (!passenger && (!Number.isInteger(port) || port < 1 || port > 65535))
    throw new Error('PORT must be an integer between 1 and 65535.')

  let handle
  const server = createServer((request, response) => {
    Promise.resolve(handle(request, response)).catch(() => {
      console.error('Request failed; inspect application configuration privately.')
      if (response.headersSent) response.destroy()
      else {
        response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
        response.end('Internal Server Error')
      }
    })
  })
  startupStage = 'next-create'
  const app = next({
    dev: false,
    dir: fileURLToPath(new URL('./', import.meta.url)),
    hostname,
    port,
    httpServer: server,
  })
  startupStage = 'next-prepare'
  await app.prepare()
  handle = app.getRequestHandler()
  server.on('error', (error) => {
    startupStage = 'server-listen'
    reportStartupFailure(error)
    process.exit(1)
  })
  server.on('listening', () => {
    console.log(
      passenger
        ? 'Next.js production server ready for Passenger.'
        : `Next.js production server listening on port ${port}.`,
    )
  })
  startupStage = 'server-listen'
  if (passenger) server.listen('passenger')
  else server.listen(port, hostname)

  let stopping = false
  const stop = () => {
    if (stopping) return
    stopping = true
    const deadline = setTimeout(() => process.exit(1), 10_000)
    deadline.unref()
    server.close(() => {
      app
        .close()
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
    })
    server.closeIdleConnections()
  }
  process.once('SIGTERM', stop)
  process.once('SIGINT', stop)
}

startServer().catch((error) => {
  reportStartupFailure(error)
  process.exit(1)
})

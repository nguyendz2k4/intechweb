import mysql from 'mysql2/promise'
import { readFileSync } from 'node:fs'

export function databaseConfigured(env = process.env) {
  return Boolean(env.DATABASE_URL || (env.DB_HOST && env.DB_NAME && env.DB_USER))
}

/** One configuration parser for the web, CLI maintenance and Drizzle. Never logs secrets. */
export function mysqlOptions(env = process.env, connectionUrl = env.DATABASE_URL) {
  let host = env.DB_HOST ?? 'localhost',
    port = Number(env.DB_PORT ?? 3306),
    user = env.DB_USER,
    password = env.DB_PASSWORD ?? '',
    database = env.DB_NAME
  if (connectionUrl) {
    let url
    try {
      url = new URL(connectionUrl)
      if (url.protocol !== 'mysql:' || url.search || url.hash) throw new Error()
      host = url.hostname
      port = Number(url.port || 3306)
      user = decodeURIComponent(url.username)
      password = decodeURIComponent(url.password)
      database = decodeURIComponent(url.pathname.slice(1))
    } catch {
      throw new Error('DATABASE_URL must be a mysql:// connection without query parameters.')
    }
  }
  if (
    !host ||
    !user ||
    !database ||
    /[/\\\0]/.test(database) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  )
    throw new Error('Configure DB_HOST, DB_PORT, DB_NAME, DB_USER and DB_PASSWORD in .env.local.')
  if (env.NODE_ENV === 'production' && !password)
    throw new Error('DB_PASSWORD is required in production.')
  const connectionLimit = Number(env.DB_CONNECTION_LIMIT ?? 5)
  if (!Number.isInteger(connectionLimit) || connectionLimit < 1 || connectionLimit > 20)
    throw new Error('DB_CONNECTION_LIMIT must be between 1 and 20.')
  if (env.DB_SSL && !['true', 'false'].includes(env.DB_SSL))
    throw new Error('DB_SSL must be true or false.')
  return {
    host,
    port,
    user,
    password,
    database,
    charset: 'utf8mb4',
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit,
    queueLimit: 100,
    connectTimeout: 10_000,
    enableKeepAlive: true,
    multipleStatements: false,
    ...(env.DB_SSL === 'true'
      ? {
          ssl: {
            rejectUnauthorized: true,
            ...(env.DB_SSL_CA_FILE ? { ca: readFileSync(env.DB_SSL_CA_FILE, 'utf8') } : {}),
          },
        }
      : {}),
  }
}

export function isDuplicateEntry(error) {
  // Drizzle wraps driver errors in a cause. Only unique-key collisions are recoverable.
  for (let current = error, depth = 0; current && depth < 5; current = current.cause, depth++)
    if (current.code === 'ER_DUP_ENTRY' || current.errno === 1062) return true
  return false
}

/** @param {import('mysql2/promise').Pool | import('mysql2/promise').PoolConnection} client */
function executor(client) {
  return {
    /** @template T @param {string} statement @param {unknown[]} [parameters] @returns {Promise<T[]>} */
    async query(statement, parameters = []) {
      const [rows] = await client.execute(statement, parameters)
      if (!Array.isArray(rows)) throw new Error('Expected database rows.')
      return /** @type {T[]} */ (rows)
    },
    /** @param {string} statement @param {unknown[]} [parameters] @returns {Promise<import('mysql2').ResultSetHeader>} */
    async execute(statement, parameters = []) {
      const [result] = await client.execute(statement, parameters)
      return /** @type {import('mysql2').ResultSetHeader} */ (result)
    },
  }
}

/** @param {import('mysql2/promise').Pool} pool */
export function mysqlDatabase(pool) {
  return {
    ...executor(pool),
    /** @template T @param {(connection: ReturnType<typeof executor>) => Promise<T>} work @param {{readOnly?: boolean, isolation?: 'READ COMMITTED' | 'REPEATABLE READ'}} [options] @returns {Promise<T>} */
    async transaction(work, options = {}) {
      const connection = await pool.getConnection()
      try {
        // UTC is explicit for server expressions as well as Date serialization in the driver.
        await connection.query("SET time_zone = '+00:00'")
        await connection.query(
          'SET TRANSACTION ISOLATION LEVEL ' +
            (options.isolation === 'REPEATABLE READ' ? 'REPEATABLE READ' : 'READ COMMITTED'),
        )
        await connection.query(
          options.readOnly ? 'START TRANSACTION READ ONLY' : 'START TRANSACTION',
        )
        const result = await work(executor(connection))
        await connection.commit()
        return result
      } catch (error) {
        await connection.rollback().catch(() => {})
        throw error
      } finally {
        connection.release()
      }
    },
    close: () => pool.end(),
  }
}

/** Separate pools for maintenance credentials; application requests share one bounded pool. */
export function createMysqlDatabase(env = process.env, connectionUrl = env.DATABASE_URL) {
  return mysqlDatabase(mysql.createPool(mysqlOptions(env, connectionUrl)))
}

/** @type {import('mysql2/promise').Pool | undefined} */
let applicationPool
export function getMysqlPool() {
  applicationPool ??= mysql.createPool(mysqlOptions())
  return applicationPool
}
export function getMysqlDatabase() {
  return mysqlDatabase(getMysqlPool())
}

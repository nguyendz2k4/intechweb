import { drizzle } from 'drizzle-orm/mysql2'
import { getMysqlPool } from './mysql-client.mjs'
import * as schema from './schema'

export const db = drizzle(getMysqlPool(), { schema, mode: 'default' })

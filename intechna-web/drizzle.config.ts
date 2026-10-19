import { defineConfig } from 'drizzle-kit'
import './scripts/load-env.mjs'
import { mysqlOptions } from './app/lib/db/mysql-client.mjs'

export default defineConfig({
  schema: './app/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: mysqlOptions(),
})

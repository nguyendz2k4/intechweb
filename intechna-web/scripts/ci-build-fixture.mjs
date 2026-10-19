// Synthetic records are confined to tests and the isolated build checkout.
export const fixtureDatabaseUrl = 'mysql://fixture:fixture@ci-build.intechna.invalid/intechna'
const rowsByTable = {
  products: [
    {
      id: 1,
      slug: 'ci-switch',
      name: 'CI fixture switch',
      brand: 'Cisco',
      category: 'Switch',
      category_slug: 'switch',
      badges: '["Switch"]',
      summary: 'CI rendering fixture',
      price_vnd: null,
      specs: '["8 ports","Gigabit","Managed","PoE","Rack"]',
      applications: '["Office"]',
      image_url: '',
      datasheet_url: '',
      status: 'published',
      created_at: '2026-01-01 00:00:00.000',
    },
  ],
  posts: [
    {
      id: 1,
      slug: 'ci-article',
      title: 'CI article',
      description: 'CI rendering fixture',
      body: 'A test body.',
      status: 'published',
      published_at: '2026-01-01 00:00:00.000',
    },
  ],
  services: [
    {
      id: 1,
      slug: 'ci-service',
      title: 'CI service',
      description: 'CI rendering fixture',
      keywords: 'network',
      deliverables: '["Installation"]',
      benefits: '["Connectivity"]',
      status: 'published',
    },
  ],
}
export function fixtureQueryResult({ query, params = [] }, emptyCatalog = false) {
  if (
    typeof query !== 'string' ||
    /;|--|\/\*|\b(insert|update|delete|drop|alter|create)\b/i.test(query)
  )
    throw new Error('CI fixture rejects mutations and unsupported SQL')
  const match =
    /^select (.+) from `(products|posts|services)`(?: where (.+?))?(?: order by .+?)?(?: limit (\?|\d+))?$/i.exec(
      query,
    )
  if (!match) throw new Error('CI fixture does not support query: ' + query)
  const [, selection, table, condition = '', limit] = match
  const columns = selection.split(',').map((column) => {
    const name = /^\s*`([a-z_]+)`\s*$/.exec(column)?.[1]
    if (!name || !(name in rowsByTable[table][0]))
      throw new Error('CI fixture does not support column')
    return name
  })
  const predicates = [
    ...condition.matchAll(/`(?:products|posts|services)`\.`([a-z_]+)`\s*(=|<>)\s*\?/g),
  ]
  if (condition && !predicates.length) throw new Error('CI fixture does not support condition')
  let rows =
    emptyCatalog && table === 'products'
      ? []
      : rowsByTable[table].filter((row) =>
          predicates.every(([, column, operator], index) => {
            const equal = row[column] === params[index]
            return operator === '=' ? equal : !equal
          }),
        )
  if (limit) rows = rows.slice(0, Number(limit === '?' ? params[predicates.length] : limit))
  return [rows.map((row) => columns.map((column) => row[column])), []]
}
export function fixturePool() {
  if (process.env.DATABASE_URL !== fixtureDatabaseUrl)
    throw new Error('CI database adapter is restricted to an isolated fixture URL')
  return {
    query: async (options, params) =>
      fixtureQueryResult(
        { query: typeof options === 'string' ? options : options.sql, params },
        process.env.CI_EMPTY_CATALOG === 'true',
      ),
  }
}

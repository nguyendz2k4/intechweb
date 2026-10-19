import { servicePages, solutionPages } from '../data'

export type PublicService = (typeof servicePages)[number]
export type StoredService = {
  slug: string
  title: string
  description: string | null
  keywords: string | null
  deliverables: string[]
  benefits: string[]
  status: 'published' | 'draft'
}

export type PublicSolution =
  | ((typeof solutionPages)[number] & { contentType: 'solution' })
  | (PublicService & { contentType: 'service' })

function publicService(row: StoredService): PublicService {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description ?? '',
    keywords: (row.keywords ?? '')
      .split(',')
      .map((word) => word.trim())
      .filter(Boolean),
    deliverables: row.deliverables,
    benefits: row.benefits,
  }
}

export function mergePublicServices(rows: StoredService[]): PublicService[] {
  const overrides = new Map(rows.map((row) => [row.slug, row]))
  const result = servicePages.flatMap((original) => {
    const row = overrides.get(original.slug)
    overrides.delete(original.slug)
    return row ? (row.status === 'published' ? [publicService(row)] : []) : [original]
  })
  return [
    ...result,
    ...[...overrides.values()].filter((row) => row.status === 'published').map(publicService),
  ]
}

/** The shared admin editor publishes its content to both services and solutions. */
export function mergePublicSolutions(rows: StoredService[]): PublicSolution[] {
  const overrides = new Map(rows.map((row) => [row.slug, row]))
  const visible = (row: StoredService): PublicSolution => ({
    ...publicService(row),
    contentType: 'service',
  })
  const result = solutionPages.flatMap<PublicSolution>((original) => {
    const row = overrides.get(original.slug)
    overrides.delete(original.slug)
    return row
      ? row.status === 'published'
        ? [visible(row)]
        : []
      : [{ ...original, contentType: 'solution' }]
  })
  return [
    ...result,
    ...[...overrides.values()].filter((row) => row.status === 'published').map(visible),
  ]
}

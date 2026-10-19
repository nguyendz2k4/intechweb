import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { EDITORIAL_CACHE_SECONDS, PUBLIC_SERVICES_CACHE_TAG } from './editorial-cache'
import { mergePublicServices, mergePublicSolutions } from './public-services-data'
import { databaseConfigured } from './db/mysql-client.mjs'

const getStoredServices = unstable_cache(
  async () => {
    const { getServices } = await import('./db/queries')
    return getServices()
  },
  ['public-services', 'v1'],
  { tags: [PUBLIC_SERVICES_CACHE_TAG], revalidate: EDITORIAL_CACHE_SECONDS },
)

export const getPublicServices = cache(async () => {
  if (!databaseConfigured()) return mergePublicServices([])
  // Never fall back to published static content on DB failure: a draft may hide it.
  return mergePublicServices(await getStoredServices())
})

export const getPublicSolutions = cache(async () => {
  if (!databaseConfigured()) return mergePublicSolutions([])
  return mergePublicSolutions(await getStoredServices())
})

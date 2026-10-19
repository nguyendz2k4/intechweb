// Initialize Next's request storage before importing its cache implementation.
import 'next/dist/server/node-environment-baseline'
import { IncrementalCache } from 'next/dist/server/lib/incremental-cache'
import { nodeFs } from 'next/dist/server/lib/node-fs-methods'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** Exercise the installed Next Data Cache without network access or disk writes. */
export async function nextCacheFixture(tags: string[]) {
  const cacheGlobal = globalThis as typeof globalThis & { __incrementalCache?: IncrementalCache }
  const previous = cacheGlobal.__incrementalCache
  const cache = new IncrementalCache({
    dev: false,
    flushToDisk: false,
    serverDistDir: join(tmpdir(), 'intechna-next-cache-tests', 'server'),
    fs: nodeFs,
    maxMemoryCacheSize: 10 * 1024 * 1024,
    requestHeaders: {},
    getPrerenderManifest: () => ({
      version: 4,
      routes: {},
      dynamicRoutes: {},
      notFoundRoutes: [],
      preview: { previewModeId: 'test', previewModeEncryptionKey: '', previewModeSigningKey: '' },
    }),
  })
  cacheGlobal.__incrementalCache = cache
  async function expire(selectedTags = tags) {
    // Windows wall-clock ticks may briefly lead Next's high-resolution clock.
    await new Promise((resolve) => setTimeout(resolve, 20))
    await cache.revalidateTag(selectedTags, { expire: 0 })
    // Next compares a high-resolution invalidation time with Date.now() cache writes.
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  await expire()
  return {
    cache,
    expire,
    restore() {
      if (previous === undefined) delete cacheGlobal.__incrementalCache
      else cacheGlobal.__incrementalCache = previous
    },
  }
}

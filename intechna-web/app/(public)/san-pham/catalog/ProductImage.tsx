'use client'

import Image from 'next/image'
import { useState, type ReactNode } from 'react'
import { productImageSource } from '@/app/catalog-utils'

/** Optimize local product uploads without permitting arbitrary remote image hosts. */
export function ProductImage({
  src,
  alt,
  width,
  height,
  sizes,
  priority = false,
  fallback,
}: {
  src: string
  alt: string
  width: number
  height: number
  sizes: string
  priority?: boolean
  fallback?: ReactNode
}) {
  const source = productImageSource(src)
  const [failedSource, setFailedSource] = useState<string | null>(null)
  if (!source || failedSource === source) return fallback ?? null
  if (source.startsWith('/') && !source.startsWith('//')) {
    return (
      <Image
        src={source}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        onError={() => setFailedSource(source)}
      />
    )
  }
  return (
    <Image
      unoptimized
      src={source}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      onError={() => setFailedSource(source)}
    />
  )
}

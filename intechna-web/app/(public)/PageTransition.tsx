'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)

  // Page enter animation — reset then re-trigger in next frame
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Scroll to top instantly (no smooth scroll during page change)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })

    // Remove class synchronously, re-add in next animation frame
    // to avoid triggering a costly synchronous reflow (offsetWidth trick)
    el.classList.remove('page-enter')
    const raf = requestAnimationFrame(() => {
      el.classList.add('page-enter')
    })
    return () => cancelAnimationFrame(raf)
  }, [pathname])

  // Scroll-reveal observer — re-attach on every route change
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )

    // Small delay so the DOM has settled after navigation
    const timeout = setTimeout(() => {
      const revealElements = document.querySelectorAll('.reveal')
      revealElements.forEach((el) => observer.observe(el))
    }, 50)

    return () => {
      clearTimeout(timeout)
      observer.disconnect()
    }
  }, [pathname])

  return (
    <div ref={containerRef} className="page-enter">
      {children}
    </div>
  )
}

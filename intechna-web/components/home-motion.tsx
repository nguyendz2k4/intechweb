'use client'

import { useEffect } from 'react'

/** Progressive enhancement: server-rendered content remains readable without motion. */
export function HomeMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.home-page')
    if (!root) return
    let disposed = false
    let cleanup = () => {}
    let started = false
    let idleId: number | undefined
    let timerId: ReturnType<typeof globalThis.setTimeout> | undefined
    const motionQuery = window.matchMedia(
      '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
    )
    const pointerQuery = window.matchMedia(
      '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
    )
    const spotlight = (event: PointerEvent) => {
      if (!pointerQuery.matches) return
      const card = (event.target as Element).closest<HTMLElement>('[data-spotlight]')
      if (!card) return
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`)
      card.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`)
    }
    root.addEventListener('pointermove', spotlight, { passive: true })
    const startMotion = () => {
      if (disposed || started || !motionQuery.matches) return
      started = true
      Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
        .then(([{ gsap }, { ScrollTrigger }]) => {
          if (disposed) return
          gsap.registerPlugin(ScrollTrigger)
          const media = gsap.matchMedia()
          media.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
            const viewport = root.querySelector<HTMLElement>('.showcase-viewport')
            const track = root.querySelector<HTMLElement>('.showcase-track')
            let stopFocus = () => {}
            if (viewport && track) {
              const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth)
              root.classList.add('desktop-motion')
              const tween = gsap.to(track, {
                x: () => -distance(),
                ease: 'none',
                scrollTrigger: {
                  trigger: '.hardware-showcase',
                  start: 'top 52px',
                  end: () => `+=${Math.min(distance(), 1800)}`,
                  pin: true,
                  scrub: 0.6,
                  invalidateOnRefresh: true,
                },
              })
              gsap.fromTo(
                '.showcase-progress span',
                { scaleX: 0 },
                {
                  scaleX: 1,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: '.hardware-showcase',
                    start: 'top 52px',
                    end: () => `+=${Math.min(distance(), 1800)}`,
                    scrub: true,
                  },
                },
              )
              const focused = () => {
                tween.scrollTrigger?.disable(true)
                gsap.set(track, { clearProps: 'transform' })
                root.classList.remove('desktop-motion')
              }
              viewport.addEventListener('focusin', focused, { once: true })
              stopFocus = () => viewport.removeEventListener('focusin', focused)
            }
            gsap.fromTo(
              '.cable-flow',
              { strokeDashoffset: 1 },
              {
                strokeDashoffset: 0,
                ease: 'none',
                scrollTrigger: {
                  trigger: '.topology',
                  start: 'top 80%',
                  end: 'bottom 35%',
                  scrub: true,
                },
              },
            )
            const cards = gsap.utils.toArray<HTMLElement>('.solution-card')
            cards.slice(0, -1).forEach((card, index) =>
              gsap.to(card, {
                scale: 0.96,
                opacity: 0.5,
                transformOrigin: 'center top',
                ease: 'none',
                scrollTrigger: {
                  trigger: cards[index + 1],
                  start: 'top 80%',
                  end: 'top 130px',
                  scrub: true,
                },
              }),
            )
            gsap.to(root.querySelectorAll('.scrub-text span'), {
              color: '#1d1d1f',
              stagger: 0.12,
              ease: 'none',
              scrollTrigger: {
                trigger: '.statement-section',
                start: 'top 70%',
                end: 'bottom 70%',
                scrub: true,
              },
            })
            return () => {
              stopFocus()
              root.classList.remove('desktop-motion')
            }
          })
          cleanup = () => media.revert()
        })
        .catch(() => {
          /* Native layouts remain usable if the motion chunk cannot load. */
        })
    }
    const scheduleMotion = () => {
      if (started || disposed || !motionQuery.matches) return
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(startMotion, { timeout: 1500 })
      } else {
        timerId = globalThis.setTimeout(startMotion, 300)
      }
    }
    motionQuery.addEventListener('change', scheduleMotion)
    if (document.readyState === 'complete') scheduleMotion()
    else window.addEventListener('load', scheduleMotion, { once: true })
    return () => {
      disposed = true
      motionQuery.removeEventListener('change', scheduleMotion)
      window.removeEventListener('load', scheduleMotion)
      if (idleId !== undefined) window.cancelIdleCallback(idleId)
      if (timerId !== undefined) globalThis.clearTimeout(timerId)
      root.removeEventListener('pointermove', spotlight)
      cleanup()
    }
  }, [])
  return null
}

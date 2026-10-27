import Lenis from 'lenis'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const LenisContext = createContext<Lenis | null>(null)

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const l = new Lenis({ autoRaf: true, lerp: 0.11, anchors: { offset: -56 } })
    setLenis(l)
    if (import.meta.env.DEV) (window as unknown as { __lenis: Lenis }).__lenis = l
    return () => l.destroy()
  }, [])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}

/** Scrolls smoothly when Lenis is running, natively otherwise. */
export function useScrollTo() {
  const lenis = useContext(LenisContext)
  return (target: string | number | HTMLElement, offset = 0) => {
    if (lenis) {
      lenis.scrollTo(target, { offset, duration: 1.4 })
      return
    }
    const top =
      typeof target === 'number'
        ? target
        : (typeof target === 'string' ? document.querySelector(target) : target)?.getBoundingClientRect().top ?? 0
    window.scrollTo({ top: typeof target === 'number' ? top : window.scrollY + top + offset, behavior: 'smooth' })
  }
}

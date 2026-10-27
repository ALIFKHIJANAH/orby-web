import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

/** Counts from `from` to `to` the first time it scrolls into view. */
export function CountUp({ from = 0, to, decimals = 0, duration = 1.4, delay = 0, suffix = '' }: { from?: number; to: number; decimals?: number; duration?: number; delay?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const reduced = useReducedMotion()
  const [v, setV] = useState(reduced ? to : from)

  useEffect(() => {
    if (!inView || reduced) return
    const c = animate(from, to, { duration, delay, ease: [0.22, 1, 0.36, 1], onUpdate: setV })
    return () => c.stop()
  }, [inView, reduced, from, to, duration, delay])

  return (
    <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {v.toFixed(decimals)}
      {suffix}
    </span>
  )
}

import { motion, useReducedMotion, type Variants } from 'motion/react'
import type { ElementType, ReactNode } from 'react'

export const EASE = [0.22, 1, 0.36, 1] as const

/** Headline words rise out of a mask, one after another. */
export function SplitText({
  text,
  as: Tag = 'span',
  className,
  delay = 0,
  stagger = 0.06,
  inView = true,
}: {
  text: string
  as?: ElementType
  className?: string
  delay?: number
  stagger?: number
  inView?: boolean
}) {
  const reduced = useReducedMotion()
  const lines = text.split('\n')
  let index = 0
  const word: Variants = {
    hidden: { y: reduced ? 0 : '110%', opacity: reduced ? 0 : 1 },
    shown: (i: number) => ({ y: 0, opacity: 1, transition: { duration: 0.9, ease: EASE, delay: delay + i * stagger } }),
  }
  const trigger = inView ? { whileInView: 'shown', viewport: { once: true, margin: '-10% 0px' } } : { animate: 'shown' }
  return (
    <Tag className={className} aria-label={text.replace('\n', ' ')}>
      <motion.span className="split" initial="hidden" {...trigger} aria-hidden>
        {lines.map((line, li) => (
          <span key={li} style={{ display: 'block' }}>
            {line.split(' ').map((w, wi) => {
              const i = index++
              return (
                <span key={wi} className="w">
                  <motion.span custom={i} variants={word}>
                    {w}
                    {wi < line.split(' ').length - 1 ? ' ' : ''}
                  </motion.span>
                </span>
              )
            })}
          </span>
        ))}
      </motion.span>
    </Tag>
  )
}

/** Fades content up into place the first time it scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'li' | 'p' | 'section'
}) {
  const reduced = useReducedMotion()
  const M = motion[as]
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : y, filter: reduced ? 'none' : 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </M>
  )
}

export function SectionTab({ children, centered }: { children: ReactNode; centered?: boolean }) {
  return (
    <span className={`tab notch${centered ? ' tab-centered' : ''}`}>
      <span style={{ width: 6, height: 6, borderRadius: 9, background: 'var(--orange)' }} />
      {children}
    </span>
  )
}

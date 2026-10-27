import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Orb } from '../orb/Orb'
import type { Phase, Tool } from '../orb/pose'
import { useMediaQuery, useMeasuredHeight, useViewportWidth, useYesNoKeys } from '../lib/hooks'
import { useScrollTo } from '../lib/scroll'
import { DOWNLOAD_META, DOWNLOAD_URL, GITHUB_URL } from '../site'
import { Download, GitHub } from '../ui/icons'
import { EASE, SplitText } from '../ui/motion'
import { PermissionCard, type Request } from '../ui/PermissionCard'
import './hero.css'

type Beat = 'intro' | 'thinking' | 'working' | 'needs' | 'done'

const BEATS: { id: Exclude<Beat, 'intro'>; from: number; title: string; line: string; color: string }[] = [
  { id: 'thinking', from: 0.12, title: 'Thinking.', line: 'It shows the reasoning as it happens.', color: 'var(--thinking)' },
  { id: 'working', from: 0.3, title: 'Working.', line: 'It acts out every tool the agent runs.', color: 'var(--working)' },
  { id: 'needs', from: 0.56, title: 'Needs you.', line: 'Answer right from the notch. Try Y or N.', color: 'var(--attention)' },
  { id: 'done', from: 0.8, title: 'Done.', line: 'And it tells you when it’s finished.', color: 'var(--done)' },
]

const TOOLS: { tool: Tool; from: number; status: string }[] = [
  { tool: 'read', from: 0.3, status: 'Reading auth/session.ts' },
  { tool: 'search', from: 0.37, status: 'Searching "Set-Cookie"' },
  { tool: 'edit', from: 0.44, status: 'Editing auth/session.ts' },
  { tool: 'test', from: 0.5, status: '$ pnpm test' },
]

const SHORT = '(max-height: 620px), (min-width: 641px) and (max-height: 720px)'
const THOUGHT = 'Thinking: cookie set after redirect…'

const REQUEST: Request = {
  id: 'hero',
  agent: 'claude',
  title: 'Claude wants to reinstall dependencies',
  task: 'Fix the OAuth redirect loop',
  project: 'acme-web',
  branch: 'feat/login',
  risk: 'Deletes files',
  command: 'rm -rf node_modules && pnpm install --frozen-lockfile',
}

function beatAt(p: number): Beat {
  let b: Beat = 'intro'
  for (const beat of BEATS) if (p >= beat.from) b = beat.id
  return b
}

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const vw = useViewportWidth()
  const scrollTo = useScrollTo()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const [beat, setBeat] = useState<Beat>('intro')
  const [tool, setTool] = useState(0)
  const [typed, setTyped] = useState(0)
  const [awake, setAwake] = useState(false)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setAwake(true), reduced ? 0 : 1100)
    return () => window.clearTimeout(t)
  }, [reduced])

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    setBeat(beatAt(p))
    let ti = 0
    TOOLS.forEach((t, i) => p >= t.from && (ti = i))
    setTool(ti)
    // The reasoning line types itself out as you scroll through the thinking beat.
    setTyped(Math.round(Math.min(1, Math.max(0, (p - 0.12) / 0.14)) * THOUGHT.length))
  })

  const introOpacity = useTransform(scrollYProgress, [0.02, 0.09], [1, 0])
  const introY = useTransform(scrollYProgress, [0.02, 0.09], [0, -40])
  const introBlur = useTransform(scrollYProgress, [0.02, 0.09], ['blur(0px)', 'blur(8px)'])
  const rail = useTransform(scrollYProgress, [0.12, 0.98], [0, 1])
  const hintOpacity = useTransform(scrollYProgress, [0, 0.04], [1, 0])
  const railOpacity = useTransform(scrollYProgress, [0.08, 0.13], [0, 1])

  const phase: Phase =
    beat === 'intro' ? (awake ? 'ready' : 'dozing') : beat === 'needs' && denied ? 'error' : beat === 'thinking' ? 'thinking' : beat
  const activeTool = beat === 'working' ? TOOLS[tool].tool : null

  const mobile = vw < 640
  // Same breakpoints as .hero's short-screen rules in hero.css.
  const short = useMediaQuery(SHORT)
  const orbSize = (mobile ? 96 : 128) - (short ? (mobile ? 24 : 32) : 0)
  const notchW = beat === 'needs' ? Math.min(660, vw - 24) : mobile ? 300 : 400
  const [inner, innerH] = useMeasuredHeight<HTMLDivElement>()

  const goDone = () => {
    const el = ref.current
    if (!el) return
    const range = el.offsetHeight - window.innerHeight
    scrollTo(el.offsetTop + range * 0.86)
  }
  const deny = () => {
    setDenied(true)
    window.setTimeout(() => setDenied(false), 1600)
  }
  useYesNoKeys(beat === 'needs', (k) => (k === 'y' ? goDone() : deny()))

  const status =
    beat === 'intro'
      ? awake
        ? { dot: 'rgba(255,255,255,.4)', text: 'Ready · 3 agents connected' }
        : { dot: 'rgba(255,255,255,.25)', text: 'Idle' }
      : beat === 'thinking'
        ? { dot: 'var(--thinking)', text: THOUGHT.slice(0, Math.max(10, typed)) }
        : beat === 'working'
          ? { dot: 'var(--working)', text: TOOLS[tool].status }
          : beat === 'done'
            ? { dot: 'var(--done)', text: 'Done · Fixed the OAuth redirect loop' }
            : null

  return (
    <section id="top" ref={ref} className="hero" aria-label="Orby, a Dynamic Island for your AI coding agents">
      <div className="hero-stage" data-beat={beat}>
        <motion.div
          className="hero-notch notch dark-surface"
          initial={reduced ? false : { y: '-105%' }}
          animate={{ y: 0, width: notchW, height: innerH || 'auto' }}
          transition={{
            y: { type: 'spring', stiffness: 160, damping: 22, delay: 0.15 },
            width: { type: 'spring', stiffness: 300, damping: 30 },
            height: { type: 'spring', stiffness: 300, damping: 30 },
          }}
        >
          <div ref={inner} className="hero-notch-inner">
            <motion.div layout="position" transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="hero-orb">
              <Orb phase={phase} tool={activeTool} size={orbSize} follow={beat === 'intro' || beat === 'done'} label={`Orby, ${phase}`} />
            </motion.div>
            <AnimatePresence mode="popLayout" initial={false}>
              {beat === 'needs' ? (
                <motion.div
                  key="card"
                  className="hero-card"
                  initial={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)', x: denied ? [0, -10, 9, -6, 4, 0] : 0 }}
                  exit={{ opacity: 0, y: -8, filter: 'blur(6px)', transition: { duration: 0.2 } }}
                  transition={{ duration: 0.45, ease: EASE, delay: 0.08 }}
                >
                  <PermissionCard req={REQUEST} compact onAllow={goDone} onDeny={deny} />
                </motion.div>
              ) : (
                status && (
                  <motion.p
                    key={beat === 'working' ? `w${tool}` : beat}
                    className="hero-status mono"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    <span className="hero-status-dot" style={{ background: status.dot }} />
                    <span className="hero-status-text" style={{ color: beat === 'thinking' ? 'var(--thinking)' : undefined }}>
                      {status.text}
                      {beat === 'thinking' && typed < THOUGHT.length && <span className="caret" />}
                    </span>
                  </motion.p>
                )
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div className="hero-intro wrap" style={{ opacity: introOpacity, y: introY, filter: introBlur }}>
          <SplitText as="h1" className="display h1" text={'Every agent.\nOne little orb.'} inView={false} delay={0.5} />
          <motion.p
            className="lede"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.95 }}
          >
            See what your agents are doing, approve requests and track limits from your Mac’s notch.
          </motion.p>
          <motion.div
            className="hero-ctas"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 1.1 }}
          >
            <a className="btn btn-primary" href={DOWNLOAD_URL}>
              <Download size={17} />
              <span>
                Download<span className="hero-cta-long"> for macOS</span>
              </span>
            </a>
            <a className="btn btn-ghost" href={GITHUB_URL} target="_blank" rel="noreferrer">
              <GitHub size={16} />
              <span>
                <span className="hero-cta-long">View on </span>GitHub
              </span>
            </a>
          </motion.div>
          <motion.p className="hero-meta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 0.8 }}>
            {DOWNLOAD_META}
          </motion.p>
          <motion.div className="hero-hint mono" style={{ opacity: hintOpacity }} aria-hidden>
            <span>Scroll to give Orby some work</span>
            <motion.span className="hero-hint-line" animate={reduced ? {} : { scaleY: [0, 1, 0], originY: [0, 0, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
          </motion.div>
        </motion.div>

        <div className="hero-beat wrap" aria-live="polite">
          <AnimatePresence mode="wait">
            {BEATS.filter((b) => b.id === beat).map((b) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -24, filter: 'blur(10px)' }}
                transition={{ duration: 0.55, ease: EASE }}
              >
                <h2 className="display hero-beat-title">{b.title}</h2>
                <p className="lede">{b.line}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.div className="hero-rail wrap" style={{ opacity: railOpacity }} aria-hidden>
          <div className="hero-rail-track">
            <motion.span className="hero-rail-fill" style={{ scaleX: rail }} />
          </div>
          <ol>
            {BEATS.map((b) => (
              <li key={b.id} className={BEATS.findIndex((x) => x.id === beat) >= BEATS.indexOf(b) ? 'on' : ''}>
                <span style={{ background: b.color }} />
                {b.title.replace('.', '')}
              </li>
            ))}
          </ol>
        </motion.div>
      </div>
    </section>
  )
}

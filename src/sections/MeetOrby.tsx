import { motion, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Orb } from '../orb/Orb'
import { PHASE_COLOR, type Phase, type Tool } from '../orb/pose'
import { useViewportWidth } from '../lib/hooks'
import { EASE, Reveal, SectionTab, SplitText } from '../ui/motion'
import './meet.css'

const STATES: { phase: Phase; name: string }[] = [
  { phase: 'ready', name: 'Ready' },
  { phase: 'thinking', name: 'Thinking' },
  { phase: 'working', name: 'Working' },
  { phase: 'needs', name: 'Needs you' },
  { phase: 'done', name: 'Done' },
  { phase: 'error', name: 'Error' },
  { phase: 'dozing', name: 'Dozing' },
]

const TOOLS: { tool: Tool; name: string }[] = [
  { tool: 'read', name: 'Reading' },
  { tool: 'edit', name: 'Editing' },
  { tool: 'search', name: 'Searching' },
  { tool: 'web', name: 'On the web' },
  { tool: 'run', name: 'Running' },
  { tool: 'test', name: 'Testing' },
  { tool: 'build', name: 'Building' },
  { tool: 'git', name: 'Using git' },
  { tool: 'delete', name: 'Deleting' },
  { tool: 'delegate', name: 'Delegating' },
  { tool: 'plan', name: 'Planning' },
]

const HOLD = 3.2

export function MeetOrby() {
  const stage = useRef<HTMLDivElement>(null)
  const inView = useInView(stage, { margin: '-20% 0px' })
  const reduced = useReducedMotion()
  const vw = useViewportWidth()
  const [index, setIndex] = useState(0)
  const [tool, setTool] = useState(0)
  const [pinned, setPinned] = useState(false)
  const [tick, setTick] = useState(0)

  // Plays the loop while on screen; picking a state pins it.
  useEffect(() => {
    if (!inView || pinned) return
    const id = window.setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % STATES.length
        if (STATES[next].phase === 'working') setTool((t) => (t + 3) % TOOLS.length)
        return next
      })
      setTick((t) => t + 1)
    }, HOLD * 1000)
    return () => window.clearInterval(id)
  }, [inView, pinned])

  const current = STATES[index]
  const working = current.phase === 'working'
  const size = vw < 640 ? 150 : 220

  return (
    <section id="meet" className="section" aria-labelledby="meet-title">
      <SectionTab>Meet Orby</SectionTab>
      <div className="wrap">
        <div className="head">
          <SplitText as="h2" className="display h2" text="One look. You know." />
          <span id="meet-title" className="sr-only">
            Orby's states
          </span>
        </div>

        <Reveal>
          <div ref={stage} className="meet-stage dark-surface">
            <div className="meet-orb">
              <Orb phase={current.phase} tool={working ? TOOLS[tool].tool : null} size={size} follow subagents={3} label={`Orby is ${current.name.toLowerCase()}`} />
              <div className="meet-progress" aria-hidden>
                {STATES.map((s, i) => (
                  <span key={s.phase} className="meet-seg">
                    {i === index && (
                      <motion.span
                        key={`${tick}-${pinned}`}
                        style={{ background: PHASE_COLOR[s.phase] === PHASE_COLOR.ready ? '#e6e6e6' : PHASE_COLOR[s.phase] }}
                        initial={{ scaleX: pinned || reduced ? 1 : 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: pinned || reduced ? 0 : HOLD, ease: 'linear' }}
                      />
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="meet-legend">
              <p className="meet-eyebrow mono">{pinned ? 'Pinned. Click again to resume' : 'Now playing. Click to pin'}</p>
              <ul role="listbox" aria-label="Orby states">
                {STATES.map((s, i) => (
                  <li key={s.phase} role="option" aria-selected={i === index}>
                    <button
                      className={i === index ? 'on' : ''}
                      onClick={() => {
                        if (i === index && pinned) setPinned(false)
                        else {
                          setIndex(i)
                          setPinned(true)
                          setTick((t) => t + 1)
                        }
                      }}
                    >
                      <span className="mono meet-n">{String(i + 1).padStart(2, '0')}</span>
                      <span className="meet-dot" style={{ background: PHASE_COLOR[s.phase] }} />
                      {s.name}
                      {i === index && <motion.span layoutId="meet-active" className="meet-active" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                    </button>
                  </li>
                ))}
              </ul>
              <motion.div
                className="meet-tools"
                initial={false}
                animate={{ height: working ? 'auto' : 0, opacity: working ? 1 : 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                aria-hidden={!working}
              >
                <p className="meet-eyebrow mono">What it’s doing</p>
                <div className="meet-chips">
                  {TOOLS.map((t, i) => (
                    <button
                      key={t.tool}
                      tabIndex={working ? 0 : -1}
                      className={i === tool ? 'on' : ''}
                      onClick={() => {
                        setTool(i)
                        setPinned(true)
                      }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

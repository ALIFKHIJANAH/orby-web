import { motion } from 'motion/react'
import { useRef, useState } from 'react'
import { Orb } from '../orb/Orb'
import type { Phase } from '../orb/pose'
import { CUES, play, type Cue } from '../lib/sound'
import { Play } from '../ui/icons'
import { Reveal, SectionTab, SplitText } from '../ui/motion'
import './sounds.css'

const DOT: Record<string, string> = {
  needs: 'var(--attention)',
  done: 'var(--done)',
  error: 'var(--error)',
  working: 'var(--working)',
}

/** Pitch as a bar height: log scale between the lowest and highest note in the set. */
const pitch = (f: number) => (f ? 0.25 + 0.75 * (Math.log2(f / 262) / Math.log2(1568 / 262)) : 0)

export function Sounds() {
  const [playing, setPlaying] = useState<string | null>(null)
  const [note, setNote] = useState(-1)
  const [phase, setPhase] = useState<Phase>('ready')
  const timer = useRef(0)

  const run = (cue: Cue) => {
    setPlaying(cue.id)
    setPhase(cue.phase)
    window.clearTimeout(timer.current)
    const ms = play(cue, (i) => {
      setNote(i)
      if (i === -1) setPlaying(null)
    })
    timer.current = window.setTimeout(() => setPhase('ready'), ms + 1400)
  }

  return (
    <section id="sounds" className="section band" aria-labelledby="sounds-title">
      <SectionTab>Sounds</SectionTab>
      <div className="wrap sounds">
        <div className="sounds-copy">
          <SplitText as="h2" className="display h2" text={'Hear it when\nit matters.'} />
          <span id="sounds-title" className="sr-only">
            Sound cues
          </span>
          <Reveal delay={0.1}>
            <p className="lede">8-bit cues, system sounds, or your own.</p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="board dark-surface">
            <div className="board-head">
              <Orb phase={phase} size={56} />
              <span className="h3">Press a cue to hear it</span>
            </div>
            <div className="board-grid">
              {CUES.map((cue) => {
                const on = playing === cue.id
                return (
                  <button key={cue.id} className={`cue${on ? ' on' : ''}`} onClick={() => run(cue)} aria-label={`Play the ${cue.name} sound`}>
                    <span className="cue-play">
                      <Play size={14} />
                    </span>
                    <span className="cue-text">
                      <strong>{cue.name}</strong>
                      <span className="cue-roll" aria-hidden>
                        {cue.notes.map(([f, d], i) => (
                          <motion.span
                            key={i}
                            style={{ height: `${pitch(f) * 100}%`, width: d / 6, background: DOT[cue.phase] }}
                            animate={{ opacity: on ? (i === note ? 1 : i < note ? 0.55 : 0.25) : 0.3, scaleY: on && i === note ? 1.25 : 1 }}
                            transition={{ duration: 0.12 }}
                          />
                        ))}
                      </span>
                    </span>
                    <span className="cue-dot" style={{ background: DOT[cue.phase] }} />
                  </button>
                )
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

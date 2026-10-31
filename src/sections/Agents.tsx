import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { LogoBadge, Orb } from '../orb/Orb'
import { AGENTS, type AgentId } from '../orb/agents'
import type { Tool } from '../orb/pose'
import { useViewportWidth } from '../lib/hooks'
import { EASE, Reveal, SectionTab, SplitText } from '../ui/motion'
import './agents.css'

// Each agent acts out a different tool when you point at it.
const TOOL: Record<AgentId, Tool> = {
  claude: 'edit',
  codex: 'test',
  opencode: 'search',
  qwen: 'read',
  commandcode: 'build',
  pi: 'git',
  antigravity: 'web',
  cursor: 'plan',
}

// Shot and copy rows under the agents; every other row puts the copy first.
const ROWS = [
  {
    title: 'Jump back.',
    line: 'Click a session to jump to its terminal.',
    list: 'iTerm2 · Terminal · tmux · Kitty · WezTerm · VS Code · Cursor · Zed',
    img: '/shots/expanded-sessions.png',
    alt: 'Sessions grouped by project, each with its agent, status and last line',
    h: 1011,
  },
  {
    title: 'Start one here.',
    line: 'Press ⌥⌘N from any app. Pick an agent, a folder and a terminal, then type the first message.',
    list: 'Orca · Terminal · iTerm',
    img: '/shots/expanded-new-agent.png',
    alt: 'The New agent launcher with Claude Code, the acme-web folder, Orca and a first message',
    h: 495,
  },
  {
    title: 'Subagents, too.',
    line: 'Each subagent gets its own line under the session that started it. Orca workers sit under their coordinator.',
    list: 'Claude Code · OpenCode · Orca orchestration',
    img: '/shots/expanded-subagents.png',
    alt: 'A coordinator with two Orca workers nested under it, and a session with two subagents',
    h: 915,
  },
]

export function Agents() {
  const [hot, setHot] = useState<number | null>(null)
  const vw = useViewportWidth()
  const reduced = useReducedMotion()
  const size = vw < 640 ? 52 : vw < 1000 ? 64 : 76
  const perRow = vw < 640 ? 4 : AGENTS.length

  return (
    <section id="agents" className="section" aria-labelledby="agents-title">
      <SectionTab centered>Agents</SectionTab>
      <div className="wrap">
        <div className="head center">
          <SplitText as="h2" className="display h2" text="Eight agents, one notch." />
          <span id="agents-title" className="sr-only">
            Supported agents
          </span>
          <Reveal delay={0.1}>
            <p className="lede">Connect once. Orby does the rest.</p>
          </Reveal>
        </div>

        <ul className="agents-row" onPointerLeave={() => setHot(null)}>
          {AGENTS.map((a, i) => {
            const sameRow = hot !== null && Math.floor(hot / perRow) === Math.floor(i / perRow)
            const neighbour = hot !== null && sameRow && Math.abs(hot - i) === 1
            return (
              <motion.li
                key={a.id}
                initial={{ opacity: 0, y: reduced ? 0 : 40, scale: reduced ? 1 : 0.6 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: i * 0.06 }}
              >
                <button
                  className={`agent${hot === i ? ' hot' : ''}`}
                  onPointerEnter={() => setHot(i)}
                  onFocus={() => setHot(i)}
                  onBlur={() => setHot(null)}
                  aria-label={`${a.name}: hover to see Orby ${TOOL[a.id]}`}
                >
                  <span className="agent-orb">
                    <Orb
                      agent={a.id}
                      size={size}
                      phase={hot === i ? 'working' : 'ready'}
                      tool={hot === i ? TOOL[a.id] : null}
                      gaze={neighbour ? { x: hot! > i ? 0.8 : -0.8, y: -0.1 } : null}
                      follow={hot === null}
                      subagents={2}
                    />
                    <span className="agent-badge">
                      <LogoBadge agent={a.id} size={Math.round(size * 0.4)} />
                    </span>
                  </span>
                  <span className="agent-name">{a.name}</span>
                  <motion.span
                    className="agent-tool mono"
                    initial={false}
                    animate={{ opacity: hot === i ? 1 : 0, y: hot === i ? 0 : -4 }}
                    transition={{ duration: 0.25, ease: EASE }}
                  >
                    {TOOL[a.id]}
                  </motion.span>
                </button>
              </motion.li>
            )
          })}
        </ul>

        {ROWS.map((r, i) => (
          <div key={r.title} className={`jump${i % 2 ? ' flip' : ''}`}>
            <Reveal className="jump-shot">
              <div className="shot">
                <img src={r.img} alt={r.alt} loading="lazy" width={1178} height={r.h} />
              </div>
            </Reveal>
            <Reveal className="jump-copy" delay={0.1}>
              <h3 className="display jump-title">{r.title}</h3>
              <p className="lede">{r.line}</p>
              <p className="jump-list mono">{r.list}</p>
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  )
}

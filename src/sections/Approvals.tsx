import { AnimatePresence, motion, useInView } from 'motion/react'
import { useRef, useState } from 'react'
import { Orb } from '../orb/Orb'
import { useYesNoKeys } from '../lib/hooks'
import { EASE, Reveal, SectionTab, SplitText } from '../ui/motion'
import { Shield } from '../ui/icons'
import { PermissionCard, type Request } from '../ui/PermissionCard'
import './approvals.css'

const QUEUE: Request[] = [
  {
    id: 'deps',
    agent: 'claude',
    title: 'Claude wants to reinstall dependencies',
    task: 'Fix the OAuth redirect loop',
    project: 'acme-web',
    branch: 'feat/login',
    risk: 'Deletes files',
    command: 'rm -rf node_modules && pnpm install --frozen-lockfile',
    rule: 'Bash(pnpm install:*)',
  },
  {
    id: 'tests',
    agent: 'codex',
    title: 'Codex wants to run the test suite',
    task: 'Add rate limiting to the public API',
    project: 'api-server',
    branch: 'main',
    command: 'pnpm vitest run --coverage',
    rule: 'Bash(pnpm vitest:*)',
  },
  {
    id: 'push',
    agent: 'antigravity',
    title: 'Antigravity wants to push a branch',
    task: 'Why does the iOS build fail on CI?',
    project: 'mobile-app',
    branch: 'fix/ios-ci',
    risk: 'Writes to a remote',
    command: 'git push -u origin fix/ios-ci',
    rule: 'Bash(git push:*)',
  },
]

type Outcome = { kind: 'allow' | 'deny'; req: Request }

const TILES = [
  { title: 'Questions', line: 'Answer questions in place.', img: '/shots/expanded-question-multi.png', alt: 'A multiple-choice question from Claude, answered in the notch' },
  { title: 'Plans', line: 'Review plans as Markdown.', img: '/shots/expanded-plan.png', alt: 'A plan rendered as Markdown with Approve and feedback buttons' },
]

export function Approvals() {
  const box = useRef<HTMLDivElement>(null)
  const inView = useInView(box, { margin: '-25% 0px' })
  const [i, setI] = useState(0)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [pressed, setPressed] = useState<'allow' | 'deny' | null>(null)
  const req = QUEUE[i % QUEUE.length]

  const answer = (kind: 'allow' | 'deny') => {
    if (outcome) return
    setPressed(kind)
    window.setTimeout(() => {
      setPressed(null)
      setOutcome({ kind, req })
    }, 160)
    window.setTimeout(() => {
      setOutcome(null)
      setI((n) => n + 1)
    }, 2300)
  }
  useYesNoKeys(inView, (k) => answer(k === 'y' ? 'allow' : 'deny'))

  return (
    <section id="approvals" className="section band" aria-labelledby="approvals-title">
      <SectionTab>Approvals</SectionTab>
      <div className="wrap approvals">
        <div className="approvals-copy">
          <SplitText as="h2" className="display h2" text={'Your turn.\nOne keystroke.'} />
          <span id="approvals-title" className="sr-only">
            Approvals from the notch
          </span>
          <Reveal delay={0.1}>
            <p className="lede">Allow ⌘Y. Deny ⌘N. Without leaving your editor.</p>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="approvals-try">
              <span className="kbd-lg">Y</span>
              <span className="kbd-lg">N</span>
              Try it here.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div ref={box} className="approvals-panel dark-surface">
            <AnimatePresence mode="wait" initial={false}>
              {outcome ? (
                <motion.div
                  key={`out-${i}`}
                  className={`approvals-result ${outcome.kind}`}
                  initial={{ opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
                  transition={{ duration: 0.4, ease: EASE }}
                  role="status"
                >
                  <Orb phase={outcome.kind === 'allow' ? 'done' : 'error'} agent={outcome.req.agent} size={64} />
                  <div>
                    <strong>{outcome.kind === 'allow' ? 'Allowed' : 'Denied'}</strong>
                    <span className="mono">{outcome.kind === 'allow' ? outcome.req.command : `${outcome.req.title.split(' ')[0]} was told no`}</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={req.id + i}
                  initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: pressed === 'deny' ? [0, -12, 10, -6, 0] : 0, filter: 'blur(8px)' }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  <PermissionCard
                    req={req}
                    pressed={pressed}
                    position={`${(i % QUEUE.length) + 1} of ${QUEUE.length}`}
                    onAllow={() => answer('allow')}
                    onDeny={() => answer('deny')}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="approvals-foot">
              <span>{QUEUE.length - 1} more waiting · 1 done</span>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="wrap approvals-tiles">
        {TILES.map((t, n) => (
          <Reveal key={t.title} delay={n * 0.08}>
            <figure className="tile">
              <div className="shot tile-shot">
                <img src={t.img} alt={t.alt} loading="lazy" width={1140} height={700} />
              </div>
              <figcaption>
                <span className="h3">{t.title}</span>
                <span className="muted">{t.line}</span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
        <Reveal delay={0.16}>
          <figure className="tile">
            <div className="shot tile-shot trust-demo dark-surface" aria-hidden>
              <div className="trust-row">
                <span className="perm-btn deny">
                  Deny <span className="kbd">⌘N</span>
                </span>
                <span className="perm-btn always">Always allow</span>
                <span className="perm-btn allow">
                  Allow <span className="kbd">⌘Y</span>
                </span>
              </div>
              <p>
                <Shield size={15} /> Allow, and trust this session for 30 min
              </p>
            </div>
            <figcaption>
              <span className="h3">Trust a session</span>
              <span className="muted">Trust a session for 30 minutes.</span>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  )
}

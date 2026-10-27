import { AnimatePresence, motion } from 'motion/react'
import { useId, useState } from 'react'
import { Plus } from '../ui/icons'
import { EASE, Reveal, SectionTab, SplitText } from '../ui/motion'
import './faq.css'

const FAQ: [string, string][] = [
  ['Do I need a MacBook with a notch?', 'No. On Macs without one, or on an external display, Orby shows as a floating bar at the top of the screen.'],
  ['Which macOS version?', 'macOS 14 Sonoma or later.'],
  ['What does it cost?', 'Nothing. No trial, no license key, no account.'],
  ['Does it send my code anywhere?', 'No. Orby reads local files and listens on a local socket. The two network requests it can make (Claude plan limits, Antigravity quota) are off until you turn them on.'],
  ['What happens if Orby isn’t running?', 'Your agent doesn’t notice. The hook exits without output and the agent asks in the terminal as usual.'],
  ['Will it steal focus while I type?', 'No. Orby never takes focus from the app you’re in, and it stays quiet when you’re already looking at that agent’s terminal.'],
  ['I already use Vibe Island. Can I run both?', 'Yes, but if both are hooked into the same agent, both show every permission request. Disconnect that agent in one of them.'],
  ['Which terminals can it jump back to?', 'iTerm2, Terminal, tmux, Kitty and WezTerm go to the exact tab or pane. VS Code, Cursor, Windsurf and Zed go to the window holding the project. Other apps are brought to the front.'],
  ['How do I remove it?', 'Click Remove all agent hooks in Settings (or Remove next to each agent in Integrations), then delete the app. Backups of your original config are in ~/.orby/backups/.'],
]

export function Faq() {
  const [open, setOpen] = useState(0)
  const id = useId()
  return (
    <section id="faq" className="section" aria-labelledby={`${id}-title`}>
      <SectionTab centered>FAQ</SectionTab>
      <div className="wrap faq">
        <div className="head center">
          <SplitText as="h2" className="display h2" text="Before you download." />
          <span id={`${id}-title`} className="sr-only">
            Frequently asked questions
          </span>
        </div>
        <Reveal>
          <ul className="faq-list">
            {FAQ.map(([q, a], i) => {
              const on = open === i
              return (
                <li key={q}>
                  <h3>
                    <button aria-expanded={on} aria-controls={`${id}-${i}`} onClick={() => setOpen(on ? -1 : i)}>
                      {q}
                      <motion.span animate={{ rotate: on ? 45 : 0 }} transition={{ duration: 0.3, ease: EASE }} style={{ display: 'grid' }}>
                        <Plus size={18} />
                      </motion.span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.div
                        id={`${id}-${i}`}
                        role="region"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p>{a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

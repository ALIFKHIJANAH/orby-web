import { motion, useScroll, useTransform } from 'motion/react'
import { useScrollTo } from '../lib/scroll'
import type { Theme } from '../lib/theme'
import { DOWNLOAD_URL, GITHUB_URL } from '../site'
import { Download, GitHub, Moon, Sun } from '../ui/icons'
import './nav.css'

const LINKS = [
  ['How it works', '#meet'],
  ['Agents', '#agents'],
  ['Privacy', '#privacy'],
  ['FAQ', '#faq'],
] as const

export function Nav({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: (o: { x: number; y: number }) => void }) {
  const scrollTo = useScrollTo()
  const { scrollY } = useScroll()
  const hairline = useTransform(scrollY, [0, 120], [0, 1])

  return (
    <header className="nav dark-surface">
      <nav className="nav-inner wrap" aria-label="Main">
        <a
          href="#top"
          className="brand"
          onClick={(e) => {
            e.preventDefault()
            scrollTo(0)
          }}
        >
          <span className="brand-dot" aria-hidden />
          orby
        </a>
        <ul className="nav-links">
          {LINKS.map(([label, href]) => (
            <li key={href}>
              <a
                href={href}
                onClick={(e) => {
                  e.preventDefault()
                  scrollTo(href, -56)
                }}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        <div className="nav-actions">
          <button
            className="icon-btn"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              onToggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
            }}
          >
            <motion.span key={theme} initial={{ rotate: -90, scale: 0.6, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} style={{ display: 'grid' }}>
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </motion.span>
          </button>
          <a className="nav-gh" href={GITHUB_URL} target="_blank" rel="noreferrer">
            <GitHub size={16} />
            <span>GitHub</span>
          </a>
          <a className="btn btn-primary btn-sm" href={DOWNLOAD_URL}>
            <Download size={15} />
            Download
          </a>
        </div>
      </nav>
      <motion.span className="nav-hairline" style={{ opacity: hairline }} aria-hidden />
    </header>
  )
}

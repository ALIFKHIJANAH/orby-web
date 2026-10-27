import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Orb } from '../orb/Orb'
import { now, pointer } from '../orb/clock'
import { CHANGELOG_URL, DOWNLOAD_META, DOWNLOAD_URL, FEATURES_URL, GITHUB_URL, ISSUES_URL } from '../site'
import { Download, GitHub } from '../ui/icons'
import { EASE, Reveal, SplitText } from '../ui/motion'
import './closing.css'

export function FinalCta() {
  return (
    <section className="final" aria-labelledby="final-title">
      <motion.div
        className="final-notch notch dark-surface"
        initial={{ height: 0 }}
        whileInView={{ height: 'auto' }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="final-orb">
          <Orb phase="done" size={92} follow label="Orby, done and winking" />
        </div>
      </motion.div>
      <div className="wrap final-copy">
        <SplitText as="h2" className="display h2" text="Give your notch a job." />
        <span id="final-title" className="sr-only">
          Download Orby
        </span>
        <Reveal delay={0.15}>
          <div className="hero-ctas">
            <a className="btn btn-primary" href={DOWNLOAD_URL}>
              <Download size={17} />
              Download for macOS
            </a>
            <a className="btn btn-ghost" href={GITHUB_URL} target="_blank" rel="noreferrer">
              <GitHub size={16} />
              View on GitHub
            </a>
          </div>
        </Reveal>
        <Reveal delay={0.25}>
          <p className="hero-meta">{DOWNLOAD_META}</p>
        </Reveal>
      </div>
    </section>
  )
}

const IDLE_AFTER = 20

export function Footer() {
  // Leave the pointer alone for a while and the footer orb dozes off.
  const [dozing, setDozing] = useState(false)
  useEffect(() => {
    const id = window.setInterval(() => setDozing(now() - Math.max(pointer.movedAt, 0) > IDLE_AFTER), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <footer className="footer dark-surface">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="brand">
              <span className="brand-dot" aria-hidden />
              orby
            </span>
            <p className="muted">A Dynamic Island for your AI coding agents.</p>
          </div>
          <nav className="footer-links" aria-label="Footer">
            <div>
              <p className="mono">Product</p>
              <a href={DOWNLOAD_URL}>Download</a>
              <a href={CHANGELOG_URL} target="_blank" rel="noreferrer">
                Changelog
              </a>
              <a href={FEATURES_URL} target="_blank" rel="noreferrer">
                Features
              </a>
            </div>
            <div>
              <p className="mono">Source</p>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href={ISSUES_URL} target="_blank" rel="noreferrer">
                Report an issue
              </a>
            </div>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>Made for macOS. Not affiliated with Apple, Anthropic, OpenAI or Google.</span>
          <motion.span
            className="footer-orb"
            title={dozing ? 'Shh. Move the mouse to wake it.' : 'Leave the mouse alone for a bit…'}
            animate={{ y: dozing ? 2 : 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <Orb phase={dozing ? 'dozing' : 'ready'} size={26} follow={!dozing} />
          </motion.span>
        </div>
      </div>
    </footer>
  )
}

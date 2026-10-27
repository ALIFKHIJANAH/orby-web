import { CountUp } from '../ui/CountUp'
import { Archive, Offline, Shield } from '../ui/icons'
import { Reveal, SectionTab, SplitText } from '../ui/motion'
import './privacy.css'

const COLS = [
  { icon: Offline, title: 'Local only', line: 'Reads local transcripts. Uploads nothing.' },
  { icon: Shield, title: 'Fails safe', line: 'If Orby quits, your agent carries on.' },
  { icon: Archive, title: 'Backed up', line: 'Every config change is backed up first.' },
]

export function Privacy() {
  return (
    <section id="privacy" className="section" aria-labelledby="privacy-title">
      <SectionTab>Privacy</SectionTab>
      <div className="wrap">
        <div className="head">
          <SplitText as="h2" className="display h2" text="2 MB. No account. All local." />
          <span id="privacy-title" className="sr-only">
            Privacy
          </span>
        </div>
        <div className="stats">
          <Reveal className="stat">
            <span className="stat-n">
              ~<CountUp to={2} duration={1.2} /> MB
            </span>
            <span className="muted">native Swift app</span>
          </Reveal>
          <Reveal className="stat" delay={0.08}>
            <span className="stat-n">
              <CountUp from={9} to={0} duration={1.6} />
            </span>
            <span className="muted">accounts or analytics</span>
          </Reveal>
          <Reveal className="stat" delay={0.16}>
            <span className="stat-n">
              <CountUp from={9} to={0} duration={1.9} />
            </span>
            <span className="muted">config files overwritten</span>
          </Reveal>
        </div>
        <div className="privacy-cols">
          {COLS.map(({ icon: Icon, title, line }, i) => (
            <Reveal key={title} delay={0.1 + i * 0.08}>
              <h3 className="privacy-title">
                <Icon size={18} />
                {title}
              </h3>
              <p className="muted">{line}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

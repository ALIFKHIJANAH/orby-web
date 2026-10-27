import { motion, useReducedMotion } from 'motion/react'
import { LogoBadge } from '../orb/Orb'
import type { AgentId } from '../orb/agents'
import { CountUp } from '../ui/CountUp'
import { EASE, Reveal, SectionTab, SplitText } from '../ui/motion'
import './usage.css'

// The plan limits from the app's own usage screenshot.
const PLANS: { agent: AgentId; name: string; tier?: string; updated: string; rows: [string, number, string][] }[] = [
  { agent: 'claude', name: 'Claude Code', updated: 'updated now', rows: [['5h', 34, 'resets in 2h 3m'], ['7d', 62, 'resets in 3d 0h']] },
  { agent: 'codex', name: 'Codex', tier: 'Plus', updated: 'updated now', rows: [['5h', 8, 'resets in 3h 19m'], ['7d', 91, 'resets in 1d 0h']] },
  {
    agent: 'antigravity',
    name: 'Antigravity',
    tier: 'Pro',
    updated: 'updated 3m',
    rows: [['Gemini 5h', 3, 'resets in 1h 4m'], ['Gemini 7d', 12, 'resets in 5d 11h'], ['Claude/GPT 5h', 0, 'resets in 4h 43m'], ['Claude/GPT 7d', 82, 'resets in 5d 12h']],
  },
]

const barColor = (v: number) => (v >= 85 ? 'var(--error)' : v >= 50 ? 'var(--attention)' : 'var(--done)')

export function Usage() {
  const reduced = useReducedMotion()
  let row = 0
  return (
    <section id="usage" className="section" aria-labelledby="usage-title">
      <SectionTab>Usage</SectionTab>
      <div className="wrap usage">
        <Reveal>
          <div className="usage-panel dark-surface">
            <div className="usage-top">
              <span>2 working · 1 finished</span>
              <span className="usage-pill hot">7d 91%</span>
            </div>
            <div className="usage-card">
              <p className="usage-label mono">Plan limits</p>
              {PLANS.map((plan) => (
                <div key={plan.agent} className="usage-plan">
                  <div className="usage-plan-head">
                    <LogoBadge agent={plan.agent} size={20} />
                    <strong>{plan.name}</strong>
                    {plan.tier && <span className="usage-tier">{plan.tier}</span>}
                    <span className="usage-updated">{plan.updated}</span>
                  </div>
                  {plan.rows.map(([label, value, reset]) => {
                    const d = row++ * 0.07
                    return (
                      <div key={label} className="usage-row">
                        <span>{label}</span>
                        <span className="usage-track">
                          <motion.span
                            className="usage-fill"
                            style={{ background: barColor(value) }}
                            initial={{ scaleX: reduced ? value / 100 : 0 }}
                            whileInView={{ scaleX: Math.max(0.012, value / 100) }}
                            viewport={{ once: true, margin: '-15% 0px' }}
                            transition={{ duration: 1.1, ease: EASE, delay: 0.2 + d }}
                          />
                          <span className="usage-mark" aria-hidden />
                        </span>
                        <span className="usage-pct">
                          <CountUp to={value} delay={0.2 + d} duration={1.1} suffix="%" />
                        </span>
                        <span className="usage-reset">{reset}</span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            <div className="usage-card usage-tokens">
              <p className="usage-label mono">Tokens · last 7 days</p>
              <div>
                <span>Today</span>
                <strong>
                  <CountUp to={11.4} decimals={1} suffix="M" />
                </strong>
              </div>
              <div>
                <span>7 days</span>
                <strong>
                  <CountUp to={61.8} decimals={1} suffix="M" delay={0.1} />
                </strong>
              </div>
            </div>
          </div>
        </Reveal>
        <div className="usage-copy">
          <SplitText as="h2" className="display h2" text="Know what’s left." />
          <span id="usage-title" className="sr-only">
            Plan limits and usage
          </span>
          <Reveal delay={0.1}>
            <p className="lede">Every plan limit. One glance.</p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

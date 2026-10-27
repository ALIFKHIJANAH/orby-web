import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { computePose, drawOrb, PHASE_COLOR, type Phase, type Tool, type Vec } from './pose'
import { AGENT, type AgentId } from './agents'
import { now, pointer, subscribe } from './clock'

export interface OrbProps {
  phase: Phase
  tool?: Tool | null
  agent?: AgentId
  /** Orb diameter in CSS px. The canvas is twice that so hops and props can leave the body. */
  size: number
  /** Eyes follow the pointer while it moves; procedural gaze takes over after it rests. */
  follow?: boolean
  gaze?: Vec | null
  chat?: { facing: number; turn: 0 | 1 } | null
  subagents?: number
  shaded?: boolean
  className?: string
  label?: string
}

const FOLLOW_FOR = 2.5

export function Orb({ phase, tool = null, agent = 'claude', size, follow, gaze, chat, subagents, shaded, className, label }: OrbProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  // Props live in a ref so the draw loop never re-subscribes on render.
  const props = useRef({ phase, tool, agent, follow, gaze, chat, subagents, shaded, reduced })
  props.current = { phase, tool, agent, follow, gaze, chat, subagents, shaded, reduced }
  const changed = useRef({ phase, phaseAt: -Infinity, tool, toolAt: -Infinity })

  if (changed.current.phase !== phase) {
    changed.current.phase = phase
    changed.current.phaseAt = now()
  }
  if (changed.current.tool !== tool) {
    changed.current.tool = tool
    changed.current.toolAt = now()
  }

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const ctx = el.getContext('2d')
    if (!ctx) return
    const box = size * 2
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    el.width = box * dpr
    el.height = box * dpr
    const followed: Vec = { x: 0, y: 0 }
    let followWeight = 0

    const frame = (t: number) => {
      const p = props.current
      let g: Vec | null = p.gaze ?? null
      if (p.follow && !p.reduced) {
        const rect = el.getBoundingClientRect()
        const active = pointer.inside && t - pointer.movedAt < FOLLOW_FOR
        if (active) {
          const dx = pointer.x - (rect.left + rect.width / 2)
          const dy = pointer.y - (rect.top + rect.height / 2)
          const d = Math.hypot(dx, dy) || 1
          const k = Math.min(1, d / (size * 2.2))
          followed.x += ((dx / d) * k * 0.95 - followed.x) * 0.18
          followed.y += ((dy / d) * k * 0.85 - followed.y) * 0.18
        }
        followWeight += ((active ? 1 : 0) - followWeight) * 0.08
        if (followWeight > 0.02 && !g) g = { ...followed }
      }
      const pose = computePose({
        phase: p.phase,
        tool: p.tool,
        t,
        sinceChange: t - changed.current.phaseAt,
        sinceTask: t - changed.current.toolAt,
        subagents: p.subagents,
        chat: p.chat,
        gaze: g,
        motion: p.reduced ? 0 : 1,
      })
      const a = AGENT[p.agent ?? 'claude']
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, box, box)
      drawOrb(ctx, box, size / 2, pose, {
        fill: a.color,
        eyes: a.light ? '#111' : '#fff',
        accent: PHASE_COLOR[p.phase],
        shaded: p.shaded ?? size >= 80,
      })
    }

    let unsubscribe: (() => void) | null = null
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !unsubscribe) unsubscribe = subscribe(frame)
        else if (!entry.isIntersecting && unsubscribe) {
          unsubscribe()
          unsubscribe = null
        }
      },
      { rootMargin: '120px' },
    )
    io.observe(el)
    frame(now())
    return () => {
      io.disconnect()
      unsubscribe?.()
    }
  }, [size])

  return (
    <span
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ position: 'relative', display: 'inline-block', width: size, height: size, flex: 'none' }}
    >
      <canvas
        ref={canvas}
        style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size * 2, height: size * 2, pointerEvents: 'none' }}
      />
    </span>
  )
}

/** The agent's mark in a round chip, as pinned to an orb's shoulder in the app. */
export function LogoBadge({ agent, size }: { agent: AgentId; size: number }) {
  const a = AGENT[agent]
  return (
    <span
      className="logo-badge"
      style={{ width: size, height: size, background: a.color, color: a.light ? '#111' : '#fff' }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6}>
        <path d={a.logo} fill="currentColor" fillRule="evenodd" />
      </svg>
    </span>
  )
}

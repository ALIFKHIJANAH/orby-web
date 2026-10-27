// A port of OrbPose from Sources/Orby/UI/AgentOrb.swift. Same numbers, same timing:
// one frame of the orb is a pure function of time, so it needs no state of its own.

export type Phase = 'ready' | 'thinking' | 'working' | 'compacting' | 'needs' | 'done' | 'error' | 'dozing'
export type Tool = 'read' | 'edit' | 'search' | 'web' | 'run' | 'test' | 'build' | 'git' | 'delete' | 'delegate' | 'plan'

export const PHASE_COLOR: Record<Phase, string> = {
  ready: 'rgba(255,255,255,0.35)',
  dozing: 'rgba(255,255,255,0.35)',
  thinking: '#B38FFF',
  working: '#5C9EFF',
  compacting: '#5C9EFF',
  needs: '#FF9E33',
  done: '#4DD980',
  error: '#FF5C5C',
}

const THINKING = '#B38FFF'
const WORKING = '#5C9EFF'
const DONE = '#4DD980'

export interface Vec {
  x: number
  y: number
}

export interface PoseInput {
  phase: Phase
  tool?: Tool | null
  t: number
  sinceChange: number
  sinceTask: number
  subagents?: number
  /** Holds still facing a partner orb; the speaker's eyes flap. */
  chat?: { facing: number; turn: 0 | 1 } | null
  /** Overrides the procedural gaze, e.g. to follow the pointer. */
  gaze?: Vec | null
  motion: number
}

export interface Pose {
  offset: Vec
  scale: Vec
  tilt: number
  gaze: Vec
  openness: number
  eyeScale: number
  wink: boolean
  asleep: boolean
  sparkle: number
  thought: number | null
  glow: number
  t: number
  task: Tool | null
  subagents: number
  motion: number
}

const squash = (k: number): Vec => ({ x: 1 + k, y: 1 - k })

function rand(i: number, salt: number) {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return s - Math.floor(s)
}

/** Holds a gaze target, then darts to the next one, like real eye saccades. */
function saccade(t: number, dwell: number, spread: Vec, bias: Vec): Vec {
  const n = Math.floor(t / dwell)
  const target = (i: number) => ({
    x: bias.x + (rand(i, 3) * 2 - 1) * spread.x,
    y: bias.y + (rand(i, 4) * 2 - 1) * spread.y,
  })
  const x = Math.min(1, (t - n * dwell) / 0.14)
  const k = x * x * (3 - 2 * x)
  const a = target(n - 1)
  const b = target(n)
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }
}

/** 1 = open. One blink at a random moment every ~4s, sometimes a double blink. */
export function blink(t: number) {
  const period = 4.2
  const n = Math.floor(t / period)
  const at = n * period + rand(n, 1) * (period - 0.4)
  let closed = Math.max(0, 1 - Math.abs(t - at) / 0.08)
  if (rand(n, 2) < 0.25) closed = Math.max(closed, 1 - Math.abs(t - at - 0.22) / 0.08)
  return 1 - closed
}

/** Which of `rows` steps a repeating `period` is on, and how far through it (0...1). */
function cycle(t: number, period: number, rows: number): [number, number] {
  const n = Math.floor(t / period)
  return [((n % rows) + rows) % rows, t / period - n]
}

const mod = (a: number, b: number) => ((a % b) + b) % b

/** Magnifier centre (in radii) sweeping a figure eight across the face. */
const lens = (a: number): Vec => ({ x: 0.8 * Math.sin(a), y: 0.3 * Math.sin(2 * a) + 0.1 })

/** Point on a tilted orbit around the orb; `sin(a) > 0` is the near side. */
function orbit(a: number, r: number): Vec {
  const x = 1.45 * r * Math.cos(a)
  const y = 0.42 * r * Math.sin(a) - 0.15 * r
  const tilt = -0.26
  return { x: x * Math.cos(tilt) - y * Math.sin(tilt), y: x * Math.sin(tilt) + y * Math.cos(tilt) }
}

/** 0→1 with a little overshoot, for things popping in. */
function overshoot(x: number) {
  const c = 2.2
  const u = x - 1
  return 1 + (c + 1) * u * u * u + c * u * u
}

const GIT_NODES = [-0.6, 0, 0.6]

export function computePose(input: PoseInput): Pose {
  const { phase, t, sinceChange, sinceTask, chat, motion } = input
  const p: Pose = {
    offset: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
    tilt: 0,
    gaze: { x: 0, y: 0 },
    openness: 1,
    eyeScale: 1,
    wink: false,
    asleep: false,
    sparkle: 0,
    thought: null,
    glow: 0,
    t,
    task: chat ? null : phase === 'working' ? input.tool ?? null : null,
    subagents: input.subagents ?? 0,
    motion,
  }

  switch (phase) {
    case 'thinking':
      p.gaze = { x: 0.7 * Math.sin(t * 0.9), y: -0.6 + 0.08 * Math.sin(t * 1.8) }
      p.openness = 0.8
      p.eyeScale = 0.92
      p.tilt = -7 * Math.sin(t * 0.9)
      p.offset.y = -0.05 * Math.sin(t * 1.5)
      p.thought = t
      p.glow = 0.35 + 0.2 * Math.sin(t * 1.8)
      break
    case 'working':
    case 'compacting':
      p.gaze = saccade(t, 0.55, { x: 0.75, y: 0.3 }, { x: 0, y: -0.25 })
      p.offset.y = -0.06 * Math.sin(t * 3)
      p.tilt = 6 * Math.sin(t * 1.4)
      if (phase === 'compacting') {
        p.openness = 0.3
        p.scale = squash(0.06 * Math.sin(t * 2.4))
      }
      p.glow = 0.45 + 0.3 * Math.sin(t * 3.2)
      if (p.task) act(p, p.task)
      break
    case 'needs': {
      p.gaze = { x: 0.1 * Math.sin(t * 1.3), y: 0.55 }
      p.eyeScale = 1.15
      const u = mod(t, 1.6) / 1.6
      if (u < 0.3) {
        const h = Math.sin((Math.PI * u) / 0.3)
        p.offset.y = -0.22 * h
        p.scale = squash(-0.08 * h)
      } else if (u < 0.4) {
        p.scale = squash(0.1 * Math.sin((Math.PI * (u - 0.3)) / 0.1))
      }
      p.glow = 0.75 + 0.2 * Math.sin(t * 5)
      break
    }
    case 'done': {
      p.gaze = { x: 0.4, y: -0.4 }
      p.tilt = 4 * Math.sin(t * 1.2)
      p.offset.y = -0.04 * Math.sin(t * 2.4)
      const u = mod(t, 3.2)
      p.wink = u > 0.5 && u < 0.9
      p.sparkle = Math.pow(Math.max(0, Math.sin((Math.PI * mod(t, 1.6)) / 1.6)), 2)
      p.glow = 0.35
      break
    }
    case 'error': {
      p.gaze = { x: 0, y: 0.45 }
      p.openness = 0.45
      const s = mod(t, 3.2)
      if (s < 0.5) p.offset.x = 0.08 * Math.sin(s * 40) * (1 - s / 0.5)
      p.glow = 0.55
      break
    }
    case 'dozing':
      p.asleep = true
      p.gaze = { x: 0, y: 0.2 }
      p.scale = squash(-0.045 * Math.sin(t * 1.1))
      p.offset.y = 0.04 * Math.sin(t * 1.1)
      p.tilt = 5
      break
    case 'ready':
      p.gaze = saccade(t, 1.9, { x: 0.6, y: 0.45 }, { x: 0, y: 0 })
      p.scale = squash(-0.025 * Math.sin(t * 1.7))
      p.offset.y = 0.03 * Math.sin(t * 1.7)
      break
  }

  if (input.gaze && !p.asleep && !p.task) p.gaze = { ...input.gaze }

  if (chat) {
    p.gaze = { x: 0.8 * chat.facing, y: -0.1 }
    p.offset = { x: 0, y: 0 }
    p.scale = { x: 1, y: 1 }
    p.tilt = 0
    p.thought = null
    p.sparkle = 0
    p.openness = 1
    p.eyeScale = 1
    if (Math.floor(t / 0.6) % 2 === chat.turn) {
      const flap = Math.abs(Math.sin(t * 11))
      p.openness = 1 - 0.35 * flap * motion
      p.eyeScale = 1 + 0.12 * flap * motion
      p.gaze.y -= 0.15 * flap * motion
    }
  }

  if (!p.asleep) p.openness *= blink(t)

  if (sinceChange < 0.45) {
    // A startled pop whenever the phase changes.
    const k = Math.sin((Math.PI * sinceChange) / 0.45)
    p.scale.x *= 1 + 0.16 * k
    p.scale.y *= 1 + 0.16 * k
    p.eyeScale *= 1 + 0.2 * k
    p.openness = Math.max(p.openness, k)
  } else if (sinceTask < 0.3) {
    // A smaller double-take when it picks up a new kind of tool.
    const k = Math.sin((Math.PI * sinceTask) / 0.3)
    p.scale.x *= 1 + 0.07 * k
    p.scale.y *= 1 - 0.05 * k
    p.eyeScale *= 1 + 0.12 * k
  }

  p.offset = { x: p.offset.x * motion, y: p.offset.y * motion }
  p.gaze = { x: p.gaze.x * motion, y: p.gaze.y * motion }
  p.tilt *= motion
  p.scale = { x: 1 + (p.scale.x - 1) * motion, y: 1 + (p.scale.y - 1) * motion }
  const m = Math.hypot(p.gaze.x, p.gaze.y)
  if (m > 1) p.gaze = { x: p.gaze.x / m, y: p.gaze.y / m }
  return p
}

/** Body language for each kind of work; the matching prop is drawn in `drawProps`. */
function act(p: Pose, task: Tool) {
  const t = p.t
  switch (task) {
    case 'read': {
      const [row, u] = cycle(t, 1.2, 3)
      const sweep = u < 0.82 ? u / 0.82 : 1 - (u - 0.82) / 0.18
      p.gaze = { x: -0.6 + 1.2 * sweep, y: 0.55 + 0.12 * row }
      p.openness = 0.85
      p.tilt = -3 + 2 * Math.sin(t * 0.8)
      p.offset.y = -0.02 * Math.sin(t * 2)
      break
    }
    case 'edit': {
      const [, u] = cycle(t, 1.6, 3)
      p.gaze = { x: -0.55 + 1.1 * u, y: 0.65 }
      p.openness = 0.7
      const k = Math.abs(Math.sin(t * 10))
      p.offset.y = 0.03 * k
      p.scale = squash(0.035 * k)
      p.tilt = -2
      break
    }
    case 'search': {
      const a = t * 1.7
      const l = lens(a)
      p.gaze = { x: l.x * 0.95, y: l.y * 0.95 }
      p.eyeScale = 1.2
      p.tilt = 9 * Math.sin(a)
      p.offset.y = -0.03 * Math.sin(2 * a)
      break
    }
    case 'web': {
      const a = t * 2.1
      p.gaze = { x: 0.8 * Math.cos(a), y: 0.3 * Math.sin(a) - 0.2 }
      p.offset.y = -0.07 * Math.sin(t * 1.3)
      p.tilt = 5 * Math.cos(a)
      break
    }
    case 'run': {
      const u = mod(t * 2.6, 1)
      const hop = Math.sin(Math.PI * u)
      p.offset.y = -0.13 * hop
      p.scale = squash(u < 0.15 ? 0.09 * Math.sin((Math.PI * u) / 0.15) : -0.05 * hop)
      p.gaze = { x: 0.5, y: 0.05 }
      p.openness = 0.85
      p.tilt = -7
      break
    }
    case 'test': {
      p.gaze = { x: 0.6 * Math.sin(t * 0.9), y: 0.15 }
      p.openness = 0.5
      p.eyeScale = 1.05
      const u = mod(t, 1.4) / 1.4
      p.offset.y = u < 0.2 ? 0.06 * Math.sin((Math.PI * u) / 0.2) : 0
      break
    }
    case 'build': {
      const u = mod(t, 0.8) / 0.8
      if (u < 0.6) {
        const k = Math.sin(((Math.PI / 2) * u) / 0.6)
        p.offset.y = -0.16 * k
        p.tilt = -8 * k
        p.scale = squash(-0.05 * k)
      } else if (u < 0.7) {
        const k = (u - 0.6) / 0.1
        p.offset.y = -0.16 * (1 - k)
        p.tilt = -8 * (1 - k)
      } else {
        p.scale = squash(0.14 * (1 - (u - 0.7) / 0.3))
      }
      p.gaze = { x: 0.15, y: 0.25 }
      p.openness = 0.6
      p.eyeScale = 1.05
      break
    }
    case 'git': {
      const [row, u] = cycle(t, 0.55, 3)
      p.gaze = { x: 0.85, y: GIT_NODES[row] * 0.7 }
      p.offset.y = u < 0.3 ? -0.08 * Math.sin((Math.PI * u) / 0.3) : 0
      p.tilt = 4
      break
    }
    case 'delete': {
      p.gaze = { x: 0.35, y: 0.45 }
      p.openness = 0.38
      p.eyeScale = 0.95
      const s = mod(t, 1.2)
      if (s < 0.35) p.offset.x = 0.05 * Math.sin(s * 60) * (1 - s / 0.35)
      p.scale = squash(0.04)
      break
    }
    case 'delegate': {
      const a = t * 1.5
      p.gaze = { x: 0.85 * Math.cos(a), y: 0.3 * Math.sin(a) }
      p.offset.y = -0.04 * Math.sin(t * 2)
      p.eyeScale = 1.05
      break
    }
    case 'plan':
      p.gaze = { x: -0.55 + 0.1 * Math.sin(t * 1.3), y: -0.5 }
      p.openness = 0.85
      p.tilt = 6 * Math.sin(t * 0.7)
      p.offset.y = -0.04 * Math.sin(t * 1.4)
      break
  }
}

// MARK: Drawing

type Ctx = CanvasRenderingContext2D

export function withAlpha(color: string, a: number) {
  if (color.startsWith('rgba')) {
    const parts = color.slice(5, -1).split(',')
    return `rgba(${parts[0]},${parts[1]},${parts[2]},${Number(parts[3]) * a})`
  }
  const h = color.replace('#', '')
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.replace('#', ''), 16)
  const ch = (v: number) => Math.round(Math.min(255, Math.max(0, amt > 0 ? v + (255 - v) * amt : v * (1 + amt))))
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`
}

function circle(ctx: Ctx, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2)
}

export interface DrawStyle {
  fill: string
  eyes: string
  accent: string
  /** Soft light from the lower left, like the app icon. Worth it on big orbs only. */
  shaded?: boolean
}

/** Draws the orb centred in a canvas whose CSS size is `size`, orb radius `r`. */
export function drawOrb(ctx: Ctx, size: number, r: number, p: Pose, style: DrawStyle) {
  const { fill, eyes, accent } = style
  ctx.save()
  ctx.translate(size / 2, size / 2)
  drawProps(ctx, p, r, style, false)

  ctx.save()
  ctx.translate(p.offset.x * r, p.offset.y * r)
  ctx.rotate((p.tilt * Math.PI) / 180)
  // Squash about the bottom so landings look grounded.
  ctx.translate(0, r)
  ctx.scale(p.scale.x, p.scale.y)
  ctx.translate(0, -r)

  if (p.glow > 0.01) {
    const g = 1.45 * r
    const grad = ctx.createRadialGradient(0, 0, 0.85 * r, 0, 0, g)
    grad.addColorStop(0, withAlpha(accent, p.glow * 0.8))
    grad.addColorStop(1, withAlpha(accent, 0))
    ctx.fillStyle = grad
    circle(ctx, 0, 0, g)
    ctx.fill()
  }

  if (style.shaded) {
    const grad = ctx.createRadialGradient(-0.45 * r, 0.5 * r, 0, -0.45 * r, 0.5 * r, 1.6 * r)
    grad.addColorStop(0, shade(fill, 0.28))
    grad.addColorStop(0.45, fill)
    grad.addColorStop(1, shade(fill, -0.22))
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = fill
  }
  circle(ctx, 0, 0, r)
  ctx.fill()

  for (const side of [-1, 1]) drawEye(ctx, p, side, r, eyes)
  drawHeldProps(ctx, p, r, accent)
  ctx.restore()

  drawProps(ctx, p, r, style, true)

  // These ride on the body's transform but sit outside it.
  ctx.save()
  ctx.translate(p.offset.x * r, p.offset.y * r)
  ctx.rotate((p.tilt * Math.PI) / 180)
  ctx.translate(0, r)
  ctx.scale(p.scale.x, p.scale.y)
  ctx.translate(0, -r)
  if (p.sparkle > 0.01) drawSparkle(ctx, 1.05 * r, -0.95 * r, 0.32 * r * p.sparkle, fill)
  if (p.thought !== null) drawThought(ctx, p.thought, r)
  ctx.restore()

  if (p.asleep) drawSnores(ctx, p, r)
  ctx.restore()
}

function drawEye(ctx: Ctx, p: Pose, side: number, r: number, color: string) {
  const { gaze } = p
  const far = side * gaze.x > 0
  const persp = far ? 1 - 0.28 * Math.abs(gaze.x) : 1
  const len = 0.56 * r * p.eyeScale * persp
  const wid = 0.28 * r * p.eyeScale * (far ? 0.85 : 1)

  ctx.save()
  ctx.translate(side * 0.3 * r * (1 - 0.2 * Math.abs(gaze.x)) + gaze.x * 0.42 * r, -0.1 * r + gaze.y * 0.38 * r)
  ctx.rotate((55 * gaze.x * gaze.y * Math.PI) / 180)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineCap = 'round'

  if (p.asleep) {
    ctx.lineWidth = wid * 0.5
    ctx.beginPath()
    ctx.moveTo(-wid * 0.75, 0)
    ctx.quadraticCurveTo(0, len * 0.32, wid * 0.75, 0)
    ctx.stroke()
  } else if (p.wink && side > 0) {
    ctx.lineWidth = wid * 0.6
    ctx.beginPath()
    ctx.moveTo(-wid * 0.6, len * 0.15)
    ctx.quadraticCurveTo(0, -len * 0.45, wid * 0.6, len * 0.15)
    ctx.stroke()
  } else {
    const h = Math.max(len * p.openness, wid * 0.5)
    const w = p.openness < 0.3 ? wid * 1.2 : wid
    ctx.beginPath()
    ctx.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) / 2)
    ctx.fill()
  }
  ctx.restore()
}

/** Props the orb holds, so they move with its tilt and squash. */
function drawHeldProps(ctx: Ctx, p: Pose, r: number, accent: string) {
  const t = p.t * p.motion
  if (p.task === 'read') {
    const [row, u] = cycle(t, 1.2, 3)
    drawPage(ctx, t, r, accent, row, u < 0.82 ? u / 0.82 : 1, false)
  } else if (p.task === 'edit') {
    const [row, u] = cycle(t, 1.6, 3)
    drawPage(ctx, t, r, accent, row, u, true)
  } else if (p.task === 'search') {
    drawLens(ctx, lens(t * 1.7), r)
  }
}

/** Props around the orb. `front: false` draws the parts that pass behind it. */
function drawProps(ctx: Ctx, p: Pose, r: number, style: DrawStyle, front: boolean) {
  const t = p.t * p.motion
  switch (p.task) {
    case 'web':
      // Satellite with a fading trail on a tilted orbit.
      for (let i = 6; i >= 0; i--) {
        const a = t * 2.1 - i * 0.13
        if (Math.sin(a) >= 0 !== front) continue
        const o = orbit(a, r)
        const s = r * (i === 0 ? 0.17 : 0.11 * (1 - i / 8)) * (0.85 + 0.15 * Math.sin(a))
        ctx.fillStyle = withAlpha(WORKING, i === 0 ? 1 : 0.5 * (1 - i / 7))
        circle(ctx, o.x, o.y, s)
        ctx.fill()
      }
      break
    case 'delegate': {
      const n = Math.min(3, Math.max(1, p.subagents))
      for (let i = 0; i < n; i++) {
        const a = t * 1.5 + (i * 2 * Math.PI) / n
        if (Math.sin(a) >= 0 !== front) continue
        drawHelper(ctx, orbit(a, r), r * 0.3 * (0.85 + 0.15 * Math.sin(a)), style.fill, style.eyes, t + i)
      }
      break
    }
    case 'run':
      if (front) break
      ;[-0.35, 0.05, 0.45].forEach((y, i) => {
        const k = 0.5 + 0.5 * Math.sin(t * 9 + i * 1.7)
        const x0 = -1.2 * r
        const len = r * (0.3 + 0.35 * k)
        ctx.strokeStyle = `rgba(255,255,255,${0.25 + 0.3 * k})`
        ctx.lineWidth = r * 0.08
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(x0, y * r)
        ctx.lineTo(x0 - len, y * r)
        ctx.stroke()
      })
      break
    case 'build': {
      if (!front) break
      const u = mod(t, 0.8) / 0.8
      if (u < 0.7) break
      const k = (u - 0.7) / 0.3
      for (const side of [-1, 1]) {
        for (let j = 0; j < 2; j++) {
          const s = r * (0.15 - 0.04 * j) * (1 - 0.4 * k)
          ctx.fillStyle = `rgba(255,255,255,${0.55 * (1 - k)})`
          circle(ctx, side * r * (0.75 + 0.55 * k + 0.2 * j), r * (0.95 - 0.25 * k - 0.1 * j), s)
          ctx.fill()
        }
      }
      break
    }
    case 'git': {
      if (!front) break
      const [row, u] = cycle(t, 0.55, 3)
      const x = 1.45 * r
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = r * 0.07
      ctx.beginPath()
      ctx.moveTo(x, GIT_NODES[0] * r)
      ctx.lineTo(x, GIT_NODES[2] * r)
      ctx.stroke()
      GIT_NODES.forEach((y, i) => {
        const lit = i === row
        const s = r * (lit ? 0.14 + 0.04 * Math.sin(Math.PI * Math.min(1, u * 3)) : 0.11)
        ctx.fillStyle = lit ? style.accent : 'rgba(255,255,255,0.45)'
        circle(ctx, x, y * r, s)
        ctx.fill()
        if (lit && u < 0.6) {
          ctx.strokeStyle = withAlpha(style.accent, 0.6 * (1 - u / 0.6))
          ctx.lineWidth = r * 0.05
          circle(ctx, x, y * r, s + (r * 0.25 * u) / 0.6)
          ctx.stroke()
        }
      })
      break
    }
    case 'test': {
      if (!front) break
      // A check mark pops up, holds, and fades.
      const u = mod(t, 1.4) / 1.4
      const pop = u < 0.2 ? overshoot(u / 0.2) : 1
      const op = u < 0.75 ? 1 : 1 - (u - 0.75) / 0.25
      drawCheck(ctx, 1.2 * r, -0.95 * r, r * 0.32 * pop, withAlpha(DONE, op), r * 0.12)
      break
    }
    case 'plan': {
      if (!front) break
      // A three-item checklist ticking off one by one.
      const u = mod(t, 3) / 3
      ;[-0.6, 0, 0.6].forEach((y, i) => {
        const bx = 1.25 * r
        const by = (y - 0.14) * r
        const bs = 0.28 * r
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'
        ctx.lineWidth = r * 0.05
        ctx.beginPath()
        ctx.roundRect(bx, by, bs, bs, r * 0.06)
        ctx.stroke()
        const at = 0.15 + i * 0.22
        if (u <= at) return
        const pop = overshoot(Math.min(1, (u - at) / 0.08))
        drawCheck(ctx, bx + bs / 2, by + bs / 2, r * 0.2 * pop, DONE, r * 0.08)
      })
      break
    }
    case 'delete': {
      if (!front) break
      // Crumbs tumbling off the bottom.
      for (let i = 0; i < 3; i++) {
        const q = mod(t * 0.9 + i / 3, 1)
        const s = r * 0.1 * (1 - 0.4 * q)
        ctx.save()
        ctx.translate(r * (0.35 + 0.25 * i + 0.2 * q), r * (0.8 + 0.9 * q * q))
        ctx.rotate(q * 5 + i)
        ctx.fillStyle = `rgba(255,255,255,${0.75 * (1 - q)})`
        ctx.fillRect(-s, -s, 2 * s, 2 * s)
        ctx.restore()
      }
      break
    }
  }
}

/** A little page held in front of the body; the line being read or written is lit. */
function drawPage(ctx: Ctx, t: number, r: number, accent: string, row: number, progress: number, writing: boolean) {
  ctx.save()
  ctx.translate(0, 0.82 * r)
  ctx.rotate((-6 * Math.PI) / 180)
  ctx.beginPath()
  ctx.roundRect(-0.62 * r, -0.38 * r, 1.24 * r, 0.76 * r, r * 0.1)
  ctx.fillStyle = '#F7F7F7'
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'
  ctx.lineWidth = r * 0.04
  ctx.stroke()
  const x0 = -0.46 * r
  const full = 0.92 * r
  const bar = (y: number, to: number, color: string) => {
    ctx.strokeStyle = color
    ctx.lineWidth = r * 0.08
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x0, y)
    ctx.lineTo(x0 + Math.max(0.01, to), y)
    ctx.stroke()
  }
  for (let i = 0; i < 3; i++) {
    const y = (-0.18 + 0.18 * i) * r
    const len = full * (i === 2 ? 0.62 : 1)
    if (writing) {
      // Earlier lines are written, the current one grows behind a blinking caret.
      if (i < row) bar(y, len, '#8C8C8C')
      if (i === row) {
        const end = len * progress
        bar(y, end, accent)
        if (Math.sin(t * 12) > -0.2) {
          ctx.strokeStyle = 'rgba(0,0,0,0.7)'
          ctx.lineWidth = r * 0.045
          ctx.beginPath()
          ctx.moveTo(x0 + end + r * 0.07, y - r * 0.09)
          ctx.lineTo(x0 + end + r * 0.07, y + r * 0.09)
          ctx.stroke()
        }
      }
    } else {
      bar(y, len, '#C7C7C7')
      if (i === row) bar(y, len * progress, accent)
    }
  }
  ctx.restore()
}

function drawLens(ctx: Ctx, c: Vec, r: number) {
  const cx = c.x * r
  const cy = c.y * r - 0.05 * r
  const rr = 0.34 * r
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#333'
  ctx.lineWidth = r * 0.14
  ctx.beginPath()
  ctx.moveTo(cx + rr * 0.72, cy + rr * 0.72)
  ctx.lineTo(cx + rr * 1.55, cy + rr * 1.55)
  ctx.stroke()
  circle(ctx, cx, cy, rr)
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.fill()
  ctx.strokeStyle = '#F2F2F2'
  ctx.lineWidth = r * 0.09
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = r * 0.06
  ctx.beginPath()
  ctx.arc(cx, cy, rr * 0.62, (200 * Math.PI) / 180, (250 * Math.PI) / 180)
  ctx.stroke()
}

/** A mini orb with dot eyes, for subagents. */
function drawHelper(ctx: Ctx, c: Vec, s: number, fill: string, eyes: string, t: number) {
  const bob = 0.15 * s * Math.sin(t * 6)
  ctx.fillStyle = fill
  circle(ctx, c.x, c.y + bob, s)
  ctx.fill()
  const open = blink(t * 1.3)
  ctx.fillStyle = eyes
  for (const side of [-1, 1]) {
    const w = s * 0.26
    const h = Math.max(w * 0.5, s * 0.55 * open)
    ctx.beginPath()
    ctx.roundRect(c.x + side * s * 0.32 - w / 2, c.y - s * 0.12 - h / 2 + bob, w, h, w / 2)
    ctx.fill()
  }
}

function drawCheck(ctx: Ctx, x: number, y: number, s: number, color: string, width: number) {
  if (s <= 0.1) return
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(x - s, y)
  ctx.lineTo(x - s * 0.3, y + s * 0.7)
  ctx.lineTo(x + s, y - s * 0.75)
  ctx.stroke()
}

/** Three z's drifting up and growing as they fade. */
function drawSnores(ctx: Ctx, p: Pose, r: number) {
  ctx.font = `800 ${r}px "Plus Jakarta Sans Variable", system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < 3; i++) {
    const q = mod(p.t * 0.45 * p.motion + i / 3, 1)
    ctx.save()
    ctx.translate(r * (0.85 + 0.5 * q + 0.12 * Math.sin(q * 6)), -r * (0.65 + 0.85 * q))
    ctx.scale(0.45 + 0.35 * q, 0.45 + 0.35 * q)
    ctx.globalAlpha = 0.8 * Math.sin(Math.PI * q)
    ctx.fillStyle = '#fff'
    ctx.fillText('z', 0, 0)
    ctx.restore()
  }
}

/** Three dots rising up-right, lighting one after another like "…". */
function drawThought(ctx: Ctx, t: number, r: number) {
  const dots: [number, number, number][] = [
    [0.95, -0.75, 0.11],
    [1.2, -1.05, 0.15],
    [1.5, -1.32, 0.19],
  ]
  dots.forEach(([x, y, size], i) => {
    const ph = mod(t * 1.6 - i * 0.33, 1)
    const lit = 0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(Math.PI * ph)), 2)
    ctx.fillStyle = withAlpha(THINKING, lit)
    circle(ctx, x * r, y * r, size * r * (0.85 + 0.15 * lit))
    ctx.fill()
  })
}

/** Four-point star with pinched sides. */
function drawSparkle(ctx: Ctx, x: number, y: number, s: number, color: string) {
  const pinch = s * 0.18
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, y - s)
  ctx.quadraticCurveTo(x + pinch, y - pinch, x + s, y)
  ctx.quadraticCurveTo(x + pinch, y + pinch, x, y + s)
  ctx.quadraticCurveTo(x - pinch, y + pinch, x - s, y)
  ctx.quadraticCurveTo(x - pinch, y - pinch, x, y - s)
  ctx.fill()
}

// One requestAnimationFrame loop for every orb on the page, plus one pointer listener.
// Orbs subscribe only while they are on screen, so an idle page costs nothing.

type Frame = (now: number) => void

const subscribers = new Set<Frame>()
let raf = 0

function loop(ms: number) {
  const now = ms / 1000
  subscribers.forEach((f) => f(now))
  raf = subscribers.size ? requestAnimationFrame(loop) : 0
}

export function subscribe(frame: Frame) {
  subscribers.add(frame)
  if (!raf) raf = requestAnimationFrame(loop)
  return () => {
    subscribers.delete(frame)
  }
}

export const pointer = { x: -1, y: -1, movedAt: -Infinity, inside: false }

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.movedAt = performance.now() / 1000
      pointer.inside = true
    },
    { passive: true },
  )
  document.addEventListener('pointerleave', () => {
    pointer.inside = false
  })
}

export const now = () => performance.now() / 1000

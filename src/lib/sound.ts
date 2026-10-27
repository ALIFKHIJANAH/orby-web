// The app's 8-bit cues (SoundPlayer.swift): square wave, short decay per note,
// 120 ms silent lead-in. (frequency Hz, duration ms); 0 Hz is a rest.

import type { Phase } from '../orb/pose'

export interface Cue {
  id: string
  name: string
  phase: Phase
  notes: [number, number][]
}

export const CUES: Cue[] = [
  { id: 'permission', name: 'Permission request', phase: 'needs', notes: [[880, 70], [1175, 90], [0, 60], [880, 70], [1175, 120]] },
  { id: 'question', name: 'Question', phase: 'needs', notes: [[784, 80], [988, 80], [1319, 140]] },
  { id: 'plan', name: 'Plan ready', phase: 'needs', notes: [[659, 90], [880, 90], [1109, 160]] },
  { id: 'complete', name: 'Task complete', phase: 'done', notes: [[523, 70], [659, 70], [784, 70], [1047, 180]] },
  { id: 'error', name: 'Error', phase: 'error', notes: [[440, 110], [349, 110], [262, 220]] },
  { id: 'start', name: 'Session start', phase: 'working', notes: [[1047, 50], [1568, 80]] },
  { id: 'context', name: 'Context almost full', phase: 'needs', notes: [[988, 80], [0, 50], [988, 80], [784, 160]] },
]

let ctx: AudioContext | null = null
const LEAD_IN = 0.12

/** Plays a cue; calls `onNote(i)` as each note starts. Returns the total length in ms. */
export function play(cue: Cue, onNote?: (i: number) => void) {
  ctx ??= new AudioContext()
  const ac = ctx
  if (ac.state === 'suspended') void ac.resume()
  const master = ac.createGain()
  master.gain.value = 0.07
  master.connect(ac.destination)
  let at = ac.currentTime + LEAD_IN
  let ms = LEAD_IN * 1000
  cue.notes.forEach(([freq, dur], i) => {
    const seconds = dur / 1000
    window.setTimeout(() => onNote?.(i), ms)
    if (freq > 0) {
      const osc = ac.createOscillator()
      const env = ac.createGain()
      osc.type = 'square'
      osc.frequency.value = freq
      env.gain.setValueAtTime(0, at)
      env.gain.linearRampToValueAtTime(1, at + 0.004)
      env.gain.exponentialRampToValueAtTime(0.25, at + seconds)
      env.gain.linearRampToValueAtTime(0, at + seconds + 0.01)
      osc.connect(env).connect(master)
      osc.start(at)
      osc.stop(at + seconds + 0.02)
    }
    at += seconds
    ms += dur
  })
  window.setTimeout(() => onNote?.(-1), ms)
  return ms
}

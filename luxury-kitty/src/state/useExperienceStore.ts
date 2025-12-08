import { create } from 'zustand'

export type MachineState = 'CHAOS' | 'FORMED'

type GestureVector = {
  x: number
  y: number
}

interface ExperienceState {
  machineState: MachineState
  targetState: MachineState
  progress: number
  targetProgress: number
  gestureInfluence: GestureVector
  setTargetState: (next: MachineState) => void
  toggleState: () => void
  setProgress: (value: number) => void
  setGestureInfluence: (value: GestureVector) => void
}

const clamp = (value: number) => Math.max(0, Math.min(1, value))

export const useExperienceStore = create<ExperienceState>((set, get) => ({
  machineState: 'FORMED',
  targetState: 'FORMED',
  progress: 1,
  targetProgress: 1,
  gestureInfluence: { x: 0, y: 0 },
  setTargetState: (next) =>
    set({
      targetState: next,
      targetProgress: next === 'FORMED' ? 1 : 0,
    }),
  toggleState: () => {
    const currentTarget = get().targetState
    const next = currentTarget === 'FORMED' ? 'CHAOS' : 'FORMED'
    set({
      targetState: next,
      targetProgress: next === 'FORMED' ? 1 : 0,
    })
  },
  setProgress: (value) =>
    set((prev) => {
      const bounded = clamp(value)
      return {
        progress: bounded,
        machineState:
          bounded > 0.92 ? 'FORMED' : bounded < 0.08 ? 'CHAOS' : prev.machineState,
      }
    }),
  setGestureInfluence: (gestureInfluence) => set({ gestureInfluence }),
}))

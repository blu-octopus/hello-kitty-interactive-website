import { describe, it, expect, beforeEach } from 'vitest'
import { useExperienceStore, type MachineState } from './useExperienceStore'

describe('useExperienceStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useExperienceStore.setState({
      machineState: 'FORMED',
      targetState: 'FORMED',
      progress: 1,
      targetProgress: 1,
      gestureInfluence: { x: 0, y: 0 },
    })
  })

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useExperienceStore.getState()
      expect(state.machineState).toBe('FORMED')
      expect(state.targetState).toBe('FORMED')
      expect(state.progress).toBe(1)
      expect(state.targetProgress).toBe(1)
      expect(state.gestureInfluence).toEqual({ x: 0, y: 0 })
    })
  })

  describe('setTargetState', () => {
    it('should set targetState to CHAOS and targetProgress to 0', () => {
      useExperienceStore.getState().setTargetState('CHAOS')
      const state = useExperienceStore.getState()
      expect(state.targetState).toBe('CHAOS')
      expect(state.targetProgress).toBe(0)
    })

    it('should set targetState to FORMED and targetProgress to 1', () => {
      useExperienceStore.getState().setTargetState('FORMED')
      const state = useExperienceStore.getState()
      expect(state.targetState).toBe('FORMED')
      expect(state.targetProgress).toBe(1)
    })
  })

  describe('toggleState', () => {
    it('should toggle from FORMED to CHAOS', () => {
      useExperienceStore.getState().setTargetState('FORMED')
      useExperienceStore.getState().toggleState()
      const state = useExperienceStore.getState()
      expect(state.targetState).toBe('CHAOS')
      expect(state.targetProgress).toBe(0)
    })

    it('should toggle from CHAOS to FORMED', () => {
      useExperienceStore.getState().setTargetState('CHAOS')
      useExperienceStore.getState().toggleState()
      const state = useExperienceStore.getState()
      expect(state.targetState).toBe('FORMED')
      expect(state.targetProgress).toBe(1)
    })
  })

  describe('setProgress', () => {
    it('should set progress to a valid value', () => {
      useExperienceStore.getState().setProgress(0.5)
      const state = useExperienceStore.getState()
      expect(state.progress).toBe(0.5)
    })

    it('should clamp progress values below 0 to 0', () => {
      useExperienceStore.getState().setProgress(-0.5)
      const state = useExperienceStore.getState()
      expect(state.progress).toBe(0)
    })

    it('should clamp progress values above 1 to 1', () => {
      useExperienceStore.getState().setProgress(1.5)
      const state = useExperienceStore.getState()
      expect(state.progress).toBe(1)
    })

    it('should set machineState to FORMED when progress > 0.92', () => {
      useExperienceStore.getState().setProgress(0.93)
      const state = useExperienceStore.getState()
      expect(state.machineState).toBe('FORMED')
    })

    it('should set machineState to CHAOS when progress < 0.08', () => {
      useExperienceStore.getState().setProgress(0.07)
      const state = useExperienceStore.getState()
      expect(state.machineState).toBe('CHAOS')
    })

    it('should preserve machineState when progress is between 0.08 and 0.92', () => {
      // Set initial state to CHAOS
      useExperienceStore.getState().setProgress(0.05)
      expect(useExperienceStore.getState().machineState).toBe('CHAOS')

      // Set progress to middle value
      useExperienceStore.getState().setProgress(0.5)
      const state = useExperienceStore.getState()
      expect(state.progress).toBe(0.5)
      expect(state.machineState).toBe('CHAOS') // Should remain CHAOS

      // Set initial state to FORMED
      useExperienceStore.getState().setProgress(0.95)
      expect(useExperienceStore.getState().machineState).toBe('FORMED')

      // Set progress to middle value
      useExperienceStore.getState().setProgress(0.5)
      const state2 = useExperienceStore.getState()
      expect(state2.progress).toBe(0.5)
      expect(state2.machineState).toBe('FORMED') // Should remain FORMED
    })
  })

  describe('setGestureInfluence', () => {
    it('should set gestureInfluence to a new value', () => {
      const newInfluence = { x: 0.5, y: -0.3 }
      useExperienceStore.getState().setGestureInfluence(newInfluence)
      const state = useExperienceStore.getState()
      expect(state.gestureInfluence).toEqual(newInfluence)
    })

    it('should update gestureInfluence multiple times', () => {
      useExperienceStore.getState().setGestureInfluence({ x: 1, y: 1 })
      expect(useExperienceStore.getState().gestureInfluence).toEqual({ x: 1, y: 1 })

      useExperienceStore.getState().setGestureInfluence({ x: -1, y: 0 })
      expect(useExperienceStore.getState().gestureInfluence).toEqual({ x: -1, y: 0 })
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete state transition from FORMED to CHAOS', () => {
      // Start in FORMED state
      expect(useExperienceStore.getState().targetState).toBe('FORMED')
      expect(useExperienceStore.getState().progress).toBe(1)

      // Toggle to CHAOS
      useExperienceStore.getState().toggleState()
      expect(useExperienceStore.getState().targetState).toBe('CHAOS')
      expect(useExperienceStore.getState().targetProgress).toBe(0)

      // Simulate progress transition
      useExperienceStore.getState().setProgress(0.5)
      expect(useExperienceStore.getState().progress).toBe(0.5)

      // Complete transition
      useExperienceStore.getState().setProgress(0.05)
      expect(useExperienceStore.getState().machineState).toBe('CHAOS')
    })

    it('should handle gesture influence during state transition', () => {
      useExperienceStore.getState().setTargetState('CHAOS')
      useExperienceStore.getState().setGestureInfluence({ x: 0.8, y: 0.2 })
      useExperienceStore.getState().setProgress(0.3)

      const state = useExperienceStore.getState()
      expect(state.targetState).toBe('CHAOS')
      expect(state.gestureInfluence).toEqual({ x: 0.8, y: 0.2 })
      expect(state.progress).toBe(0.3)
    })
  })
})

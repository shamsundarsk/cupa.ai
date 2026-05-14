'use client'

import { create } from 'zustand'
import { ViewKey } from './types'

export interface StoryStep {
  id: number
  title: string
  narration: string
  durationMs: number
  view: ViewKey
  /** Optional async side effect fired at the START of the step. */
  action?: () => Promise<void> | void
}

interface StoryState {
  isPlaying: boolean
  currentStep: number
  progress: number // 0..100 within current step
  steps: StoryStep[]
  start: () => void
  stop: () => void
  next: () => void
  setProgress: (n: number) => void
  setSteps: (steps: StoryStep[]) => void
}

export const useStoryStore = create<StoryState>((set, get) => ({
  isPlaying: false,
  currentStep: 0,
  progress: 0,
  steps: [],
  start: () => set({ isPlaying: true, currentStep: 0, progress: 0 }),
  stop: () => set({ isPlaying: false, currentStep: 0, progress: 0 }),
  next: () => {
    const { currentStep, steps } = get()
    const nextStep = currentStep + 1
    if (nextStep >= steps.length) {
      set({ isPlaying: false, currentStep: 0, progress: 0 })
    } else {
      set({ currentStep: nextStep, progress: 0 })
    }
  },
  setProgress: (n) => set({ progress: Math.max(0, Math.min(100, n)) }),
  setSteps: (steps) => set({ steps }),
}))

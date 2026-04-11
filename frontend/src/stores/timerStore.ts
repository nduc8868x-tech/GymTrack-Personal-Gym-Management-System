import { create } from 'zustand';

interface TimerState {
  secondsLeft: number;
  isRunning: boolean;
  totalSeconds: number;
  start: (seconds: number) => void;
  tick: () => void;
  stop: () => void;
  reset: () => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  secondsLeft: 0,
  isRunning: false,
  totalSeconds: 0,
  start: (seconds) => set({ secondsLeft: seconds, totalSeconds: seconds, isRunning: true }),
  tick: () =>
    set((state) => ({
      secondsLeft: Math.max(0, state.secondsLeft - 1),
      isRunning: state.secondsLeft > 1,
    })),
  stop: () => set({ isRunning: false }),
  reset: () => set({ secondsLeft: 0, isRunning: false, totalSeconds: 0 }),
}));

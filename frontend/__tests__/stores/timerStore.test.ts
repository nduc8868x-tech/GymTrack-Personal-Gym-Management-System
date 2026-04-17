import { useTimerStore } from '@/stores/timerStore';

beforeEach(() => {
  useTimerStore.setState({ secondsLeft: 0, isRunning: false, totalSeconds: 0 });
});

describe('timerStore', () => {
  describe('start', () => {
    it('should initialize timer with given seconds', () => {
      useTimerStore.getState().start(90);
      const state = useTimerStore.getState();

      expect(state.secondsLeft).toBe(90);
      expect(state.totalSeconds).toBe(90);
      expect(state.isRunning).toBe(true);
    });

    it('should restart timer when called again', () => {
      useTimerStore.getState().start(90);
      useTimerStore.getState().tick(); // 89
      useTimerStore.getState().start(120);
      const state = useTimerStore.getState();

      expect(state.secondsLeft).toBe(120);
      expect(state.totalSeconds).toBe(120);
      expect(state.isRunning).toBe(true);
    });
  });

  describe('tick', () => {
    it('should decrement secondsLeft by 1', () => {
      useTimerStore.getState().start(90);
      useTimerStore.getState().tick();

      expect(useTimerStore.getState().secondsLeft).toBe(89);
      expect(useTimerStore.getState().isRunning).toBe(true);
    });

    it('should stop running when reaching 0', () => {
      useTimerStore.getState().start(2);
      useTimerStore.getState().tick(); // 1, still running
      expect(useTimerStore.getState().isRunning).toBe(true);

      useTimerStore.getState().tick(); // 0, stops
      expect(useTimerStore.getState().secondsLeft).toBe(0);
      expect(useTimerStore.getState().isRunning).toBe(false);
    });

    it('should not go below 0', () => {
      useTimerStore.getState().start(1);
      useTimerStore.getState().tick(); // 0
      useTimerStore.getState().tick(); // still 0
      useTimerStore.getState().tick(); // still 0

      expect(useTimerStore.getState().secondsLeft).toBe(0);
    });
  });

  describe('stop', () => {
    it('should stop the timer without resetting', () => {
      useTimerStore.getState().start(90);
      useTimerStore.getState().tick(); // 89
      useTimerStore.getState().stop();
      const state = useTimerStore.getState();

      expect(state.isRunning).toBe(false);
      expect(state.secondsLeft).toBe(89);
      expect(state.totalSeconds).toBe(90);
    });
  });

  describe('reset', () => {
    it('should reset everything to zero', () => {
      useTimerStore.getState().start(90);
      useTimerStore.getState().tick();
      useTimerStore.getState().reset();
      const state = useTimerStore.getState();

      expect(state.secondsLeft).toBe(0);
      expect(state.totalSeconds).toBe(0);
      expect(state.isRunning).toBe(false);
    });
  });

  describe('full timer lifecycle', () => {
    it('should count down from 3 to 0 then stop', () => {
      useTimerStore.getState().start(3);

      useTimerStore.getState().tick(); // 2
      expect(useTimerStore.getState().secondsLeft).toBe(2);
      expect(useTimerStore.getState().isRunning).toBe(true);

      useTimerStore.getState().tick(); // 1
      expect(useTimerStore.getState().secondsLeft).toBe(1);
      expect(useTimerStore.getState().isRunning).toBe(true);

      useTimerStore.getState().tick(); // 0
      expect(useTimerStore.getState().secondsLeft).toBe(0);
      expect(useTimerStore.getState().isRunning).toBe(false);
    });
  });
});

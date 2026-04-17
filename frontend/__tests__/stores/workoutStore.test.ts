import { useWorkoutStore } from '@/stores/workoutStore';
import type { SetLog } from '@/stores/workoutStore';

// Reset store before each test
beforeEach(() => {
  useWorkoutStore.setState({ activeSession: null });
});

const mockSession = {
  id: 'session-1',
  name: 'Leg Day',
  startedAt: '2024-03-15T10:00:00Z',
};

const mockSet: SetLog = {
  id: 'set-1',
  exerciseId: 'ex-1',
  exerciseName: 'Squat',
  setNumber: 1,
  reps: 10,
  weightKg: 100,
  isPersonalRecord: false,
};

describe('workoutStore', () => {
  describe('startSession', () => {
    it('should start a session with empty sets', () => {
      useWorkoutStore.getState().startSession(mockSession);
      const { activeSession } = useWorkoutStore.getState();

      expect(activeSession).not.toBeNull();
      expect(activeSession!.id).toBe('session-1');
      expect(activeSession!.name).toBe('Leg Day');
      expect(activeSession!.sets).toEqual([]);
    });
  });

  describe('addSet', () => {
    it('should add a set to the active session', () => {
      useWorkoutStore.getState().startSession(mockSession);
      useWorkoutStore.getState().addSet(mockSet);
      const { activeSession } = useWorkoutStore.getState();

      expect(activeSession!.sets).toHaveLength(1);
      expect(activeSession!.sets[0].exerciseName).toBe('Squat');
      expect(activeSession!.sets[0].weightKg).toBe(100);
    });

    it('should append multiple sets', () => {
      useWorkoutStore.getState().startSession(mockSession);
      useWorkoutStore.getState().addSet(mockSet);
      useWorkoutStore.getState().addSet({ ...mockSet, id: 'set-2', setNumber: 2, reps: 8 });
      useWorkoutStore.getState().addSet({ ...mockSet, id: 'set-3', setNumber: 3, reps: 6 });
      const { activeSession } = useWorkoutStore.getState();

      expect(activeSession!.sets).toHaveLength(3);
      expect(activeSession!.sets[2].reps).toBe(6);
    });

    it('should not add set if no active session', () => {
      useWorkoutStore.getState().addSet(mockSet);
      const { activeSession } = useWorkoutStore.getState();
      expect(activeSession).toBeNull();
    });
  });

  describe('removeSet', () => {
    it('should remove a set by id', () => {
      useWorkoutStore.getState().startSession(mockSession);
      useWorkoutStore.getState().addSet(mockSet);
      useWorkoutStore.getState().addSet({ ...mockSet, id: 'set-2', setNumber: 2 });
      useWorkoutStore.getState().removeSet('set-1');
      const { activeSession } = useWorkoutStore.getState();

      expect(activeSession!.sets).toHaveLength(1);
      expect(activeSession!.sets[0].id).toBe('set-2');
    });

    it('should handle removing non-existent set id gracefully', () => {
      useWorkoutStore.getState().startSession(mockSession);
      useWorkoutStore.getState().addSet(mockSet);
      useWorkoutStore.getState().removeSet('non-existent');
      const { activeSession } = useWorkoutStore.getState();

      expect(activeSession!.sets).toHaveLength(1);
    });

    it('should not crash if no active session', () => {
      useWorkoutStore.getState().removeSet('set-1');
      expect(useWorkoutStore.getState().activeSession).toBeNull();
    });
  });

  describe('endSession', () => {
    it('should clear the active session', () => {
      useWorkoutStore.getState().startSession(mockSession);
      useWorkoutStore.getState().addSet(mockSet);
      useWorkoutStore.getState().endSession();

      expect(useWorkoutStore.getState().activeSession).toBeNull();
    });
  });
});

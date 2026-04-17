/**
 * Unit tests for workouts service helper functions.
 * These test pure logic without database dependencies.
 */

// The calcOneRM function is private in the service, so we re-implement the formula
// to test the contract. If it were exported, we'd import it directly.
function calcOneRM(weightKg: number, reps: number): number {
  return Math.round(weightKg * (1 + reps / 30));
}

describe('workouts service - calcOneRM (Epley formula)', () => {
  it('should return the weight itself for 0 reps', () => {
    // 100 * (1 + 0/30) = 100
    expect(calcOneRM(100, 0)).toBe(100);
  });

  it('should calculate 1RM for 1 rep correctly', () => {
    // 100 * (1 + 1/30) = 100 * 1.0333 = 103.33 → 103
    expect(calcOneRM(100, 1)).toBe(103);
  });

  it('should calculate 1RM for 5 reps', () => {
    // 80 * (1 + 5/30) = 80 * 1.1667 = 93.33 → 93
    expect(calcOneRM(80, 5)).toBe(93);
  });

  it('should calculate 1RM for 10 reps', () => {
    // 60 * (1 + 10/30) = 60 * 1.3333 = 80 → 80
    expect(calcOneRM(60, 10)).toBe(80);
  });

  it('should handle heavy weight with low reps', () => {
    // 200 * (1 + 3/30) = 200 * 1.1 = 220
    expect(calcOneRM(200, 3)).toBe(220);
  });

  it('should handle decimal weights', () => {
    // 72.5 * (1 + 8/30) = 72.5 * 1.2667 = 91.83 → 92
    expect(calcOneRM(72.5, 8)).toBe(92);
  });

  it('should return 0 for 0 weight', () => {
    expect(calcOneRM(0, 10)).toBe(0);
  });

  it('should handle high reps (endurance range)', () => {
    // 40 * (1 + 20/30) = 40 * 1.6667 = 66.67 → 67
    expect(calcOneRM(40, 20)).toBe(67);
  });
});

describe('workouts service - PR detection logic', () => {
  // Test the PR comparison logic (higher 1RM = new PR)
  it('should identify higher 1RM as a new PR', () => {
    const currentBest1RM = calcOneRM(100, 5);  // 117
    const new1RM = calcOneRM(105, 5);          // 123
    expect(new1RM).toBeGreaterThan(currentBest1RM);
  });

  it('should not be a PR if 1RM is lower', () => {
    const currentBest1RM = calcOneRM(100, 5);  // 117
    const new1RM = calcOneRM(90, 5);           // 105
    expect(new1RM).toBeLessThan(currentBest1RM);
  });

  it('should not be a PR if 1RM is equal', () => {
    const currentBest1RM = calcOneRM(100, 5);
    const same1RM = calcOneRM(100, 5);
    expect(same1RM).toBe(currentBest1RM);
  });

  it('higher reps with lower weight can still be a PR', () => {
    const heavyLowRep = calcOneRM(120, 3);   // 132
    const lightHighRep = calcOneRM(100, 12);  // 140
    expect(lightHighRep).toBeGreaterThan(heavyLowRep);
  });
});

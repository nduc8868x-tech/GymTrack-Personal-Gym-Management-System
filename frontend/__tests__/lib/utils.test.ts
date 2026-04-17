import { formatDate, calcMacroCalories, calcOneRM } from '@/lib/utils';

describe('formatDate', () => {
  it('should format a Date object to dd/mm/yyyy (vi-VN)', () => {
    const result = formatDate(new Date('2024-03-15'));
    // vi-VN format: dd/mm/yyyy
    expect(result).toContain('15');
    expect(result).toContain('03');
    expect(result).toContain('2024');
  });

  it('should format a date string', () => {
    const result = formatDate('2024-12-25');
    expect(result).toContain('25');
    expect(result).toContain('12');
    expect(result).toContain('2024');
  });

  it('should handle ISO date strings', () => {
    const result = formatDate('2024-01-01T10:30:00Z');
    expect(result).toContain('2024');
  });
});

describe('calcMacroCalories', () => {
  it('should calculate calories from macros correctly', () => {
    // protein * 4 + carbs * 4 + fat * 9
    expect(calcMacroCalories(150, 200, 65)).toBe(150 * 4 + 200 * 4 + 65 * 9);
  });

  it('should return 0 for zero macros', () => {
    expect(calcMacroCalories(0, 0, 0)).toBe(0);
  });

  it('should handle protein only', () => {
    expect(calcMacroCalories(100, 0, 0)).toBe(400);
  });

  it('should handle carbs only', () => {
    expect(calcMacroCalories(0, 100, 0)).toBe(400);
  });

  it('should handle fat only', () => {
    expect(calcMacroCalories(0, 0, 100)).toBe(900);
  });

  it('should calculate a realistic diet plan', () => {
    // 160g protein, 220g carbs, 73g fat
    // 640 + 880 + 657 = 2177
    expect(calcMacroCalories(160, 220, 73)).toBe(2177);
  });
});

describe('calcOneRM (Epley formula)', () => {
  it('should return the weight for 0 reps', () => {
    // weight * (1 + 0/30) = weight
    expect(calcOneRM(100, 0)).toBe(100);
  });

  it('should estimate 1RM for 5 reps at 80kg', () => {
    // 80 * (1 + 5/30) = 80 * 1.1667 = 93.33 → 93
    expect(calcOneRM(80, 5)).toBe(93);
  });

  it('should estimate 1RM for 10 reps at 60kg', () => {
    // 60 * (1 + 10/30) = 60 * 1.3333 = 80
    expect(calcOneRM(60, 10)).toBe(80);
  });

  it('should handle decimal weights', () => {
    // 72.5 * (1 + 8/30) = 72.5 * 1.2667 = 91.83 → 92
    expect(calcOneRM(72.5, 8)).toBe(92);
  });

  it('should return 0 for 0 weight', () => {
    expect(calcOneRM(0, 10)).toBe(0);
  });

  it('should handle 1 rep (close to actual 1RM)', () => {
    // 100 * (1 + 1/30) = 103.33 → 103
    expect(calcOneRM(100, 1)).toBe(103);
  });
});

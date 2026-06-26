const { calculateScore } = require('../../../src/utils/scoring');

describe('calculateScore', () => {
  it('returns ceiling of remaining seconds', () => {
    const endTime = Date.now() + 11500;
    expect(calculateScore(endTime)).toBe(12);
  });

  it('returns 1 when time is exactly 0', () => {
    expect(calculateScore(Date.now())).toBe(1);
  });

  it('returns 1 when time has already passed', () => {
    expect(calculateScore(Date.now() - 5000)).toBe(1);
  });

  it('rounds up fractional seconds', () => {
    const endTime = Date.now() + 1100;
    expect(calculateScore(endTime)).toBe(2);
  });

  it('returns full timeLimit at question start', () => {
    const endTime = Date.now() + 20000;
    const score = calculateScore(endTime);
    expect(score).toBeGreaterThanOrEqual(19);
    expect(score).toBeLessThanOrEqual(20);
  });
});

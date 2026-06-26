const { generateGameCode } = require('../../../src/utils/gameCode');

describe('generateGameCode', () => {
  it('generates a 6-character string', () => {
    expect(generateGameCode()).toHaveLength(6);
  });

  it('only contains valid characters (no O, 0, I, 1)', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateGameCode();
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });

  it('avoids codes already in the existing set', () => {
    const existing = new Set();
    for (let i = 0; i < 50; i++) {
      const code = generateGameCode(existing);
      expect(existing.has(code)).toBe(false);
      existing.add(code);
    }
  });

  it('throws if unable to generate unique code after 1000 attempts', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const existing = new Set(['AAAAAA']);
    expect(() => generateGameCode(existing)).toThrow('Unable to generate unique game code');
    jest.spyOn(Math, 'random').mockRestore();
  });
});

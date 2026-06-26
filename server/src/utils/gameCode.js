const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateGameCode(existingCodes = new Set()) {
  let code;
  let attempts = 0;
  do {
    code = Array.from({ length: 6 }, () =>
      CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join('');
    attempts++;
    if (attempts > 1000) throw new Error('Unable to generate unique game code');
  } while (existingCodes.has(code));
  return code;
}

module.exports = { generateGameCode };

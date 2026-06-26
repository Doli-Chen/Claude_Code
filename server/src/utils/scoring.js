/**
 * Calculate score for a correct answer.
 * Score = ceiling of remaining seconds (min 1).
 * Uses server-authoritative questionEndTime to prevent client-side cheating.
 */
function calculateScore(questionEndTime) {
  const remaining = (questionEndTime - Date.now()) / 1000;
  if (remaining <= 0) return 1;
  return Math.ceil(remaining);
}

module.exports = { calculateScore };

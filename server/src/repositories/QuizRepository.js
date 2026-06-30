const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = process.env.QUIZ_DATA_DIR || path.join(__dirname, '../../data/quizzes');

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function findAll() {
  await ensureDir();
  const files = await fs.readdir(DATA_DIR);
  const results = await Promise.all(
    files
      .filter((f) => f.endsWith('.json'))
      .map(async (f) => {
        try {
          const raw = await fs.readFile(path.join(DATA_DIR, f), 'utf8');
          const quiz = JSON.parse(raw);
          return {
            id: quiz.id,
            title: quiz.title,
            questionCount: quiz.questions?.length ?? 0,
            updatedAt: quiz.updatedAt,
          };
        } catch {
          console.error(`[QuizRepository] 跳過損壞的檔案：${f}`);
          return null;
        }
      })
  );
  return results
    .filter(Boolean)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function findById(id) {
  await ensureDir();
  const filePath = path.join(DATA_DIR, `${id}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function save(quiz) {
  await ensureDir();
  const filePath = path.join(DATA_DIR, `${quiz.id}.json`);
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(quiz, null, 2), 'utf8');
  await fs.rename(tmpPath, filePath);
  return quiz;
}

async function remove(id) {
  const filePath = path.join(DATA_DIR, `${id}.json`);
  try {
    await fs.unlink(filePath);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

module.exports = { findAll, findById, save, remove };

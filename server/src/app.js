const express = require('express');
const cors = require('cors');
const path = require('path');
const { UPLOAD_DIR } = require('./middleware/upload');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

app.use('/api/quizzes', require('./routes/quiz'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/network', require('./routes/info'));

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message });
});

module.exports = app;

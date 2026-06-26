const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const initSocket = require('./socket');

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

initSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = server;

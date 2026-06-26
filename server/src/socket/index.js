const registerHostHandlers = require('./hostHandlers');
const registerPlayerHandlers = require('./playerHandlers');
const registerDisplayHandlers = require('./displayHandlers');

module.exports = function initSocket(io) {
  io.on('connection', (socket) => {
    registerHostHandlers(socket, io);
    registerPlayerHandlers(socket, io);
    registerDisplayHandlers(socket, io);
  });
};

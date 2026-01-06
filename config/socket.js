const { io } = require('socket.io-client');

const socket = io("ws://127.0.0.1:3000", {
  transports: ['websocket'],
  reconnection: true
});

socket.on('connect', () => {
  console.log('✅ MDC connected to MAPI socket');
});

socket.on('disconnect', () => {
  console.log('❌ MDC disconnected from MAPI');
});

module.exports = socket;

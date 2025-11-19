import { Server as IOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;

export function initIO(httpServer) {
  if (io) return io;
  io = new IOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // optional authentication middleware: attach userId if token provided
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      return next();
    } catch (err) {
      return next();
    }
  });

  io.on('connection', (socket) => {
    if (socket.userId) socket.join(`user:${socket.userId}`);
    socket.on('disconnect', () => {});
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

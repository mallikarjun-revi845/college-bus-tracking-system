import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import env from '../config/env.js';

export const socketHandler = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication token required.'));

    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

      if (!user || !user.isActive) {
        return next(new Error('User is not authorized.'));
      }

      socket.user = {
        id: user.id,
        role: user.role,
        name: user.name
      };
      next();
    } catch (error) {
      next(new Error('Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('student:trackBus', ({ busId }) => {
      socket.join(`bus:${busId}`);
    });

    socket.on('driver:locationUpdate', ({ busId, latitude, longitude }) => {
      if (!socket.user || socket.user.role !== 'driver') {
        socket.emit('server:trackingError', { message: 'Unauthorized location update.' });
        return;
      }

      io.to(`bus:${busId}`).emit('server:busLocationUpdated', {
        busId,
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

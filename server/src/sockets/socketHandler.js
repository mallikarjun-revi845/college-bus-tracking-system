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
    // Students join bus room to receive updates
    socket.on('student:trackBus', async ({ busId }) => {
      if (!busId) return socket.emit('server:trackingError', { message: 'busId required' });
      socket.join(`bus:${busId}`);
    });

    // Driver starts trip via REST API; socket receives location updates
    socket.on('driver:locationUpdate', async ({ tripId, busId, latitude, longitude, speedKmh, accuracy }) => {
      try {
        if (!socket.user || socket.user.role !== 'driver') {
          socket.emit('server:trackingError', { message: 'Unauthorized location update.' });
          return;
        }

        const isValidLat = Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
        const isValidLng = Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
        if (!isValidLat || !isValidLng) {
          socket.emit('server:trackingError', { message: 'Invalid coordinates received.' });
          return;
        }

        // Validate trip and driver
        const driver = await prisma.driver.findUnique({ where: { userId: socket.user.id } });
        if (!driver) {
          socket.emit('server:trackingError', { message: 'Driver profile not found.' });
          return;
        }

        const trip = tripId ? await prisma.trip.findUnique({ where: { id: tripId } }) : null;
        if (tripId && !trip) {
          socket.emit('server:trackingError', { message: 'Trip not found.' });
          return;
        }

        if (trip && trip.status !== 'in_progress') {
          socket.emit('server:trackingError', { message: 'Trip is not active.' });
          return;
        }

        // Ensure driver is assigned to trip or assignment
        if (trip && trip.driverId !== driver.id) {
          socket.emit('server:trackingError', { message: 'You are not assigned to this trip.' });
          return;
        }

        // Persist location
        const saved = await prisma.busLocation.create({ data: {
          tripId: tripId || null,
          busId,
          latitude,
          longitude,
          speedKmh: speedKmh || 0,
          accuracy: accuracy || 0,
          timestamp: new Date()
        }});

        // Update bus last location
        await prisma.bus.update({ where: { id: busId }, data: { lastLocationLat: latitude, lastLocationLng: longitude, lastLocationAt: new Date() } });

        // Broadcast to the bus room
        io.to(`bus:${busId}`).emit('server:busLocationUpdated', {
          busId,
          tripId,
          latitude,
          longitude,
          timestamp: saved.timestamp,
          speedKmh: saved.speedKmh,
          accuracy: saved.accuracy
        });
      } catch (error) {
        console.error('driver:locationUpdate error', error);
        socket.emit('server:trackingError', { message: 'Internal server error.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

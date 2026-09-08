import { PrismaClient } from '@prisma/client';
import { validateCoordinates } from '../utils/validation.js';
import { TRIP_STATUS, ROLES } from '../config/constants.js';
import locationSimulator from '../utils/locationSimulator.js';

const prisma = new PrismaClient();

const activeConnections = new Map(); // userId -> socket
const busSubscriptions = new Map(); // busId -> Set of socketIds
const driverSessions = new Map(); // driverId -> { tripId, busId, interval }

export const initializeSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // ========== AUTHENTICATION ==========
    socket.on('auth', async (data) => {
      try {
        const { token } = data;
        if (!token) {
          socket.emit('error', { message: 'No token provided' });
          socket.disconnect();
          return;
        }

        // Verify token (would normally use JWT verify)
        // For now, we store the connection
        socket.userId = data.userId || 'user-' + socket.id;
        socket.userRole = data.role || ROLES.STUDENT;
        socket.busId = data.busId; // For drivers

        activeConnections.set(socket.userId, socket);

        socket.emit('authenticated', {
          userId: socket.userId,
          role: socket.userRole,
          message: 'Connected to tracking system',
        });

        console.log(`User authenticated: ${socket.userId} (${socket.userRole})`);
      } catch (error) {
        console.error('Auth error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // ========== STUDENT SUBSCRIPTIONS ==========
    socket.on('subscribe:bus', (data) => {
      try {
        const { busId } = data;
        if (!busId) {
          socket.emit('error', { message: 'Bus ID required' });
          return;
        }

        socket.join(`bus:${busId}`);
        if (!busSubscriptions.has(busId)) {
          busSubscriptions.set(busId, new Set());
        }
        busSubscriptions.get(busId).add(socket.id);

        console.log(`Socket ${socket.id} subscribed to bus ${busId}`);

        socket.emit('subscribed:bus', {
          busId,
          message: `Subscribed to bus ${busId}`,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Subscribe error:', error);
        socket.emit('error', { message: 'Subscription failed' });
      }
    });

    socket.on('unsubscribe:bus', (data) => {
      try {
        const { busId } = data;
        socket.leave(`bus:${busId}`);
        if (busSubscriptions.has(busId)) {
          busSubscriptions.get(busId).delete(socket.id);
        }
        console.log(`Socket ${socket.id} unsubscribed from bus ${busId}`);
      } catch (error) {
        console.error('Unsubscribe error:', error);
      }
    });

    // ========== DRIVER LOCATION UPDATES ==========
    socket.on('driver:locationUpdate', async (data) => {
      try {
        const { tripId, busId, latitude, longitude, accuracy, altitude, speed, heading } = data;

        if (!tripId || !busId || latitude === undefined || longitude === undefined) {
          socket.emit('error', { message: 'Missing required location fields' });
          return;
        }

        if (!validateCoordinates(latitude, longitude)) {
          socket.emit('error', { message: 'Invalid coordinates' });
          return;
        }

        // Verify trip is active
        const trip = await prisma.trip.findUnique({
          where: { id: tripId },
          include: { driver: true },
        });

        if (!trip) {
          socket.emit('error', { message: 'Trip not found' });
          return;
        }

        if (trip.status !== TRIP_STATUS.IN_PROGRESS) {
          socket.emit('error', { message: 'Trip is not in progress' });
          return;
        }

        // Save location to database
        const location = await prisma.busLocation.create({
          data: {
            busId,
            tripId,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            accuracy: accuracy ? parseFloat(accuracy) : null,
            altitude: altitude ? parseFloat(altitude) : null,
            speed: speed ? parseFloat(speed) : null,
            heading: heading ? parseFloat(heading) : null,
            recordedAt: new Date(),
          },
        });

        // Broadcast to students watching this bus
        io.to(`bus:${busId}`).emit('server:busLocationUpdated', {
          busId,
          tripId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          speed: location.speed,
          heading: location.heading,
          timestamp: location.recordedAt,
          lastUpdate: new Date().toISOString(),
        });

        console.log(`Location update for bus ${busId}: (${latitude}, ${longitude})`);
      } catch (error) {
        console.error('Location update error:', error);
        socket.emit('error', { message: 'Failed to record location' });
      }
    });

    // ========== TRIP LIFECYCLE ==========
    socket.on('driver:tripStarted', async (data) => {
      try {
        const { tripId, busId, routeId } = data;

        if (!tripId || !busId) {
          socket.emit('error', { message: 'Trip ID and Bus ID required' });
          return;
        }

        // Update trip status (should be done via API first)
        const trip = await prisma.trip.findUnique({
          where: { id: tripId },
        });

        if (!trip) {
          socket.emit('error', { message: 'Trip not found' });
          return;
        }

        // Store driver session
        driverSessions.set(socket.userId, {
          tripId,
          busId,
          routeId,
          startedAt: new Date(),
        });

        // Broadcast to students
        io.to(`bus:${busId}`).emit('server:tripStarted', {
          tripId,
          busId,
          routeId,
          driverId: trip.driverId,
          startedAt: new Date().toISOString(),
          message: 'Trip has started',
        });

        console.log(`Trip ${tripId} started by driver ${socket.userId}`);
      } catch (error) {
        console.error('Trip start error:', error);
        socket.emit('error', { message: 'Failed to start trip' });
      }
    });

    socket.on('driver:tripStopped', async (data) => {
      try {
        const { tripId, busId } = data;

        if (!tripId || !busId) {
          socket.emit('error', { message: 'Trip ID and Bus ID required' });
          return;
        }

        // Clear driver session
        driverSessions.delete(socket.userId);

        // Broadcast to students
        io.to(`bus:${busId}`).emit('server:tripStopped', {
          tripId,
          busId,
          stoppedAt: new Date().toISOString(),
          message: 'Trip has ended',
        });

        console.log(`Trip ${tripId} stopped by driver ${socket.userId}`);
      } catch (error) {
        console.error('Trip stop error:', error);
        socket.emit('error', { message: 'Failed to stop trip' });
      }
    });

    socket.on('driver:arriveStop', async (data) => {
      try {
        const { tripId, stopId, busId } = data;

        if (!tripId || !stopId || !busId) {
          socket.emit('error', { message: 'Missing required fields' });
          return;
        }

        // Get stop details
        const stop = await prisma.busStop.findUnique({
          where: { id: stopId },
        });

        if (!stop) {
          socket.emit('error', { message: 'Stop not found' });
          return;
        }

        // Record event
        await prisma.tripEvent.create({
          data: {
            tripId,
            stopId,
            eventType: 'ARRIVED',
          },
        });

        // Broadcast to students
        io.to(`bus:${busId}`).emit('server:busArrivedStop', {
          tripId,
          busId,
          stopId,
          stopName: stop.name,
          latitude: stop.latitude,
          longitude: stop.longitude,
          timestamp: new Date().toISOString(),
          message: `Bus arrived at ${stop.name}`,
        });

        console.log(`Bus ${busId} arrived at stop ${stop.name}`);
      } catch (error) {
        console.error('Arrive stop error:', error);
        socket.emit('error', { message: 'Failed to record stop arrival' });
      }
    });

    // ========== REQUEST/RESPONSE ==========
    socket.on('request:busInfo', async (data) => {
      try {
        const { busId } = data;
        if (!busId) {
          socket.emit('error', { message: 'Bus ID required' });
          return;
        }

        const bus = await prisma.bus.findUnique({
          where: { id: busId },
          include: {
            assignedRoute: { include: { stops: true } },
            assignedDriver: { include: { user: true } },
          },
        });

        if (!bus) {
          socket.emit('error', { message: 'Bus not found' });
          return;
        }

        const lastLocation = await prisma.busLocation.findFirst({
          where: { busId },
          orderBy: { recordedAt: 'desc' },
          take: 1,
        });

        socket.emit('server:busInfo', {
          bus: {
            id: bus.id,
            busNumber: bus.busNumber,
            capacity: bus.capacity,
            status: bus.status,
            currentLocation: lastLocation
              ? {
                  latitude: lastLocation.latitude,
                  longitude: lastLocation.longitude,
                  timestamp: lastLocation.recordedAt,
                }
              : null,
            route: bus.assignedRoute,
            driver: bus.assignedDriver
              ? {
                  id: bus.assignedDriver.id,
                  name: bus.assignedDriver.user.name,
                  phone: bus.assignedDriver.user.phone,
                }
              : null,
          },
        });
      } catch (error) {
        console.error('Bus info request error:', error);
        socket.emit('error', { message: 'Failed to fetch bus info' });
      }
    });

    // ========== CONNECTION STATUS ==========
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // ========== DISCONNECTION ==========
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);

      if (socket.userId) {
        activeConnections.delete(socket.userId);
        driverSessions.delete(socket.userId);
      }

      // Remove from all bus subscriptions
      busSubscriptions.forEach((subscribers, busId) => {
        subscribers.delete(socket.id);
      });
    });

    // ========== ERROR HANDLING ==========
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  console.log('Socket.IO initialized');
};

// Utility: Broadcast location update (for testing)
export const broadcastLocationUpdate = (io, busId, location) => {
  io.to(`bus:${busId}`).emit('server:busLocationUpdated', {
    busId,
    ...location,
    timestamp: new Date().toISOString(),
  });
};

// Utility: Get active connections count
export const getActiveConnectionsCount = () => {
  return activeConnections.size;
};

// Utility: Get bus subscription count
export const getBusSubscriptionCount = (busId) => {
  return busSubscriptions.get(busId)?.size || 0;
};

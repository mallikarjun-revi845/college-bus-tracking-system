import express from 'express';
import { authenticate, authorize, requireAdmin, requireAdminOrDriver } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { PrismaClient } from '@prisma/client';
import { TRIP_STATUS, ROLES, TRIP_EVENT_TYPES } from '../config/constants.js';
import { validateCoordinates } from '../utils/validation.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/trips - List trips
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { status, busId, driverId, limit = 30, offset = 0 } = req.query;
    const where = {};

    if (status) where.status = status;
    if (busId) where.busId = busId;
    if (driverId) where.driverId = driverId;

    // Students can only see active trips
    if (req.user.role === ROLES.STUDENT && !where.status) {
      where.status = TRIP_STATUS.IN_PROGRESS;
    }

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        include: {
          bus: true,
          driver: { include: { user: true } },
          route: { include: { stops: true } },
          locations: { take: 20 },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.trip.count({ where }),
    ]);

    res.json({ trips, total });
  })
);

// GET /api/trips/:id - Get trip details
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        bus: true,
        driver: { include: { user: true } },
        route: { include: { stops: true } },
        locations: { orderBy: { recordedAt: 'desc' } },
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    if (!trip) {
      throw new AppError('Trip not found', 404, 'NOT_FOUND');
    }

    res.json({ trip });
  })
);

// POST /api/trips - Create trip (Admin only)
router.post(
  '/',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { busId, driverId, routeId, plannedStartTime } = req.body;

    if (!busId || !driverId || !routeId) {
      throw new AppError('Missing required fields', 400, 'VALIDATION_ERROR');
    }

    const trip = await prisma.trip.create({
      data: {
        busId,
        driverId,
        routeId,
        status: TRIP_STATUS.NOT_STARTED,
        plannedStartTime: plannedStartTime ? new Date(plannedStartTime) : null,
      },
      include: {
        bus: true,
        driver: { include: { user: true } },
        route: { include: { stops: true } },
      },
    });

    res.status(201).json({ trip });
  })
);

// POST /api/trips/:id/start - Start trip (Driver/Admin)
router.post(
  '/:id/start',
  authenticate,
  requireAdminOrDriver,
  asyncHandler(async (req, res) => {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        driver: true,
        bus: true,
        route: { include: { stops: true } },
      },
    });

    if (!trip) {
      throw new AppError('Trip not found', 404, 'NOT_FOUND');
    }

    // Check authorization - Driver can only start their own trip
    if (req.user.role === ROLES.DRIVER && req.user.sub !== trip.driver.userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    if (trip.status === TRIP_STATUS.IN_PROGRESS) {
      throw new AppError('Trip already in progress', 400, 'VALIDATION_ERROR');
    }

    const startedTrip = await prisma.trip.update({
      where: { id: req.params.id },
      data: {
        status: TRIP_STATUS.IN_PROGRESS,
        actualStartTime: new Date(),
      },
      include: {
        bus: true,
        driver: { include: { user: true } },
        route: { include: { stops: true } },
      },
    });

    res.json({ trip: startedTrip });
  })
);

// POST /api/trips/:id/stop - Stop trip (Driver/Admin)
router.post(
  '/:id/stop',
  authenticate,
  requireAdminOrDriver,
  asyncHandler(async (req, res) => {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: { driver: true },
    });

    if (!trip) {
      throw new AppError('Trip not found', 404, 'NOT_FOUND');
    }

    // Check authorization
    if (req.user.role === ROLES.DRIVER && req.user.sub !== trip.driver.userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    if (trip.status !== TRIP_STATUS.IN_PROGRESS) {
      throw new AppError('Trip is not in progress', 400, 'TRIP_NOT_ACTIVE');
    }

    const stoppedTrip = await prisma.trip.update({
      where: { id: req.params.id },
      data: {
        status: TRIP_STATUS.COMPLETED,
        actualEndTime: new Date(),
      },
      include: {
        bus: true,
        driver: { include: { user: true } },
        route: { include: { stops: true } },
        locations: { take: 100 },
      },
    });

    res.json({ trip: stoppedTrip });
  })
);

// GET /api/trips/:id/locations
router.get(
  '/:id/locations',
  authenticate,
  asyncHandler(async (req, res) => {
    const { limit = 100, offset = 0 } = req.query;

    const [locations, total] = await Promise.all([
      prisma.busLocation.findMany({
        where: { tripId: req.params.id },
        orderBy: { recordedAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.busLocation.count({ where: { tripId: req.params.id } }),
    ]);

    res.json({ locations, total });
  })
);

// GET /api/trips/:id/events
router.get(
  '/:id/events',
  authenticate,
  asyncHandler(async (req, res) => {
    const events = await prisma.tripEvent.findMany({
      where: { tripId: req.params.id },
      orderBy: { timestamp: 'desc' },
    });

    res.json({ events });
  })
);

export default router;

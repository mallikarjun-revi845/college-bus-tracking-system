import express from 'express';
import { authenticate, authorize, requireAdmin, requireAdminOrDriver } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { PrismaClient } from '@prisma/client';
import { ROLES, BUS_STATUS } from '../config/constants.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/buses - Get all buses
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, active, limit = 30, offset = 0 } = req.query;
    const where = {};

    if (status) where.status = status;
    if (active !== undefined) where.active = active === 'true';

    const [buses, total] = await Promise.all([
      prisma.bus.findMany({
        where,
        include: {
          assignedDriver: { include: { user: true } },
          assignedRoute: { include: { stops: true } },
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bus.count({ where }),
    ]);

    res.json({ buses, total, limit: parseInt(limit), offset: parseInt(offset) });
  })
);

// GET /api/buses/:id - Get bus by ID
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const bus = await prisma.bus.findUnique({
      where: { id: req.params.id },
      include: {
        assignedDriver: { include: { user: true } },
        assignedRoute: { include: { stops: true } },
      },
    });

    if (!bus) {
      throw new AppError('Bus not found', 404, 'NOT_FOUND');
    }

    res.json({ bus });
  })
);

// POST /api/buses - Create bus (Admin only)
router.post(
  '/',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { busNumber, registrationNumber, capacity } = req.body;

    if (!busNumber || !registrationNumber || !capacity) {
      throw new AppError('Missing required fields', 400, 'VALIDATION_ERROR');
    }

    const bus = await prisma.bus.create({
      data: {
        busNumber,
        registrationNumber,
        capacity: parseInt(capacity),
        status: BUS_STATUS.ACTIVE,
      },
    });

    res.status(201).json({ bus });
  })
);

// PUT /api/buses/:id - Update bus (Admin only)
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { busNumber, registrationNumber, capacity, status, active } = req.body;

    const updateData = {};
    if (busNumber) updateData.busNumber = busNumber;
    if (registrationNumber) updateData.registrationNumber = registrationNumber;
    if (capacity) updateData.capacity = parseInt(capacity);
    if (status) updateData.status = status;
    if (active !== undefined) updateData.active = active;

    const bus = await prisma.bus.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        assignedDriver: { include: { user: true } },
        assignedRoute: { include: { stops: true } },
      },
    });

    res.json({ bus });
  })
);

// DELETE /api/buses/:id - Delete bus (Admin only)
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.bus.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);

// GET /api/buses/:id/location - Get bus current location
router.get(
  '/:id/location',
  asyncHandler(async (req, res) => {
    const location = await prisma.busLocation.findFirst({
      where: { busId: req.params.id },
      orderBy: { recordedAt: 'desc' },
      take: 1,
    });

    if (!location) {
      return res.json({
        message: 'No location data available',
        location: null,
      });
    }

    res.json({
      location: {
        busId: location.busId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        speed: location.speed,
        heading: location.heading,
        timestamp: location.recordedAt,
      },
    });
  })
);

// GET /api/buses/:id/trips - Get bus trips
router.get(
  '/:id/trips',
  asyncHandler(async (req, res) => {
    const { status, limit = 30, offset = 0 } = req.query;
    const where = { busId: req.params.id };
    if (status) where.status = status;

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        include: {
          driver: { include: { user: true } },
          route: { include: { stops: true } },
          locations: { take: 100 },
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

export default router;

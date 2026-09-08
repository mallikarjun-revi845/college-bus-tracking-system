import express from 'express';
import { authenticate, authorize, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { PrismaClient } from '@prisma/client';
import { ROLES, DRIVER_STATUS } from '../config/constants.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/drivers - List drivers (Admin only)
router.get(
  '/',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status, limit = 30, offset = 0 } = req.query;
    const where = {};
    if (status) where.status = status;

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        include: {
          user: true,
          assignedBus: true,
          trips: { take: 5, orderBy: { createdAt: 'desc' } },
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.driver.count({ where }),
    ]);

    res.json({ drivers, total });
  })
);

// GET /api/drivers/:id - Get driver by ID
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        assignedBus: { include: { assignedRoute: { include: { stops: true } } } },
        trips: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!driver) {
      throw new AppError('Driver not found', 404, 'NOT_FOUND');
    }

    // Check authorization
    if (req.user.role !== ROLES.ADMIN && req.user.sub !== driver.userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    res.json({ driver });
  })
);

// POST /api/drivers - Create driver (Admin only)
router.post(
  '/',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { userId, licenseNumber, licenseExpiry } = req.body;

    if (!userId || !licenseNumber) {
      throw new AppError('Missing required fields', 400, 'VALIDATION_ERROR');
    }

    // Check if user exists and is not already a driver
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    const existingDriver = await prisma.driver.findUnique({
      where: { userId },
    });
    if (existingDriver) {
      throw new AppError('User is already a driver', 409, 'DUPLICATE_ENTRY');
    }

    const driver = await prisma.driver.create({
      data: {
        userId,
        licenseNumber,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        status: DRIVER_STATUS.ACTIVE,
      },
      include: {
        user: true,
      },
    });

    res.status(201).json({ driver });
  })
);

// PUT /api/drivers/:id - Update driver
router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
    });

    if (!driver) {
      throw new AppError('Driver not found', 404, 'NOT_FOUND');
    }

    // Check authorization
    if (req.user.role !== ROLES.ADMIN && req.user.sub !== driver.userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    const { status, licenseExpiry } = req.body;
    const updateData = {};
    if (status && Object.values(DRIVER_STATUS).includes(status)) updateData.status = status;
    if (licenseExpiry) updateData.licenseExpiry = new Date(licenseExpiry);

    const updatedDriver = await prisma.driver.update({
      where: { id: req.params.id },
      data: updateData,
      include: { user: true, assignedBus: true },
    });

    res.json({ driver: updatedDriver });
  })
);

// DELETE /api/drivers/:id (Admin only)
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.driver.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);

// GET /api/drivers/:id/trips
router.get(
  '/:id/trips',
  authenticate,
  asyncHandler(async (req, res) => {
    const { status, limit = 30, offset = 0 } = req.query;

    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
    });

    if (!driver) {
      throw new AppError('Driver not found', 404, 'NOT_FOUND');
    }

    if (req.user.role !== ROLES.ADMIN && req.user.sub !== driver.userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    const where = { driverId: req.params.id };
    if (status) where.status = status;

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        include: {
          bus: true,
          route: { include: { stops: true } },
          locations: { take: 50 },
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

// POST /api/drivers/:id/assign-bus - Assign bus to driver (Admin only)
router.post(
  '/:id/assign-bus',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { busId } = req.body;

    if (!busId) {
      throw new AppError('Bus ID required', 400, 'VALIDATION_ERROR');
    }

    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
    });

    if (!driver) {
      throw new AppError('Driver not found', 404, 'NOT_FOUND');
    }

    const bus = await prisma.bus.findUnique({
      where: { id: busId },
    });

    if (!bus) {
      throw new AppError('Bus not found', 404, 'NOT_FOUND');
    }

    // Unassign previous driver if any
    await prisma.bus.updateMany({
      where: { assignedDriverId: driver.id },
      data: { assignedDriverId: null },
    });

    // Assign new bus
    const updatedBus = await prisma.bus.update({
      where: { id: busId },
      data: { assignedDriverId: driver.id },
    });

    res.json({ bus: updatedBus });
  })
);

export default router;

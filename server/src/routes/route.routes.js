import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/routes
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { active, limit = 30, offset = 0 } = req.query;
    const where = {};
    if (active !== undefined) where.active = active === 'true';

    const [routes, total] = await Promise.all([
      prisma.route.findMany({
        where,
        include: {
          stops: {
            include: { busStop: true },
            orderBy: { stopOrder: 'asc' },
          },
          buses: true,
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.route.count({ where }),
    ]);

    res.json({ routes, total });
  })
);

// GET /api/routes/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const route = await prisma.route.findUnique({
      where: { id: req.params.id },
      include: {
        stops: {
          include: { busStop: true },
          orderBy: { stopOrder: 'asc' },
        },
        buses: true,
      },
    });

    if (!route) {
      throw new AppError('Route not found', 404, 'NOT_FOUND');
    }

    res.json({ route });
  })
);

// POST /api/routes - Create route (Admin)
router.post(
  '/',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, description, stops } = req.body;

    if (!name) {
      throw new AppError('Route name is required', 400, 'VALIDATION_ERROR');
    }

    const route = await prisma.route.create({
      data: {
        name,
        description,
      },
      include: {
        stops: {
          include: { busStop: true },
          orderBy: { stopOrder: 'asc' },
        },
      },
    });

    // Add stops if provided
    if (stops && Array.isArray(stops)) {
      for (const stop of stops) {
        await prisma.routeStop.create({
          data: {
            routeId: route.id,
            busStopId: stop.stopId,
            stopOrder: stop.stopOrder,
            estimatedMinutes: stop.estimatedMinutes,
            estimatedDistance: stop.estimatedDistance,
          },
        });
      }
    }

    res.status(201).json({ route });
  })
);

// PUT /api/routes/:id - Update route (Admin)
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, description, active } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (active !== undefined) updateData.active = active;

    const route = await prisma.route.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        stops: {
          include: { busStop: true },
          orderBy: { stopOrder: 'asc' },
        },
      },
    });

    res.json({ route });
  })
);

// DELETE /api/routes/:id (Admin)
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.route.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);

// GET /api/routes/:id/stops
router.get(
  '/:id/stops',
  asyncHandler(async (req, res) => {
    const stops = await prisma.routeStop.findMany({
      where: { routeId: req.params.id },
      include: { busStop: true },
      orderBy: { stopOrder: 'asc' },
    });

    res.json({ stops });
  })
);

// POST /api/routes/:id/stops - Add stop to route (Admin)
router.post(
  '/:id/stops',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { busStopId, stopOrder, estimatedMinutes, estimatedDistance } = req.body;

    if (!busStopId || stopOrder === undefined) {
      throw new AppError('Missing required fields', 400, 'VALIDATION_ERROR');
    }

    const routeStop = await prisma.routeStop.create({
      data: {
        routeId: req.params.id,
        busStopId,
        stopOrder: parseInt(stopOrder),
        estimatedMinutes,
        estimatedDistance,
      },
      include: { busStop: true },
    });

    res.status(201).json({ routeStop });
  })
);

// DELETE /api/routes/:id/stops/:stopId (Admin)
router.delete(
  '/:id/stops/:stopId',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.routeStop.delete({
      where: {
        id: req.params.stopId,
      },
    });
    res.json({ success: true });
  })
);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { requireRole } from '../middleware/auth.middleware.js';

const router = Router();

const tripSchema = z.object({
  busId: z.string().min(1),
  routeId: z.string().optional(),
  driverId: z.string().optional(),
  startLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional(),
  endLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled')
});

router.get('/', async (req, res, next) => {
  try {
    const trips = await prisma.trip.findMany({
      include: { bus: true, route: true, driver: true },
      orderBy: { startTime: 'desc' }
    });

    res.json({ success: true, data: trips });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: { bus: true, route: true, driver: true }
    });

    if (!trip) return res.status(404).json({ message: 'Trip not found.' });
    res.json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('admin', 'driver'), async (req, res, next) => {
  try {
    const payload = tripSchema.parse(req.body);
    const trip = await prisma.trip.create({
      data: {
        busId: payload.busId,
        routeId: payload.routeId || null,
        driverId: payload.driverId || null,
        startTime: new Date(),
        status: 'scheduled'
      }
    });

    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/start', requireRole('driver', 'admin'), async (req, res, next) => {
  try {
    const trip = await prisma.trip.update({
      where: { id: req.params.id },
      data: {
        status: 'in_progress',
        startTime: new Date()
      }
    });

    res.json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/stop', requireRole('driver', 'admin'), async (req, res, next) => {
  try {
    const trip = await prisma.trip.update({
      where: { id: req.params.id },
      data: {
        status: 'completed',
        endTime: new Date()
      }
    });

    res.json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
});

export default router;

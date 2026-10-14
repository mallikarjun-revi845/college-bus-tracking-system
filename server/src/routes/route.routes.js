import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { requireRole } from '../middleware/auth.middleware.js';

const router = Router();

const routeSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  startLocation: z.string().min(2),
  endLocation: z.string().min(2),
  distanceKm: z.number().min(0).optional(),
  durationMinutes: z.number().min(1).optional(),
  active: z.boolean().default(true),
  stops: z.array(z.object({
    name: z.string().min(2),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional()
  })).default([])
});

router.get('/', async (req, res, next) => {
  try {
    const routes = await prisma.route.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: routes });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const payload = routeSchema.parse(req.body);
    const route = await prisma.route.create({
      data: {
        ...payload,
        stops: { create: payload.stops }
      }
    });

    res.status(201).json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const route = await prisma.route.findUnique({
      where: { id: req.params.id },
      include: { stops: true }
    });

    if (!route) return res.status(404).json({ message: 'Route not found.' });
    res.json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
});

export default router;

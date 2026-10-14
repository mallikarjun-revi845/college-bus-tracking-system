import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { requireRole } from '../middleware/auth.middleware.js';

const router = Router();

const busSchema = z.object({
  registrationNumber: z.string().min(2),
  name: z.string().min(2),
  capacity: z.number().int().min(1),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  routeId: z.string().optional(),
  driverId: z.string().optional(),
  description: z.string().optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const buses = await prisma.bus.findMany({ include: { driver: { include: { user: true } }, route: true }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: buses });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const bus = await prisma.bus.findUnique({ where: { id: req.params.id }, include: { driver: { include: { user: true } }, route: true } });
    if (!bus) return res.status(404).json({ message: 'Bus not found.' });
    res.json({ success: true, data: bus });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/location', async (req, res, next) => {
  try {
    const bus = await prisma.bus.findUnique({ where: { id: req.params.id } });
    if (!bus) return res.status(404).json({ message: 'Bus not found.' });
    res.json({ success: true, data: { latitude: bus.lastLocationLat || null, longitude: bus.lastLocationLng || null, timestamp: bus.lastLocationAt || null } });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/trips', async (req, res, next) => {
  try {
    const trips = await prisma.trip.findMany({ where: { busId: req.params.id }, orderBy: { startTime: 'desc' } });
    res.json({ success: true, data: trips });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const payload = busSchema.parse(req.body);
    const existing = await prisma.bus.findUnique({ where: { registrationNumber: payload.registrationNumber } });
    if (existing) return res.status(400).json({ message: 'A bus with that registration number already exists.' });

    const bus = await prisma.bus.create({ data: { registrationNumber: payload.registrationNumber, name: payload.name, capacity: payload.capacity, status: payload.status, routeId: payload.routeId || null, driverId: payload.driverId || null, description: payload.description || '' } });
    res.status(201).json({ success: true, data: bus });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const payload = busSchema.partial().parse(req.body);
    const bus = await prisma.bus.update({ where: { id: req.params.id }, data: payload });
    res.json({ success: true, data: bus });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const bus = await prisma.bus.update({ where: { id: req.params.id }, data: { status: 'inactive' } });
    res.json({ success: true, data: bus });
  } catch (error) {
    next(error);
  }
});

export default router;

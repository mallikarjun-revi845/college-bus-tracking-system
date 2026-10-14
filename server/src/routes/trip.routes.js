import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { requireRole } from '../middleware/auth.middleware.js';

const router = Router();

const tripSchema = z.object({
  busId: z.string().min(1),
  routeId: z.string().optional(),
  driverId: z.string().optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const trips = await prisma.trip.findMany({ include: { bus: true, route: true, driver: { include: { user: true } } }, orderBy: { startTime: 'desc' } });
    res.json({ success: true, data: trips });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id }, include: { bus: true, route: true, driver: { include: { user: true } }, locations: true } });
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });
    res.json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('admin', 'driver'), async (req, res, next) => {
  try {
    const payload = tripSchema.parse(req.body);

    // Ensure bus exists
    const bus = await prisma.bus.findUnique({ where: { id: payload.busId } });
    if (!bus) return res.status(404).json({ message: 'Bus not found.' });

    // When driver creates a trip, ensure they are the assigned driver
    if (req.user.role === 'driver') {
      const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });
      if (!driver) return res.status(403).json({ message: 'Driver profile not found.' });
      // Assign driverId from authenticated user
      payload.driverId = driver.id;
    }

    const trip = await prisma.trip.create({ data: { busId: payload.busId, routeId: payload.routeId || null, driverId: payload.driverId || null, status: 'scheduled' } });
    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/start', requireRole('driver', 'admin'), async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id }, include: { bus: true, driver: true } });
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });

    if (trip.status === 'in_progress') return res.status(400).json({ message: 'Trip is already in progress.' });
    if (trip.status === 'completed') return res.status(400).json({ message: 'Trip is already completed.' });

    // Validate driver authorization
    if (req.user.role === 'driver') {
      const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });
      if (!driver || trip.driverId !== driver.id) return res.status(403).json({ message: 'You are not assigned to this trip.' });
    }

    // Prevent conflicting active trips for the bus
    const activeForBus = await prisma.trip.findFirst({ where: { busId: trip.busId, status: 'in_progress' } });
    if (activeForBus) return res.status(409).json({ message: 'This bus already has an active trip.' });

    const updated = await prisma.trip.update({ where: { id: trip.id }, data: { status: 'in_progress', startTime: new Date() } });

    // Emit socket event if io is available
    try {
      const io = req.app.get('io');
      if (io) io.to(`bus:${trip.busId}`).emit('server:tripStarted', { tripId: updated.id, busId: trip.busId, status: updated.status });
    } catch (e) {
      // log and continue
      console.error('Socket emit error', e.message);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/stop', requireRole('driver', 'admin'), async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id }, include: { bus: true, driver: true } });
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });

    if (trip.status !== 'in_progress') return res.status(400).json({ message: 'Trip is not in progress.' });

    if (req.user.role === 'driver') {
      const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });
      if (!driver || trip.driverId !== driver.id) return res.status(403).json({ message: 'You are not assigned to this trip.' });
    }

    const updated = await prisma.trip.update({ where: { id: trip.id }, data: { status: 'completed', endTime: new Date() } });

    // Emit socket event
    try {
      const io = req.app.get('io');
      if (io) io.to(`bus:${trip.busId}`).emit('server:tripStopped', { tripId: updated.id, busId: trip.busId, status: updated.status });
    } catch (e) {
      console.error('Socket emit error', e.message);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

export default router;

import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { PrismaClient } from '@prisma/client';
import { validateCoordinates } from '../utils/validation.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/stops
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit = 30, offset = 0 } = req.query;

    const [stops, total] = await Promise.all([
      prisma.busStop.findMany({
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { name: 'asc' },
      }),
      prisma.busStop.count(),
    ]);

    res.json({ stops, total });
  })
);

// GET /api/stops/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const stop = await prisma.busStop.findUnique({
      where: { id: req.params.id },
    });

    if (!stop) {
      throw new AppError('Stop not found', 404, 'NOT_FOUND');
    }

    res.json({ stop });
  })
);

// POST /api/stops - Create stop (Admin)
router.post(
  '/',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, latitude, longitude, address, city, zipcode } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      throw new AppError('Missing required fields', 400, 'VALIDATION_ERROR');
    }

    if (!validateCoordinates(latitude, longitude)) {
      throw new AppError('Invalid coordinates', 400, 'VALIDATION_ERROR');
    }

    const stop = await prisma.busStop.create({
      data: {
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address,
        city,
        zipcode,
      },
    });

    res.status(201).json({ stop });
  })
);

// PUT /api/stops/:id - Update stop (Admin)
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, latitude, longitude, address, city, zipcode } = req.body;

    if (latitude !== undefined && longitude !== undefined) {
      if (!validateCoordinates(latitude, longitude)) {
        throw new AppError('Invalid coordinates', 400, 'VALIDATION_ERROR');
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (zipcode) updateData.zipcode = zipcode;

    const stop = await prisma.busStop.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({ stop });
  })
);

// DELETE /api/stops/:id (Admin)
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.busStop.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);

// GET /api/stops/nearby - Find nearby stops
router.get(
  '/nearby',
  asyncHandler(async (req, res) => {
    const { latitude, longitude, radiusKm = 5 } = req.query;

    if (!latitude || !longitude) {
      throw new AppError('Latitude and longitude required', 400, 'VALIDATION_ERROR');
    }

    if (!validateCoordinates(latitude, longitude)) {
      throw new AppError('Invalid coordinates', 400, 'VALIDATION_ERROR');
    }

    // Get all stops and filter in memory (for small datasets)
    // In production, use PostGIS extension
    const allStops = await prisma.busStop.findMany();

    const nearbyStops = allStops
      .filter((stop) => {
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          stop.latitude,
          stop.longitude
        );
        return distance <= parseFloat(radiusKm);
      })
      .map((stop) => ({
        ...stop,
        distance: calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          stop.latitude,
          stop.longitude
        ),
      }))
      .sort((a, b) => a.distance - b.distance);

    res.json({ stops: nearbyStops });
  })
);

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default router;

import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { PrismaClient } from '@prisma/client';
import { TRIP_STATUS } from '../config/constants.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/stats - System statistics (Admin only)
router.get(
  '/',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const [totalBuses, activeBuses, totalDrivers, activeDrivers, totalStudents, activeTrips, completedTripsToday] = await Promise.all([
      prisma.bus.count(),
      prisma.bus.count({ where: { active: true } }),
      prisma.driver.count(),
      prisma.driver.count({ where: { status: 'ACTIVE' } }),
      prisma.student.count(),
      prisma.trip.count({ where: { status: TRIP_STATUS.IN_PROGRESS } }),
      prisma.trip.count({
        where: {
          status: TRIP_STATUS.COMPLETED,
          actualEndTime: {
            gte: new Date(new Date().toDateString()),
          },
        },
      }),
    ]);

    res.json({
      totalBuses,
      activeBuses,
      totalDrivers,
      activeDrivers,
      totalStudents,
      activeTrips,
      completedTripsToday,
    });
  })
);

// GET /api/stats/trips - Trip statistics
router.get(
  '/trips',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const where = {};

    if (startDate) {
      where.actualStartTime = {
        ...where.actualStartTime,
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      where.actualStartTime = {
        ...where.actualStartTime,
        lte: new Date(endDate),
      };
    }

    const trips = await prisma.trip.findMany({
      where,
      include: { locations: true },
    });

    const totalTrips = trips.length;
    const completedTrips = trips.filter((t) => t.status === TRIP_STATUS.COMPLETED).length;
    const totalDistance = trips.reduce((sum, trip) => {
      if (trip.locations.length < 2) return sum;
      let distance = 0;
      for (let i = 1; i < trip.locations.length; i++) {
        distance += calculateDistance(
          trip.locations[i - 1].latitude,
          trip.locations[i - 1].longitude,
          trip.locations[i].latitude,
          trip.locations[i].longitude
        );
      }
      return sum + distance;
    }, 0);

    const avgTripDuration = trips
      .filter((t) => t.actualStartTime && t.actualEndTime)
      .reduce((sum, t) => sum + (t.actualEndTime - t.actualStartTime), 0) / Math.max(completedTrips, 1) / 1000 / 60; // minutes

    res.json({
      totalTrips,
      completedTrips,
      totalDistance: totalDistance.toFixed(2),
      avgTripDuration: avgTripDuration.toFixed(2),
    });
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

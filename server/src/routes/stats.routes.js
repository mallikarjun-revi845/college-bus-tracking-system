import { Router } from 'express';
import prisma from '../config/db.js';
import { requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/summary', requireRole('admin'), async (req, res, next) => {
  try {
    const [totalBuses, activeBuses, totalDrivers, totalStudents] = await Promise.all([
      prisma.bus.count(),
      prisma.bus.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { role: 'driver' } }),
      prisma.user.count({ where: { role: 'student' } })
    ]);

    res.json({
      success: true,
      data: {
        totalBuses,
        activeBuses,
        totalDrivers,
        totalStudents
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

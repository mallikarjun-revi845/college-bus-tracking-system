import express from 'express';
import { authenticate, authorize, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { validateEmail, validatePassword } from '../utils/validation.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/auth/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password, name, role } = req.body;

    // Validation
    if (!email || !validateEmail(email)) {
      throw new AppError('Invalid email', 400, 'VALIDATION_ERROR');
    }
    if (!password || !validatePassword(password)) {
      throw new AppError('Password must be at least 6 characters', 400, 'VALIDATION_ERROR');
    }
    if (!name) {
      throw new AppError('Name is required', 400, 'VALIDATION_ERROR');
    }

    const userRole = role && Object.values(ROLES).includes(role) ? role : ROLES.STUDENT;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('User already exists', 409, 'DUPLICATE_ENTRY');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: userRole,
      },
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password required', 400, 'VALIDATION_ERROR');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  })
);

// GET /api/auth/me
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      include: {
        driver: true,
        student: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        driver: user.driver,
        student: user.student,
      },
    });
  })
);

// POST /api/auth/logout
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    // JWT is stateless, client should discard token
    res.json({ success: true, message: 'Logged out' });
  })
);

export default router;

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/db.js';
import env from '../config/env.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'driver', 'student']).default('student'),
  phone: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const signToken = (user) =>
  jwt.sign({ userId: user.id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

router.post('/register', async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await prisma.user.create({
      data: {
        ...payload,
        email: payload.email.toLowerCase(),
        password: passwordHash,
        phone: payload.phone || ''
      }
    });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isValid = await bcrypt.compare(payload.password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'This account has been deactivated.' });
    }

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication token is required.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

export default router;

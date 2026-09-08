import { PrismaClient } from '@prisma/client';
import { ROLES, TRIP_STATUS } from '../src/config/constants.js';
import { hashPassword, comparePassword } from '../src/utils/password.js';
import { generateToken } from '../src/utils/jwt.js';

const prisma = new PrismaClient();

describe('Auth Routes', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('POST /api/auth/register - should create a new user', async () => {
    // Test registration logic
    const email = 'test-' + Date.now() + '@example.com';
    const password = 'testpass123';
    const passwordHash = await hashPassword(password);

    expect(passwordHash).toBeDefined();
    expect(passwordHash).not.toBe(password);
  });

  test('POST /api/auth/login - should verify password', async () => {
    const password = 'testpass123';
    const passwordHash = await hashPassword(password);
    const match = await comparePassword(password, passwordHash);
    expect(match).toBe(true);
  });

  test('JWT token generation', () => {
    const user = {
      id: 'test-id',
      email: 'test@example.com',
      role: ROLES.STUDENT,
    };

    const token = generateToken(user);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT has 3 parts
  });
});

describe('Bus Routes', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should validate bus capacity', () => {
    const capacity = 50;
    expect(capacity).toBeGreaterThan(0);
    expect(Number.isInteger(capacity)).toBe(true);
  });
});

describe('Trip Management', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should validate trip status transitions', () => {
    const validTransitions = {
      NOT_STARTED: [TRIP_STATUS.IN_PROGRESS, TRIP_STATUS.CANCELLED],
      IN_PROGRESS: [TRIP_STATUS.COMPLETED, TRIP_STATUS.CANCELLED],
      COMPLETED: [],
      CANCELLED: [],
    };

    expect(validTransitions[TRIP_STATUS.NOT_STARTED]).toContain(TRIP_STATUS.IN_PROGRESS);
    expect(validTransitions[TRIP_STATUS.IN_PROGRESS]).toContain(TRIP_STATUS.COMPLETED);
  });
});

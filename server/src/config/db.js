import { PrismaClient } from '@prisma/client';
import env from './env.js';

const prisma = new PrismaClient({
  datasources: { db: { url: env.databaseUrl } }
});

export default prisma;

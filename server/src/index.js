import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Routes
import authRoutes from './routes/auth.routes.js';
import busRoutes from './routes/bus.routes.js';
import routeRoutes from './routes/route.routes.js';
import stopRoutes from './routes/stop.routes.js';
import driverRoutes from './routes/driver.routes.js';
import tripRoutes from './routes/trip.routes.js';
import statsRoutes from './routes/stats.routes.js';

// Socket.IO handlers
import { initializeSocketIO } from './sockets/socketHandler.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ========== SECURITY MIDDLEWARE ==========
app.use(helmet());
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// ========== BODY PARSING ==========
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// ========== LOGGING MIDDLEWARE ==========
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ========== ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
});

// ========== ERROR HANDLING ==========
app.use(errorHandler);

// ========== SOCKET.IO SETUP ==========
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

// Initialize Socket.IO
initializeSocketIO(io);

// ========== SERVER STARTUP ==========
httpServer.listen(PORT, () => {
  console.log(`
┌${'='.repeat(50)}┐`);
  console.log(`│ College Bus Tracking System - Backend        │`);
  console.log(`│ Server running on port ${PORT}${' '.repeat(24 - String(PORT).length)}│`);
  console.log(`│ Socket.IO: ${CLIENT_URL}${' '.repeat(31 - CLIENT_URL.length)}│`);
  console.log(`│ Environment: ${process.env.NODE_ENV || 'development'}${' '.repeat(27 - (process.env.NODE_ENV || 'development').length)}│`);
  console.log(`│ Database: PostgreSQL                       │`);
  console.log(`└${'='.repeat(50)}┘
`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export { app, httpServer, io };

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import env from './config/env.js';
import prisma from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import busRoutes from './routes/bus.routes.js';
import routeRoutes from './routes/route.routes.js';
import tripRoutes from './routes/trip.routes.js';
import statsRoutes from './routes/stats.routes.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { socketHandler } from './sockets/socketHandler.js';

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [env.clientUrl, 'http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);

app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'healthy', timestamp: new Date().toISOString(), environment: env.nodeEnv });
});

app.use('/api/auth', authRoutes);
app.use('/api/buses', authMiddleware, busRoutes);
app.use('/api/routes', authMiddleware, routeRoutes);
app.use('/api/trips', authMiddleware, tripRoutes);
app.use('/api/stats', authMiddleware, statsRoutes);

app.use(notFound);
app.use(errorHandler);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// expose io to route handlers
app.set('io', io);

socketHandler(io);

const startServer = async () => {
  try {
    await prisma.$connect();
    httpServer.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

export { app, httpServer, io, startServer };

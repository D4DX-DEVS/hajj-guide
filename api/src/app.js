import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import pinoHttp from 'pino-http';
import mongoose from 'mongoose';
import env from './config/env.js';
import logger from './utils/logger.js';
import { firebaseReady } from './config/firebase.js';
import { storageReady } from './config/storage.js';
import { publicLimiter } from './middleware/rateLimit.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import publicRouter from './routes/public/index.js';
import userRouter from './routes/user/index.js';
import adminRouter from './routes/admin/index.js';

export function createApp() {
  const app = express();

  // Behind DO App Platform / any proxy — needed for correct client IPs in rate limits.
  app.set('trust proxy', 1);
  app.set('etag', 'strong');
  app.disable('x-powered-by');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
      exposedHeaders: ['ETag'],
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

  app.get('/health', (_req, res) => {
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({
      success: dbUp,
      data: {
        status: dbUp ? 'ok' : 'degraded',
        db: dbUp ? 'connected' : 'disconnected',
        firebase: firebaseReady() ? 'configured' : 'disabled',
        storage: storageReady() ? 'configured' : 'disabled',
        uptimeSeconds: Math.round(process.uptime()),
        version: process.env.npm_package_version || '1.0.0',
      },
    });
  });

  // `/me` is mounted first so user traffic is not counted against the public limiter.
  app.use('/api/v1/me', userRouter);
  app.use('/api/v1', publicLimiter, publicRouter);
  app.use('/api/admin', adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;

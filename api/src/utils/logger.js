import pino from 'pino';
import env from '../config/env.js';

const logger = pino({
  level: env.isProd ? 'info' : 'debug',
  transport: env.isProd
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', '*.password', '*.passwordHash'],
    remove: true,
  },
});

export default logger;

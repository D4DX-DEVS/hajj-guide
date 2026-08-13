import mongoose from 'mongoose';
import { ZodError } from 'zod';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

/* eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity */
export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err instanceof ZodError) {
    status = 400;
    message = 'Validation failed';
    details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for '${err.path}'`;
  } else if (err.code === 11000) {
    status = 409;
    message = `Duplicate value for ${Object.keys(err.keyPattern || {}).join(', ') || 'unique field'}`;
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Payload too large';
  }

  if (status >= 500) {
    logger.error({ err, url: req.originalUrl, method: req.method }, 'unhandled error');
  } else {
    logger.debug({ status, message, url: req.originalUrl }, 'request rejected');
  }

  const body = { success: false, error: { message, status } };
  if (details) body.error.details = details;
  if (!env.isProd && status >= 500) body.error.stack = err.stack;

  res.status(status).json(body);
}

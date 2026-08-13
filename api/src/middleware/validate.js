import { ZodError } from 'zod';
import ApiError from '../utils/ApiError.js';

function format(error) {
  return error.issues.map((i) => ({ path: i.path.join('.') || '(root)', message: i.message }));
}

/**
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body'|'query'|'params'} source
 */
export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      // req.query is a getter on newer Express versions — assign to a side channel.
      if (source === 'query') req.validatedQuery = parsed;
      else req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) return next(ApiError.badRequest('Validation failed', format(err)));
      return next(err);
    }
  };

export default validate;

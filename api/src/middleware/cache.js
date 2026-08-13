/**
 * Public content is cacheable. Express generates the ETag and answers
 * `If-None-Match` with a 304 by itself; this only sets the freshness policy.
 */
export const publicCache =
  (seconds = 300) =>
  (_req, res, next) => {
    res.set('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=86400`);
    next();
  };

/** User data must never be cached by proxies. */
export const noCache = (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};

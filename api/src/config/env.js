import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  CORS_ORIGINS: z.string().default('*'),

  FIREBASE_SERVICE_ACCOUNT: z.string().optional().default(''),

  DO_SPACES_KEY: z.string().optional().default(''),
  DO_SPACES_SECRET: z.string().optional().default(''),
  DO_SPACES_BUCKET: z.string().optional().default(''),
  DO_SPACES_ENDPOINT: z.string().optional().default(''),
  DO_SPACES_CDN_ENDPOINT: z.string().optional().default(''),
  DO_SPACES_FOLDER: z.string().optional().default(''),

  RATE_LIMIT_PUBLIC: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_USER: z.coerce.number().int().positive().default(120),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isDev: raw.NODE_ENV === 'development',
  corsOrigins: raw.CORS_ORIGINS === '*' ? '*' : raw.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
  firebaseEnabled: Boolean(raw.FIREBASE_SERVICE_ACCOUNT),
  storageEnabled: Boolean(raw.DO_SPACES_KEY && raw.DO_SPACES_SECRET && raw.DO_SPACES_BUCKET && raw.DO_SPACES_ENDPOINT),
};

export default env;

import * as Joi from 'joi';

export const defaultConfig = {
  NODE_ENV: 'development',
  PORT: 3001,
  ALLOWED_ORIGINS: 'http://localhost:3002',
  DATABASE_URL: 'file:./prisma/dev.db',
  PI_INCREMENT_LOW: 10,
  PI_INCREMENT_MEDIUM: 1000,
  PI_INCREMENT_HIGH_PERCENT: 5,
  PI_WRITE_BATCH_SIZE: 10,
  PI_WRITE_BATCH_INTERVAL_MS: 5000,
  PI_DB_CLEANUP_ENABLED: false,
  PI_DB_CLEANUP_KEEP_MILESTONES: true,
  PI_DB_CLEANUP_MIN_PRECISION: 1000,
  THROTTLE_TTL: 60,
  THROTTLE_LIMIT: 100,
};

/**
 * Joi validation schema for environment variables
 */
export const configValidationSchema = Joi.object({
  // App config
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default(defaultConfig.NODE_ENV),
  PORT: Joi.number().default(defaultConfig.PORT),
  ALLOWED_ORIGINS: Joi.string().default(defaultConfig.ALLOWED_ORIGINS),

  // Database config
  DATABASE_URL: Joi.string().required(),

  // Pi computation config
  PI_INCREMENT_LOW: Joi.number()
    .integer()
    .min(1)
    .default(defaultConfig.PI_INCREMENT_LOW),
  PI_INCREMENT_MEDIUM: Joi.number()
    .integer()
    .min(1)
    .default(defaultConfig.PI_INCREMENT_MEDIUM),
  PI_INCREMENT_HIGH_PERCENT: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(defaultConfig.PI_INCREMENT_HIGH_PERCENT),
  PI_WRITE_BATCH_SIZE: Joi.number()
    .integer()
    .min(1)
    .default(defaultConfig.PI_WRITE_BATCH_SIZE),
  PI_WRITE_BATCH_INTERVAL_MS: Joi.number()
    .integer()
    .min(1)
    .default(defaultConfig.PI_WRITE_BATCH_INTERVAL_MS),
  PI_DB_CLEANUP_ENABLED: Joi.boolean().default(
    defaultConfig.PI_DB_CLEANUP_ENABLED,
  ),
  PI_DB_CLEANUP_KEEP_MILESTONES: Joi.boolean().default(
    defaultConfig.PI_DB_CLEANUP_KEEP_MILESTONES,
  ),
  PI_DB_CLEANUP_MIN_PRECISION: Joi.number()
    .integer()
    .min(0)
    .default(defaultConfig.PI_DB_CLEANUP_MIN_PRECISION),

  // Throttle config
  THROTTLE_TTL: Joi.number()
    .integer()
    .min(1)
    .default(defaultConfig.THROTTLE_TTL),
  THROTTLE_LIMIT: Joi.number()
    .integer()
    .min(1)
    .default(defaultConfig.THROTTLE_LIMIT),
});

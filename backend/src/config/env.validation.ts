import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(4000),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  FRONTEND_ORIGINS: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  COOKIE_DOMAIN: Joi.string().allow('').optional(),
  APP_URL: Joi.string().uri().default('http://localhost:3001'),
  WEB_URL: Joi.string().uri().default('http://localhost:3000'),
  ADMIN_URL: Joi.string().uri().default('http://localhost:3002'),
  EMAIL_PROVIDER: Joi.string().valid('gmail', 'dev').default('dev'),
  EMAIL_FROM: Joi.string().default('CasaX <no-reply@casax.local>'),
  GMAIL_USER: Joi.when('EMAIL_PROVIDER', {
    is: 'gmail',
    then: Joi.string().email().required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  GMAIL_APP_PASSWORD: Joi.when('EMAIL_PROVIDER', {
    is: 'gmail',
    then: Joi.string().min(8).required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  EMAIL_TOKEN_TTL_HOURS: Joi.number().integer().min(1).default(72),
  PAYSTACK_SECRET_KEY: Joi.string().allow('').optional(),
  PAYSTACK_PUBLIC_KEY: Joi.string().allow('').optional(),
  PAYSTACK_WEBHOOK_SECRET: Joi.string().allow('').optional(),
  CASAX_PLATFORM_FEE_PERCENT: Joi.number().min(0).max(100).default(5),
  SUBSCRIPTION_TRIAL_DAYS: Joi.number().integer().min(1).default(30),
  SUBSCRIPTION_PAST_DUE_GRACE_DAYS: Joi.number().integer().min(0).default(7),
});

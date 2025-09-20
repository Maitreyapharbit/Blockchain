const Joi = require('joi');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Define validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  HOST: Joi.string().default('localhost'),

  // Database
  SUPABASE_URL: Joi.string().required(),
  SUPABASE_ANON_KEY: Joi.string().required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
  SUPABASE_JWT_SECRET: Joi.string().required(),

  // AWS
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_REGION: Joi.string().default('us-east-1'),
  AWS_S3_BUCKET: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Blockchain
  ETHEREUM_RPC_URL: Joi.string().required(),
  ETHEREUM_RPC_URL_SEPOLIA: Joi.string().optional(),
  ETHEREUM_RPC_URL_MAINNET: Joi.string().optional(),
  PRIVATE_KEY: Joi.string().required(),
  CONTRACT_ADDRESS: Joi.string().optional(),

  // File Upload
  MAX_FILE_SIZE: Joi.number().default(10485760), // 10MB
  ALLOWED_FILE_TYPES: Joi.string().default('pdf,doc,docx,jpg,jpeg,png'),
  UPLOAD_PATH: Joi.string().default('./uploads'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FILE: Joi.string().default('./logs/app.log'),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3001'),
  CORS_CREDENTIALS: Joi.boolean().default(true),

  // Health Check
  HEALTH_CHECK_INTERVAL: Joi.number().default(30000),

  // Security
  BCRYPT_ROUNDS: Joi.number().default(12),
  SESSION_SECRET: Joi.string().required(),

  // Email (Optional)
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  FROM_EMAIL: Joi.string().optional(),

  // Monitoring (Optional)
  SENTRY_DSN: Joi.string().optional(),
  NEW_RELIC_LICENSE_KEY: Joi.string().optional(),

  // Cache (Optional)
  REDIS_URL: Joi.string().optional(),
  REDIS_PASSWORD: Joi.string().optional(),

  // API Keys (Optional)
  INFURA_PROJECT_ID: Joi.string().optional(),
  ALCHEMY_API_KEY: Joi.string().optional(),
  ETHERSCAN_API_KEY: Joi.string().optional(),
}).unknown();

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

// Export configuration
module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  host: envVars.HOST,

  database: {
    supabaseUrl: envVars.SUPABASE_URL,
    supabaseAnonKey: envVars.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: envVars.SUPABASE_SERVICE_ROLE_KEY,
    supabaseJwtSecret: envVars.SUPABASE_JWT_SECRET,
  },

  aws: {
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    region: envVars.AWS_REGION,
    s3Bucket: envVars.AWS_S3_BUCKET,
  },

  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
    refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN,
  },

  blockchain: {
    ethereumRpcUrl: envVars.ETHEREUM_RPC_URL,
    ethereumRpcUrlSepolia: envVars.ETHEREUM_RPC_URL_SEPOLIA,
    ethereumRpcUrlMainnet: envVars.ETHEREUM_RPC_URL_MAINNET,
    privateKey: envVars.PRIVATE_KEY,
    contractAddress: envVars.CONTRACT_ADDRESS,
  },

  upload: {
    maxFileSize: envVars.MAX_FILE_SIZE,
    allowedFileTypes: envVars.ALLOWED_FILE_TYPES.split(','),
    uploadPath: envVars.UPLOAD_PATH,
  },

  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
  },

  logging: {
    level: envVars.LOG_LEVEL,
    file: envVars.LOG_FILE,
  },

  cors: {
    origin: envVars.CORS_ORIGIN,
    credentials: envVars.CORS_CREDENTIALS,
  },

  healthCheck: {
    interval: envVars.HEALTH_CHECK_INTERVAL,
  },

  security: {
    bcryptRounds: envVars.BCRYPT_ROUNDS,
    sessionSecret: envVars.SESSION_SECRET,
  },

  email: {
    smtpHost: envVars.SMTP_HOST,
    smtpPort: envVars.SMTP_PORT,
    smtpUser: envVars.SMTP_USER,
    smtpPass: envVars.SMTP_PASS,
    fromEmail: envVars.FROM_EMAIL,
  },

  monitoring: {
    sentryDsn: envVars.SENTRY_DSN,
    newRelicLicenseKey: envVars.NEW_RELIC_LICENSE_KEY,
  },

  cache: {
    redisUrl: envVars.REDIS_URL,
    redisPassword: envVars.REDIS_PASSWORD,
  },

  apiKeys: {
    infuraProjectId: envVars.INFURA_PROJECT_ID,
    alchemyApiKey: envVars.ALCHEMY_API_KEY,
    etherscanApiKey: envVars.ETHERSCAN_API_KEY,
  },
};

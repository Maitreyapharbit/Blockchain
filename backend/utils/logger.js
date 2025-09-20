const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'pharbit-blockchain-api' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat
    }),

    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],

  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add request logging middleware
logger.request = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      contentLength: res.get('Content-Length')
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

// Add blockchain transaction logging
logger.blockchain = (txHash, method, status, gasUsed, error = null) => {
  const logData = {
    txHash,
    method,
    status,
    gasUsed,
    error: error?.message,
    timestamp: new Date().toISOString()
  };

  if (status === 'success') {
    logger.info('Blockchain Transaction', logData);
  } else {
    logger.error('Blockchain Transaction Failed', logData);
  }
};

// Add database operation logging
logger.database = (operation, table, status, duration, error = null) => {
  const logData = {
    operation,
    table,
    status,
    duration: `${duration}ms`,
    error: error?.message,
    timestamp: new Date().toISOString()
  };

  if (status === 'success') {
    logger.info('Database Operation', logData);
  } else {
    logger.error('Database Operation Failed', logData);
  }
};

// Add S3 operation logging
logger.s3 = (operation, bucket, key, status, size, error = null) => {
  const logData = {
    operation,
    bucket,
    key,
    status,
    size: size ? `${size} bytes` : null,
    error: error?.message,
    timestamp: new Date().toISOString()
  };

  if (status === 'success') {
    logger.info('S3 Operation', logData);
  } else {
    logger.error('S3 Operation Failed', logData);
  }
};

// Add security event logging
logger.security = (event, userId, ip, details = {}) => {
  const logData = {
    event,
    userId,
    ip,
    details,
    timestamp: new Date().toISOString()
  };

  logger.warn('Security Event', logData);
};

// Add performance logging
logger.performance = (operation, duration, metadata = {}) => {
  const logData = {
    operation,
    duration: `${duration}ms`,
    metadata,
    timestamp: new Date().toISOString()
  };

  if (duration > 5000) { // Log slow operations
    logger.warn('Slow Operation', logData);
  } else {
    logger.info('Performance', logData);
  }
};

// Add audit logging
logger.audit = (action, resource, userId, details = {}) => {
  const logData = {
    action,
    resource,
    userId,
    details,
    timestamp: new Date().toISOString()
  };

  logger.info('Audit Log', logData);
};

// Export logger
module.exports = logger;

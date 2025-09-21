const Joi = require('joi');
const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Custom validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      errors: errors.array(),
      path: req.path,
      method: req.method
    });

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array()
      }
    });
  }
  next();
};

// Sanitization middleware
const sanitize = (req, res, next) => {
  // Sanitize string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '');
  };

  // Recursively sanitize object
  const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return sanitizeString(obj);
    if (Array.isArray(obj)) return obj.map(sanitizeObject);
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);

  next();
};

// Common validation schemas
const schemas = {
  // User schemas
  user: {
    create: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      role: Joi.string().valid('manufacturer', 'distributor', 'pharmacy', 'regulator', 'auditor', 'admin').required(),
      walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),
      firstName: Joi.string().max(100).optional(),
      lastName: Joi.string().max(100).optional(),
      companyName: Joi.string().max(255).optional(),
      phone: Joi.string().max(20).optional()
    }),

    update: Joi.object({
      email: Joi.string().email().optional(),
      firstName: Joi.string().max(100).optional(),
      lastName: Joi.string().max(100).optional(),
      companyName: Joi.string().max(255).optional(),
      phone: Joi.string().max(20).optional(),
      isActive: Joi.boolean().optional()
    })
  },

  // Batch schemas
  batch: {
    create: Joi.object({
      batchId: Joi.string().max(100).required(),
      drugName: Joi.string().max(255).required(),
      manufactureDate: Joi.date().iso().required(),
      expiryDate: Joi.date().iso().min(Joi.ref('manufactureDate')).required(),
      quantity: Joi.number().integer().positive().required(),
      batchNumber: Joi.string().max(100).optional(),
      description: Joi.string().max(1000).optional(),
      drugCode: Joi.string().max(50).optional(),
      dosageForm: Joi.string().max(100).optional(),
      strength: Joi.string().max(100).optional(),
      lotNumber: Joi.string().max(100).optional(),
      serialNumber: Joi.string().max(100).optional(),
      temperatureRange: Joi.object({
        min: Joi.number().optional(),
        max: Joi.number().optional(),
        unit: Joi.string().valid('C', 'F').optional()
      }).optional(),
      storageConditions: Joi.string().max(500).optional()
    }),

    update: Joi.object({
      drugName: Joi.string().max(255).optional(),
      quantity: Joi.number().integer().positive().optional(),
      remainingQuantity: Joi.number().integer().min(0).optional(),
      status: Joi.string().valid('CREATED', 'IN_TRANSIT', 'RECEIVED', 'IN_STORAGE', 'DISPENSED', 'RECALLED').optional(),
      description: Joi.string().max(1000).optional(),
      temperatureRange: Joi.object({
        min: Joi.number().optional(),
        max: Joi.number().optional(),
        unit: Joi.string().valid('C', 'F').optional()
      }).optional(),
      storageConditions: Joi.string().max(500).optional()
    }),

    transfer: Joi.object({
      to: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
      quantity: Joi.number().integer().positive().required(),
      reason: Joi.string().max(500).optional()
    })
  },

  // Compliance schemas
  compliance: {
    create: Joi.object({
      batchId: Joi.string().uuid().required(),
      checkType: Joi.string().valid(
        'FDA_APPROVAL',
        'QUALITY_CONTROL',
        'TEMPERATURE_CHECK',
        'PACKAGING_INSPECTION',
        'EXPIRY_VERIFICATION',
        'AUTHENTICITY_CHECK',
        'CUSTOM'
      ).required(),
      passed: Joi.boolean().required(),
      timestamp: Joi.date().iso().optional(),
      notes: Joi.string().max(1000).optional(),
      documentHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).optional()
    }),

    update: Joi.object({
      passed: Joi.boolean().optional(),
      notes: Joi.string().max(1000).optional(),
      documentHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).optional()
    })
  },

  // File schemas
  file: {
    upload: Joi.object({
      batchId: Joi.string().uuid().optional(),
      fileType: Joi.string().valid(
        'CERTIFICATE',
        'INVOICE',
        'MANIFEST',
        'QUALITY_REPORT',
        'COMPLIANCE_DOCUMENT',
        'IMAGE',
        'OTHER'
      ).required(),
      purpose: Joi.string().max(100).optional(),
      isRequired: Joi.boolean().optional(),
      metadata: Joi.object().optional()
    })
  },

  // Query schemas
  query: {
    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      sortBy: Joi.string().optional(),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    }),

    search: Joi.object({
      search: Joi.string().max(255).optional(),
      status: Joi.string().optional(),
      manufacturerId: Joi.string().uuid().optional(),
      ownerId: Joi.string().uuid().optional(),
      drugName: Joi.string().max(255).optional()
    })
  }
};

// Validation middleware functions
const validators = {
  validateRecordId: [ (req, res, next) => { next(); } ],
  // User validators
  validateUserCreate: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    body('role').isIn(['manufacturer', 'distributor', 'pharmacy', 'regulator', 'auditor', 'admin']),
    body('walletAddress').optional().isEthereumAddress(),
    body('firstName').optional().isLength({ max: 100 }).trim(),
    body('lastName').optional().isLength({ max: 100 }).trim(),
    body('companyName').optional().isLength({ max: 255 }).trim(),
    body('phone').optional().isLength({ max: 20 }).trim(),
    validate
  ],

  validateUserUpdate: [
    body('email').optional().isEmail().normalizeEmail(),
    body('firstName').optional().isLength({ max: 100 }).trim(),
    body('lastName').optional().isLength({ max: 100 }).trim(),
    body('companyName').optional().isLength({ max: 255 }).trim(),
    body('phone').optional().isLength({ max: 20 }).trim(),
    body('isActive').optional().isBoolean(),
    validate
  ],

  // Batch validators
  validateBatchCreate: [
    body('batchId').isLength({ min: 1, max: 100 }).trim(),
    body('drugName').isLength({ min: 1, max: 255 }).trim(),
    body('manufactureDate').isISO8601().toDate(),
    body('expiryDate').isISO8601().toDate().custom((value, { req }) => {
      if (value <= req.body.manufactureDate) {
        throw new Error('Expiry date must be after manufacture date');
      }
      return true;
    }),
    body('quantity').isInt({ min: 1 }),
    body('batchNumber').optional().isLength({ max: 100 }).trim(),
    body('description').optional().isLength({ max: 1000 }).trim(),
    body('drugCode').optional().isLength({ max: 50 }).trim(),
    body('dosageForm').optional().isLength({ max: 100 }).trim(),
    body('strength').optional().isLength({ max: 100 }).trim(),
    body('lotNumber').optional().isLength({ max: 100 }).trim(),
    body('serialNumber').optional().isLength({ max: 100 }).trim(),
    validate
  ],

  validateBatchUpdate: [
    body('drugName').optional().isLength({ min: 1, max: 255 }).trim(),
    body('quantity').optional().isInt({ min: 1 }),
    body('remainingQuantity').optional().isInt({ min: 0 }),
    body('status').optional().isIn(['CREATED', 'IN_TRANSIT', 'RECEIVED', 'IN_STORAGE', 'DISPENSED', 'RECALLED']),
    body('description').optional().isLength({ max: 1000 }).trim(),
    validate
  ],

  validateBatchTransfer: [
    body('to').isEthereumAddress(),
    body('quantity').isInt({ min: 1 }),
    body('reason').optional().isLength({ max: 500 }).trim(),
    validate
  ],

  // Compliance validators
  validateComplianceCreate: [
    body('batchId').isUUID(),
    body('checkType').isIn([
      'FDA_APPROVAL',
      'QUALITY_CONTROL',
      'TEMPERATURE_CHECK',
      'PACKAGING_INSPECTION',
      'EXPIRY_VERIFICATION',
      'AUTHENTICITY_CHECK',
      'CUSTOM'
    ]),
    body('passed').isBoolean(),
    body('timestamp').optional().isISO8601().toDate(),
    body('notes').optional().isLength({ max: 1000 }).trim(),
    body('documentHash').optional().isLength({ min: 66, max: 66 }).matches(/^0x[a-fA-F0-9]{64}$/),
    validate
  ],

  validateComplianceUpdate: [
    body('passed').optional().isBoolean(),
    body('notes').optional().isLength({ max: 1000 }).trim(),
    body('documentHash').optional().isLength({ min: 66, max: 66 }).matches(/^0x[a-fA-F0-9]{64}$/),
    validate
  ],

  // File validators
  validateFileUpload: [
    body('batchId').optional().isUUID(),
    body('fileType').isIn([
      'CERTIFICATE',
      'INVOICE',
      'MANIFEST',
      'QUALITY_REPORT',
      'COMPLIANCE_DOCUMENT',
      'IMAGE',
      'OTHER'
    ]),
    body('purpose').optional().isLength({ max: 100 }).trim(),
    body('isRequired').optional().isBoolean(),
    validate
  ],

  // Parameter validators
  validateUUID: [
    param('id').isUUID(),
    validate
  ],

  validateBatchId: [
    param('batchId').isLength({ min: 1, max: 100 }).trim(),
    validate
  ],

  // Query validators
  validatePagination: [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sortBy').optional().isLength({ max: 50 }).trim(),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    validate
  ],

  validateSearch: [
    query('search').optional().isLength({ max: 255 }).trim(),
    query('status').optional().isIn(['CREATED', 'IN_TRANSIT', 'RECEIVED', 'IN_STORAGE', 'DISPENSED', 'RECALLED']),
    query('manufacturerId').optional().isUUID(),
    query('ownerId').optional().isUUID(),
    query('drugName').optional().isLength({ max: 255 }).trim(),
    validate
  ],

  validateFileId: [
    param('fileId').isUUID().withMessage('Invalid file ID format'),
    validate
  ]
};

// Custom validation functions
const customValidators = {
  // Validate file size
  validateFileSize: (maxSize) => (req, res, next) => {
    if (req.file && req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds maximum allowed size of ${maxSize} bytes`
        }
      });
    }
    next();
  },

  // Validate file type
  validateFileType: (allowedTypes) => (req, res, next) => {
    if (req.file) {
      const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: `File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
          }
        });
      }
    }
    next();
  },

  // Validate date range
  validateDateRange: (startField, endField) => (req, res, next) => {
    const startDate = req.body[startField];
    const endDate = req.body[endField];

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE_RANGE',
          message: `${endField} must be after ${startField}`
        }
      });
    }
    next();
  },

  // Validate quantity constraints
  validateQuantity: (req, res, next) => {
    const { quantity, remainingQuantity } = req.body;

    if (quantity !== undefined && remainingQuantity !== undefined) {
      if (remainingQuantity > quantity) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_QUANTITY',
            message: 'Remaining quantity cannot exceed total quantity'
          }
        });
      }
    }
    next();
  }
};

// Error handling middleware
const handleValidationError = (error, req, res, next) => {
  if (error.name === 'ValidationError') {
    logger.warn('Joi validation error', {
      error: error.message,
      path: req.path,
      method: req.method
    });

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }))
      }
    });
  }

  next(error);
};


// Joi validation middleware for request bodies
const validateJoi = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    logger.warn('Joi validation error', {
      error: error.message,
      path: req.path,
      method: req.method
    });
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }))
      }
    });
  }
  next();
};

// Minimal batchSchemas for backend startup
const batchSchemas = {
  create: Joi.object({
    drugName: Joi.string().required(),
    drugCode: Joi.string().required(),
    manufacturer: Joi.string().required(),
    manufactureDate: Joi.string().required(),
    expiryDate: Joi.string().required(),
    quantity: Joi.number().required(),
    serialNumbers: Joi.array().items(Joi.string()),
    metadata: Joi.object().optional()
  }),
  transfer: Joi.object({}),
  updateStatus: Joi.object({}),
  updateMetadata: Joi.object({})
};

const complianceSchemas = {
  createCheck: Joi.object({
    batchId: Joi.number().required(),
    checkType: Joi.string().required()
  }),
  updateStatus: Joi.object({}),
  recordAudit: Joi.object({})
};
module.exports = {
  validate,
  sanitize,
  schemas,
  validators,
  customValidators,
  handleValidationError,
  validateJoi,
  batchSchemas,
  complianceSchemas,
  walletSchemas: {
    generate: Joi.object({
      count: Joi.number().integer().min(1).max(100).default(1)
    }),
    import: Joi.object({
      privateKey: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required()
    })
  },
  fileSchemas: schemas.file
};

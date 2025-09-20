const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PharbitChain API',
      version: '1.0.0',
      description: 'Complete API for pharmaceutical blockchain management system',
      contact: {
        name: 'PharbitChain Team',
        email: 'support@pharbitchain.com',
        url: 'https://pharbitchain.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.pharbitchain.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        }
      },
      schemas: {
        // Common schemas
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            path: {
              type: 'string',
              description: 'Request path'
            },
            method: {
              type: 'string',
              description: 'HTTP method'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              minimum: 1,
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              description: 'Number of items per page'
            },
            total: {
              type: 'integer',
              minimum: 0,
              description: 'Total number of items'
            },
            pages: {
              type: 'integer',
              minimum: 0,
              description: 'Total number of pages'
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            txHash: {
              type: 'string',
              description: 'Transaction hash'
            },
            gasUsed: {
              type: 'string',
              description: 'Gas used for transaction'
            },
            blockNumber: {
              type: 'integer',
              description: 'Block number'
            }
          }
        },

        // User schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID'
            },
            address: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Ethereum address'
            },
            role: {
              type: 'string',
              enum: ['user', 'manufacturer', 'distributor', 'pharmacy', 'regulator', 'auditor', 'compliance_officer', 'quality_manager', 'admin'],
              description: 'User role'
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'User permissions'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['address'],
          properties: {
            address: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Ethereum address'
            },
            role: {
              type: 'string',
              enum: ['user', 'manufacturer', 'distributor', 'pharmacy', 'regulator', 'auditor', 'compliance_officer', 'quality_manager', 'admin'],
              default: 'user',
              description: 'User role'
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string'
              },
              default: [],
              description: 'User permissions'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['address'],
          properties: {
            address: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Ethereum address'
            }
          }
        },

        // Batch schemas
        Batch: {
          type: 'object',
          properties: {
            batchId: {
              type: 'string',
              description: 'Batch ID'
            },
            drugName: {
              type: 'string',
              description: 'Drug name'
            },
            drugCode: {
              type: 'string',
              description: 'Drug code'
            },
            manufacturer: {
              type: 'string',
              description: 'Manufacturer name'
            },
            manufactureDate: {
              type: 'string',
              format: 'date-time',
              description: 'Manufacture date'
            },
            expiryDate: {
              type: 'string',
              format: 'date-time',
              description: 'Expiry date'
            },
            quantity: {
              type: 'string',
              description: 'Quantity'
            },
            status: {
              type: 'integer',
              minimum: 0,
              maximum: 10,
              description: 'Batch status'
            },
            currentOwner: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Current owner address'
            },
            serialNumbers: {
              type: 'string',
              description: 'Serial numbers'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        CreateBatchRequest: {
          type: 'object',
          required: ['drugName', 'drugCode', 'manufacturer', 'manufactureDate', 'expiryDate', 'quantity'],
          properties: {
            drugName: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
              description: 'Drug name'
            },
            drugCode: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              description: 'Drug code'
            },
            manufacturer: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
              description: 'Manufacturer name'
            },
            manufactureDate: {
              type: 'string',
              format: 'date-time',
              description: 'Manufacture date'
            },
            expiryDate: {
              type: 'string',
              format: 'date-time',
              description: 'Expiry date'
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              description: 'Quantity'
            },
            serialNumbers: {
              type: 'string',
              maxLength: 1000,
              description: 'Serial numbers'
            },
            metadata: {
              type: 'object',
              additionalProperties: {
                type: 'string'
              },
              description: 'Additional metadata'
            }
          }
        },
        TransferBatchRequest: {
          type: 'object',
          required: ['to', 'reason', 'location'],
          properties: {
            to: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Recipient address'
            },
            reason: {
              type: 'string',
              minLength: 1,
              maxLength: 500,
              description: 'Transfer reason'
            },
            location: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
              description: 'Current location'
            },
            notes: {
              type: 'string',
              maxLength: 1000,
              description: 'Additional notes'
            }
          }
        },
        UpdateBatchStatusRequest: {
          type: 'object',
          required: ['status', 'reason'],
          properties: {
            status: {
              type: 'integer',
              minimum: 0,
              maximum: 10,
              description: 'New batch status'
            },
            reason: {
              type: 'string',
              minLength: 1,
              maxLength: 500,
              description: 'Reason for status change'
            }
          }
        },
        UpdateBatchMetadataRequest: {
          type: 'object',
          required: ['metadata'],
          properties: {
            metadata: {
              type: 'object',
              additionalProperties: {
                type: 'string'
              },
              description: 'Metadata to update'
            }
          }
        },
        BatchTransfer: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Transfer ID'
            },
            batchId: {
              type: 'integer',
              description: 'Batch ID'
            },
            fromAddress: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'From address'
            },
            toAddress: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'To address'
            },
            reason: {
              type: 'string',
              description: 'Transfer reason'
            },
            location: {
              type: 'string',
              description: 'Location'
            },
            notes: {
              type: 'string',
              description: 'Notes'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Transfer timestamp'
            }
          }
        },

        // Compliance schemas
        ComplianceRecord: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Record ID'
            },
            recordId: {
              type: 'integer',
              description: 'Compliance record ID'
            },
            batchId: {
              type: 'integer',
              description: 'Batch ID'
            },
            checkType: {
              type: 'integer',
              minimum: 0,
              maximum: 7,
              description: 'Check type'
            },
            status: {
              type: 'integer',
              minimum: 0,
              maximum: 4,
              description: 'Compliance status'
            },
            passed: {
              type: 'boolean',
              description: 'Whether check passed'
            },
            auditor: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Auditor address'
            },
            notes: {
              type: 'string',
              description: 'Notes'
            },
            findings: {
              type: 'string',
              description: 'Findings'
            },
            correctiveActions: {
              type: 'string',
              description: 'Corrective actions'
            },
            evidenceHashes: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Evidence hashes'
            },
            additionalData: {
              type: 'object',
              additionalProperties: {
                type: 'string'
              },
              description: 'Additional data'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        CreateComplianceCheckRequest: {
          type: 'object',
          required: ['batchId', 'checkType', 'notes'],
          properties: {
            batchId: {
              type: 'integer',
              minimum: 1,
              description: 'Batch ID'
            },
            checkType: {
              type: 'integer',
              minimum: 0,
              maximum: 7,
              description: 'Check type'
            },
            notes: {
              type: 'string',
              minLength: 1,
              maxLength: 1000,
              description: 'Notes'
            },
            findings: {
              type: 'string',
              maxLength: 2000,
              description: 'Findings'
            },
            correctiveActions: {
              type: 'string',
              maxLength: 2000,
              description: 'Corrective actions'
            },
            evidenceHashes: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Evidence hashes'
            },
            additionalData: {
              type: 'object',
              additionalProperties: {
                type: 'string'
              },
              description: 'Additional data'
            }
          }
        },
        UpdateComplianceStatusRequest: {
          type: 'object',
          required: ['status', 'passed'],
          properties: {
            status: {
              type: 'integer',
              minimum: 0,
              maximum: 4,
              description: 'New compliance status'
            },
            passed: {
              type: 'boolean',
              description: 'Whether check passed'
            },
            updatedNotes: {
              type: 'string',
              maxLength: 1000,
              description: 'Updated notes'
            }
          }
        },
        RecordAuditTrailRequest: {
          type: 'object',
          required: ['batchId', 'auditType', 'findings', 'result'],
          properties: {
            batchId: {
              type: 'integer',
              minimum: 1,
              description: 'Batch ID'
            },
            auditType: {
              type: 'integer',
              minimum: 0,
              maximum: 7,
              description: 'Audit type'
            },
            findings: {
              type: 'string',
              minLength: 1,
              maxLength: 2000,
              description: 'Audit findings'
            },
            recommendations: {
              type: 'string',
              maxLength: 2000,
              description: 'Recommendations'
            },
            result: {
              type: 'integer',
              minimum: 0,
              maximum: 4,
              description: 'Audit result'
            },
            evidenceHashes: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Evidence hashes'
            }
          }
        },
        AuditTrail: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Audit ID'
            },
            auditId: {
              type: 'integer',
              description: 'Audit trail ID'
            },
            batchId: {
              type: 'integer',
              description: 'Batch ID'
            },
            auditor: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Auditor address'
            },
            auditDate: {
              type: 'string',
              format: 'date-time',
              description: 'Audit date'
            },
            auditType: {
              type: 'integer',
              minimum: 0,
              maximum: 7,
              description: 'Audit type'
            },
            findings: {
              type: 'string',
              description: 'Findings'
            },
            recommendations: {
              type: 'string',
              description: 'Recommendations'
            },
            result: {
              type: 'integer',
              minimum: 0,
              maximum: 4,
              description: 'Audit result'
            },
            evidenceHashes: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Evidence hashes'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            }
          }
        },
        ComplianceStandard: {
          type: 'object',
          properties: {
            standardName: {
              type: 'string',
              description: 'Standard name'
            },
            description: {
              type: 'string',
              description: 'Standard description'
            },
            version: {
              type: 'string',
              description: 'Standard version'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether standard is active'
            },
            requirements: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Standard requirements'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            createdBy: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Creator address'
            }
          }
        },
        SetComplianceStandardRequest: {
          type: 'object',
          required: ['name', 'description', 'version', 'isActive', 'requirements'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              description: 'Standard name'
            },
            description: {
              type: 'string',
              minLength: 1,
              description: 'Standard description'
            },
            version: {
              type: 'string',
              minLength: 1,
              description: 'Standard version'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether standard is active'
            },
            requirements: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Standard requirements'
            }
          }
        },

        // Wallet schemas
        Wallet: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Wallet ID'
            },
            address: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Wallet address'
            },
            name: {
              type: 'string',
              description: 'Wallet name'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether wallet is active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            }
          }
        },
        GenerateWalletsRequest: {
          type: 'object',
          properties: {
            count: {
              type: 'integer',
              minimum: 1,
              maximum: 10,
              default: 1,
              description: 'Number of wallets to generate'
            }
          }
        },
        ImportWalletRequest: {
          type: 'object',
          required: ['privateKey'],
          properties: {
            privateKey: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{64}$',
              description: 'Private key'
            },
            name: {
              type: 'string',
              maxLength: 100,
              description: 'Wallet name'
            }
          }
        },

        // File schemas
        File: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'File ID'
            },
            fileId: {
              type: 'string',
              format: 'uuid',
              description: 'File UUID'
            },
            originalName: {
              type: 'string',
              description: 'Original file name'
            },
            fileName: {
              type: 'string',
              description: 'Stored file name'
            },
            contentType: {
              type: 'string',
              description: 'File content type'
            },
            fileSize: {
              type: 'integer',
              description: 'File size in bytes'
            },
            category: {
              type: 'string',
              enum: ['compliance', 'evidence', 'documentation', 'other'],
              description: 'File category'
            },
            description: {
              type: 'string',
              description: 'File description'
            },
            batchId: {
              type: 'integer',
              description: 'Associated batch ID'
            },
            uploadedBy: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Uploader address'
            },
            uploadedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Upload timestamp'
            },
            metadata: {
              type: 'object',
              additionalProperties: true,
              description: 'File metadata'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                timestamp: '2024-01-01T00:00:00.000Z',
                path: '/api/batches',
                method: 'POST'
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Access token required',
                code: 'MISSING_TOKEN',
                timestamp: '2024-01-01T00:00:00.000Z',
                path: '/api/batches',
                method: 'GET'
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Insufficient permissions',
                code: 'INSUFFICIENT_PERMISSIONS',
                timestamp: '2024-01-01T00:00:00.000Z',
                path: '/api/batches',
                method: 'POST'
              }
            }
          }
        },
        NotFound: {
          description: 'Not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Resource not found',
                code: 'NOT_FOUND',
                timestamp: '2024-01-01T00:00:00.000Z',
                path: '/api/batches/999',
                method: 'GET'
              }
            }
          }
        },
        Conflict: {
          description: 'Conflict',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Resource already exists',
                code: 'CONFLICT',
                timestamp: '2024-01-01T00:00:00.000Z',
                path: '/api/wallets/import',
                method: 'POST'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Internal server error',
                code: 'INTERNAL_SERVER_ERROR',
                timestamp: '2024-01-01T00:00:00.000Z',
                path: '/api/batches',
                method: 'POST'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Batches',
        description: 'Pharmaceutical batch management'
      },
      {
        name: 'Compliance',
        description: 'Compliance tracking and auditing'
      },
      {
        name: 'Wallets',
        description: 'Wallet management and generation'
      },
      {
        name: 'Files',
        description: 'File upload and management'
      },
      {
        name: 'Health',
        description: 'Health check and monitoring'
      }
    ]
  },
  apis: ['./routes/*.js'] // Path to the API files
};

const specs = swaggerJSDoc(options);

module.exports = specs;

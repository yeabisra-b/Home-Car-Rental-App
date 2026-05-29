import swaggerJsdoc from 'swagger-jsdoc';
import { ENV } from './environment';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rental Property Management System API',
      version: '1.0.0',
      description: 'API documentation for the Rental Property Management System',
      contact: {
        name: 'API Support',
        email: 'support@rpms.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${ENV.PORT}/api/v1`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authentication token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            firstName: {
              type: 'string',
              description: 'User first name',
            },
            middleName: {
              type: 'string',
              nullable: true,
              description: 'User middle name',
            },
            lastName: {
              type: 'string',
              description: 'User last name',
            },
            phoneNumber: {
              type: 'string',
              description: 'User phone number (optional)',
            },
            role: {
              type: 'string',
              enum: ['OWNER', 'TENANT', 'ADMIN'],
              description: 'User role',
            },
            accountStatus: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
              description: 'User account status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User',
            },
            accessToken: {
              type: 'string',
              description: 'JWT authentication token',
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token',
            },
          },
        },
        PropertySummary: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            ownerId: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
            },
            addressCity: {
              type: 'string',
            },
            addressStreet: {
              type: 'string',
              nullable: true,
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DELETED'],
            },
          },
        },
        RentalUnitSummary: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            propertyId: {
              type: 'string',
              format: 'uuid',
            },
            unitIdentifier: {
              type: 'string',
            },
            bedrooms: {
              type: 'integer',
            },
            bathrooms: {
              type: 'integer',
            },
            areaSqMeters: {
              type: 'number',
              nullable: true,
            },
            rentAmount: {
              type: 'number',
            },
            depositAmount: {
              type: 'number',
              nullable: true,
            },
            status: {
              type: 'string',
              enum: ['VACANT', 'OCCUPIED', 'MAINTENANCE', 'UNAVAILABLE'],
            },
            description: {
              type: 'string',
              nullable: true,
            },
            floorNumber: {
              type: 'integer',
              nullable: true,
            },
            amenities: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            property: {
              $ref: '#/components/schemas/PropertySummary',
            },
          },
        },
        LeaseDocument: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            leaseId: {
              type: 'string',
              format: 'uuid',
            },
            documentType: {
              type: 'string',
            },
            filePath: {
              type: 'string',
            },
            uploadedBy: {
              type: 'string',
              format: 'uuid',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Lease: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            unitId: {
              type: 'string',
              format: 'uuid',
            },
            tenantId: {
              type: 'string',
              format: 'uuid',
            },
            startDate: {
              type: 'string',
              format: 'date',
            },
            endDate: {
              type: 'string',
              format: 'date',
            },
            monthlyRent: {
              type: 'number',
            },
            depositAmount: {
              type: 'number',
            },
            status: {
              type: 'string',
              enum: ['DRAFT', 'ACTIVE', 'TERMINATED', 'EXPIRED'],
            },
            moveOutNoticeDate: {
              type: 'string',
              format: 'date',
              nullable: true,
            },
            moveOutNoticeNote: {
              type: 'string',
              nullable: true,
            },
            terminationReason: {
              type: 'string',
              nullable: true,
            },
            terminatedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            unit: {
              $ref: '#/components/schemas/RentalUnitSummary',
            },
            tenant: {
              $ref: '#/components/schemas/User',
            },
            documents: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/LeaseDocument',
              },
            },
          },
        },
        PaymentReceipt: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            invoiceId: {
              type: 'string',
              format: 'uuid',
            },
            filePath: {
              type: 'string',
            },
            transactionRef: {
              type: 'string',
              nullable: true,
            },
            paymentMethod: {
              type: 'string',
              nullable: true,
            },
            uploadedBy: {
              type: 'string',
              format: 'uuid',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Invoice: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            leaseId: {
              type: 'string',
              format: 'uuid',
            },
            billingMonth: {
              type: 'string',
              format: 'date',
            },
            amountDue: {
              type: 'number',
            },
            dueDate: {
              type: 'string',
              format: 'date',
            },
            status: {
              type: 'string',
              enum: ['UNPAID', 'PENDING_REVIEW', 'PAID', 'OVERDUE'],
            },
            reviewNote: {
              type: 'string',
              nullable: true,
            },
            reviewedBy: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            reviewedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            lease: {
              $ref: '#/components/schemas/Lease',
            },
            receipts: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/PaymentReceipt',
              },
            },
            reviewer: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        MaintenanceEvidence: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            requestId: {
              type: 'string',
              format: 'uuid',
            },
            filePath: {
              type: 'string',
            },
            uploadedBy: {
              type: 'string',
              format: 'uuid',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        MaintenanceRequest: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            unitId: {
              type: 'string',
              format: 'uuid',
            },
            tenantId: {
              type: 'string',
              format: 'uuid',
            },
            category: {
              type: 'string',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
            },
            description: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'],
            },
            note: {
              type: 'string',
              nullable: true,
            },
            resolvedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            resolvedBy: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            unit: {
              $ref: '#/components/schemas/RentalUnitSummary',
            },
            tenant: {
              $ref: '#/components/schemas/User',
            },
            resolver: {
              $ref: '#/components/schemas/User',
            },
            evidence: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/MaintenanceEvidence',
              },
            },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            senderId: {
              type: 'string',
              format: 'uuid',
            },
            receiverId: {
              type: 'string',
              format: 'uuid',
            },
            subject: {
              type: 'string',
            },
            content: {
              type: 'string',
            },
            readAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            sender: {
              $ref: '#/components/schemas/User',
            },
            receiver: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        Announcement: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            ownerId: {
              type: 'string',
              format: 'uuid',
            },
            propertyId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            title: {
              type: 'string',
            },
            content: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            owner: {
              $ref: '#/components/schemas/User',
            },
            property: {
              $ref: '#/components/schemas/PropertySummary',
            },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            type: {
              type: 'string',
              enum: ['MESSAGE', 'ANNOUNCEMENT', 'MAINTENANCE', 'INVOICE', 'SYSTEM'],
            },
            message: {
              type: 'string',
            },
            entityType: {
              type: 'string',
              nullable: true,
            },
            entityId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            isRead: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Additional error details (for validation errors)',
            },
          },
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'OK',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    persistAuthorization: true,
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const specs = swaggerJsdoc(options);

export const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'RPMS API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true
  }
};

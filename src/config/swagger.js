const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Omnicore API Gateway',
      version: '1.0.0',
      description:
        'Single entry point for the Omnicore platform. Handles JWT authentication, role-based access control (RBAC), and proxies requests to downstream services (auth, user, product).',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local / Docker (default)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtained from POST /auth/login',
        },
      },
      schemas: {
        // ── Auth ──────────────────────────────────────────────────────────
        SignupInput: {
          type: 'object',
          required: ['email', 'password', 'username'],
          properties: {
            email:    { type: 'string', format: 'email',    example: 'user@example.com' },
            password: { type: 'string', minLength: 8,       example: 'Secret@123' },
            username: { type: 'string',                     example: 'johndoe' },
          },
        },
        SignupResponse: {
          type: 'object',
          properties: {
            id:            { type: 'string', format: 'uuid' },
            email:         { type: 'string', format: 'email' },
            isActive:      { type: 'boolean' },
            emailVerified: { type: 'boolean' },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string',                  example: 'Secret@123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            accessToken:      { type: 'string' },
            refreshToken:     { type: 'string', format: 'uuid' },
            expiresIn:        { type: 'string', example: '15m' },
            refreshExpiresIn: { type: 'string', example: '30d' },
            user: {
              type: 'object',
              properties: {
                id:    { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                roles: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
        // ── Roles ─────────────────────────────────────────────────────────
        Role: {
          type: 'object',
          properties: {
            id:          { type: 'string', format: 'uuid' },
            name:        { type: 'string', example: 'Principal' },
            description: { type: 'string' },
          },
        },
        // ── Users ─────────────────────────────────────────────────────────
        UserInput: {
          type: 'object',
          required: ['auth_user_id', 'country_id'],
          properties: {
            auth_user_id:  { type: 'string', format: 'uuid' },
            country_id:    { type: 'string', format: 'uuid' },
            first_name:    { type: 'string', example: 'Jane' },
            last_name:     { type: 'string', example: 'Doe' },
            phone_number:  { type: 'string', example: '+33600000001' },
            status:        { type: 'string', example: 'active' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id:           { type: 'string', format: 'uuid', description: 'Same UUID as auth_user_id' },
            country_id:   { type: 'string', format: 'uuid' },
            first_name:   { type: 'string' },
            last_name:    { type: 'string' },
            phone_number: { type: 'string' },
            status:       { type: 'string' },
            created_at:   { type: 'string', format: 'date-time' },
            updated_at:   { type: 'string', format: 'date-time' },
          },
        },
        UserAddress: {
          type: 'object',
          properties: {
            id:          { type: 'string', format: 'uuid' },
            user_id:     { type: 'string', format: 'uuid' },
            country_id:  { type: 'string', format: 'uuid', nullable: true },
            street:      { type: 'string', example: '12 Rue de Rivoli' },
            city:        { type: 'string', example: 'Paris' },
            postal_code: { type: 'string', example: '75001' },
            is_primary:  { type: 'boolean' },
            created_at:  { type: 'string', format: 'date-time' },
          },
        },
        UserPreference: {
          type: 'object',
          properties: {
            id:                    { type: 'string', format: 'uuid' },
            user_id:               { type: 'string', format: 'uuid' },
            language:              { type: 'string', example: 'fr' },
            timezone:              { type: 'string', example: 'Europe/Paris' },
            notifications_enabled: { type: 'boolean' },
          },
        },
        UserAuditLog: {
          type: 'object',
          properties: {
            id:           { type: 'string', format: 'uuid' },
            user_id:      { type: 'string', format: 'uuid' },
            action:       { type: 'string', example: 'USER_PROFILE_UPDATED' },
            performed_by: { type: 'string', format: 'uuid', nullable: true },
            created_at:   { type: 'string', format: 'date-time' },
          },
        },
        // ── Products ──────────────────────────────────────────────────────
        Product: {
          type: 'object',
          properties: {
            id:              { type: 'string', format: 'uuid' },
            name:            { type: 'string', example: 'Blue T-Shirt' },
            description:     { type: 'string', example: '100% cotton crew-neck' },
            isActive:        { type: 'boolean' },
            images:          { type: 'array', items: { $ref: '#/components/schemas/ProductImage' } },
            countryProducts: { type: 'array', items: { $ref: '#/components/schemas/CountryProduct' } },
            createdAt:       { type: 'string', format: 'date-time' },
            updatedAt:       { type: 'string', format: 'date-time' },
          },
        },
        ProductImage: {
          type: 'object',
          properties: {
            id:        { type: 'string', format: 'uuid' },
            productId: { type: 'string', format: 'uuid' },
            url:       { type: 'string', format: 'uri' },
            publicId:  { type: 'string', nullable: true },
            isPrimary: { type: 'boolean' },
          },
        },
        Country: {
          type: 'object',
          properties: {
            id:          { type: 'string', format: 'uuid' },
            name:        { type: 'string', example: 'France' },
            countryCode: { type: 'string', example: 'FR' },
            currency:    { type: 'string', example: 'EUR' },
            isActive:    { type: 'boolean' },
            createdAt:   { type: 'string', format: 'date-time' },
          },
        },
        CountryProduct: {
          type: 'object',
          properties: {
            id:          { type: 'string', format: 'uuid' },
            productId:   { type: 'string', format: 'uuid' },
            countryId:   { type: 'string', format: 'uuid' },
            price:       { type: 'number', format: 'float', example: 29.99 },
            currency:    { type: 'string', example: 'EUR' },
            quantity:    { type: 'integer', example: 100 },
            isAvailable: { type: 'boolean' },
            updatedAt:   { type: 'string', format: 'date-time' },
          },
        },
        // ── Orders ────────────────────────────────────────────────────────
        Order: {
          type: 'object',
          properties: {
            id:          { type: 'string', format: 'uuid' },
            userId:      { type: 'string', format: 'uuid' },
            countryId:   { type: 'string', format: 'uuid' },
            status:      { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] },
            totalAmount: { type: 'number', format: 'float', example: 59.98 },
            currency:    { type: 'string', example: 'EUR' },
            items:       { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
            createdAt:   { type: 'string', format: 'date-time' },
            updatedAt:   { type: 'string', format: 'date-time' },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            id:               { type: 'string', format: 'uuid' },
            orderId:          { type: 'string', format: 'uuid' },
            countryProductId: { type: 'string', format: 'uuid' },
            quantity:         { type: 'integer', example: 2 },
            unitPrice:        { type: 'number', format: 'float', example: 29.99 },
            currency:         { type: 'string', example: 'EUR' },
          },
        },
        // ── Payments ──────────────────────────────────────────────────────
        Payment: {
          type: 'object',
          properties: {
            id:                    { type: 'string', format: 'uuid' },
            orderId:               { type: 'string', format: 'uuid' },
            stripePaymentIntentId: { type: 'string', example: 'pi_3OxTnZ2eZvKYlo2C1PBpABCD' },
            stripeClientSecret:    { type: 'string', description: 'Pass to Stripe.js to confirm the payment on the client' },
            amount:                { type: 'number', format: 'float', example: 59.98 },
            currency:              { type: 'string', example: 'eur' },
            status:                { type: 'string', enum: ['pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded'] },
            failureReason:         { type: 'string', nullable: true },
            refundId:              { type: 'string', nullable: true },
            paidAt:                { type: 'string', format: 'date-time', nullable: true },
            failedAt:              { type: 'string', format: 'date-time', nullable: true },
            refundedAt:            { type: 'string', format: 'date-time', nullable: true },
            createdAt:             { type: 'string', format: 'date-time' },
            updatedAt:             { type: 'string', format: 'date-time' },
          },
        },
        RefundInput: {
          type: 'object',
          properties: {
            reason: { type: 'string', enum: ['duplicate', 'fraudulent', 'requested_by_customer'] },
          },
        },
        // ── Common ────────────────────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message:       { type: 'string' },
                status:        { type: 'integer' },
                correlationId: { type: 'string' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);

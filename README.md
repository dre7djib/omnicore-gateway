# Omnicore Gateway

![CI Status](https://github.com/dre7djib/omnicore-gateway/actions/workflows/ci.yml/badge.svg)

**Omnicore Gateway** is a secure, scalable API gateway with Role-Based Access Control (RBAC) for the Omnicore platform. It provides centralized authentication, authorization, routing, and security features for microservices architecture.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with RBAC
- **API Gateway**: Reverse proxy and routing to microservices
- **Security**:
  - Helmet.js for security headers
  - Rate limiting
  - CORS configuration
  - Security audit integration
- **Country-Scoped Access**: Multi-tenant support with country-level isolation
- **Monitoring & Logging**: Structured logging with Pino
- **Request Correlation**: Trace requests across services
- **Database**: Prisma ORM with PostgreSQL
- **Testing**: Unit tests with Jest
- **CI/CD**: GitHub Actions pipeline

## 📋 Prerequisites

- Node.js 20.x or higher
- PostgreSQL 14.x or higher
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/dre7djib/omnicore-gateway.git
cd omnicore-gateway
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/omnicore_gateway
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1h
```

4. **Setup database**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed roles
npm run seed:roles

# Create principal user
npm run bootstrap:principal
```

## 🏃 Running the Application

### Development mode
```bash
npm run dev
```

### Production mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or the PORT specified in .env)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:unit

# Watch mode
npm run test:watch
```

## 🔍 Code Quality

```bash
# Lint code
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Security audit
npm run security:audit

# Check for dependency updates
npm run deps:check
```

## 📁 Project Structure

```
omnicore-gateway/
├── .github/
│   └── workflows/        # CI/CD pipelines
├── prisma/
│   └── schema.prisma     # Database schema
├── scripts/
│   ├── seed-roles.js     # Seed RBAC roles
│   └── bootstrap-principal.js
├── src/
│   ├── config/           # Configuration
│   ├── middlewares/      # Express middlewares
│   │   ├── authenticate.js
│   │   ├── authorize.js
│   │   ├── country-scope.js
│   │   └── rate-limit.js
│   ├── permissions/      # RBAC definitions
│   ├── routes/           # API routes & proxies
│   ├── app.js            # Express app setup
│   └── server.js         # Server entry point
├── tests/
│   └── unit/             # Unit tests
├── .env.example          # Example environment config
├── package.json
└── README.md
```

## 🔐 API Documentation

### Health Check
```bash
GET /health
```

### Authentication Routes
```bash
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
```

### Protected Routes
All routes require JWT authentication via `Authorization: Bearer <token>` header.

## 🔧 Database Management

```bash
# Open Prisma Studio (GUI)
npm run prisma:studio

# Create a new migration
npm run prisma:migrate

# Reset database
npx prisma migrate reset
```

## 🚢 Deployment

### Using Docker (recommended)
```bash
docker build -t omnicore-gateway .
docker run -p 3000:3000 --env-file .env omnicore-gateway
```

### Manual Deployment
1. Set NODE_ENV=production
2. Run migrations: `npm run prisma:migrate`
3. Start server: `npm start`

## 🔄 CI/CD Pipeline

The project uses GitHub Actions for continuous integration:

- **Lint**: Code style checks
- **Test**: Unit tests with coverage
- **Security Audit**: Dependency vulnerability scanning
- **Build**: Verify application builds successfully

Pipeline runs on:
- Push to `dev` or `main` branches
- Pull requests to `main`

## 🤝 Contributing

1. Create a feature branch from `dev`
```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

2. Make your changes and commit
```bash
git add .
git commit -m "feat: your feature description"
```

3. Push to dev branch
```bash
git push origin dev
```

4. Create a Pull Request to `main` branch
   - Ensure CI passes
   - Request code review
   - Merge when approved

## 📝 Branch Strategy

- `main`: Production-ready code
- `dev`: Development branch (default)
- `feature/*`: Feature branches

## 📄 License

ISC

## 👥 Authors

- **dre7djib** - [GitHub](https://github.com/dre7djib)

## 🐛 Issues

Report issues at: https://github.com/dre7djib/omnicore-gateway/issues

## 📞 Support

For support and questions, please open an issue or contact the maintainers.

---

**Built with ❤️ for the Omnicore Platform**

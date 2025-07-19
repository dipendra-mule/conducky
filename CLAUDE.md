# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Environment

This project uses **Docker Compose** for local development. Always run commands within the containers:

```bash
# Start the full stack
docker-compose up --build -d

# Backend commands
docker-compose exec backend [command]

# Frontend commands  
docker-compose exec frontend [command]
```

## Essential Commands

### Testing
```bash
# Run all tests (from root)
npm run test:all
./scripts/run-all-tests.sh

# Backend tests
docker-compose exec backend npm test
docker-compose exec backend npm run test:coverage
docker-compose exec backend npm run test:ci

# Frontend tests
docker-compose exec frontend npm test
docker-compose exec frontend npm run test:coverage
docker-compose exec frontend npm run test:ci
```

### Building and Development
```bash
# Backend
docker-compose exec backend npm run build
docker-compose exec backend npm run type-check
docker-compose exec backend npm run dev

# Frontend
docker-compose exec frontend npm run build
docker-compose exec frontend npm run dev
```

### Database Operations
```bash
# Essential seeding (roles and logging - runs automatically on startup)
docker-compose exec backend npm run seed:roles
docker-compose exec backend npm run seed:logging

# Development seeding (includes test data)
docker-compose exec backend npm run seed
docker-compose exec backend npm run sample-data

# Prisma operations
docker-compose exec backend npx prisma generate
docker-compose exec backend npx prisma migrate dev
docker-compose exec backend npx prisma studio  # Available on localhost:5555
```

## Architecture Overview

**Conducky** is a multi-tenant Code of Conduct incident management platform for conferences and events.

### Core Architecture Principles
- **Multi-tenancy**: Organizations manage multiple events with centralized oversight
- **Event-scoped data isolation**: All incident data is strictly scoped to specific events
- **Role-based access control (RBAC)**: Unified role system with inheritance across organization/event levels
- **Mobile-first design**: Primary interface optimized for mobile incident reporting and response
- **End-to-end encryption**: AES-256-GCM encryption for all sensitive data

### Technology Stack
- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS + Shadcn/ui components
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL with comprehensive indexing and field-level encryption
- **Authentication**: Passport.js with OAuth support (Google, GitHub)

### Project Structure
```
backend/
├── src/
│   ├── config/         # Database, session, CORS, environment config
│   ├── controllers/    # Route handlers (auth, user, event, organization)
│   ├── middleware/     # Auth, RBAC, validation, security, rate limiting
│   ├── routes/         # API routes organized by feature
│   ├── services/       # Business logic (auth, event, incident, notification)
│   ├── utils/          # Helpers (encryption, audit, email, validation)
│   └── types/          # TypeScript type definitions
├── prisma/             # Database schema and seeds
└── tests/              # Unit and integration tests

frontend/
├── components/         # React components (shared, UI, feature-specific)
├── pages/             # Next.js pages and API routes
├── hooks/             # Custom React hooks
├── lib/               # Utilities (validation, logging, sanitization)
├── context/           # React context providers
└── types/             # TypeScript type definitions
```

## Key Development Patterns

### Authentication & Authorization
- Always verify user authentication before accessing protected resources
- Use `req.user` from Passport.js session middleware
- Implement event-scoped authorization checks in middleware
- SuperAdmins cannot access event data without explicit event roles

### Database & Security
- All queries must be event-scoped when dealing with event data
- Use Prisma ORM with TypeScript for type safety
- Sensitive data (incidents, comments, emails) is automatically encrypted
- Required environment variable: `ENCRYPTION_KEY` (minimum 32 characters)

### API Development
- Routes are organized by feature area (auth, events, organizations, etc.)
- Use consistent error response format across all endpoints
- Implement proper request validation using express-validator
- Add audit logging for security-critical actions using `logAudit` helper

### Frontend Patterns
- Use Shadcn/ui components exclusively before creating custom components
- Implement proper loading and error states for all async operations
- Mobile-first responsive design with Tailwind CSS
- Use React Context for global state (user, modal, navigation)

## Security Requirements

### Field-Level Encryption
All sensitive data is automatically encrypted using AES-256-GCM:
- Incident descriptions, parties involved, locations
- All incident comments and communication
- Event contact emails and configuration
- OAuth credentials and SMTP passwords

### Access Control
- Role-based permissions at UI and API levels
- Event data isolation between different events
- Rate limiting on authentication endpoints
- Comprehensive audit logging for administrative actions

### Data Validation
- Client and server-side input validation
- XSS prevention with DOMPurify sanitization
- SQL injection prevention via parameterized queries
- Secure session management with HTTP-only cookies

## Testing Guidelines

### Test Requirements
- All new features require automated tests (unit, integration, or both)
- All new API endpoints must include test coverage
- Bug fixes should include regression tests
- Tests must pass before features are considered complete

### Test Commands
```bash
# Run all tests locally before pushing
npm run test:all

# Individual test suites with coverage
docker-compose exec backend npm run test:coverage
docker-compose exec frontend npm run test:coverage
```

### CI/CD
- GitHub Actions runs tests on all PRs and pushes to main
- CTRF test reporting provides detailed test results in PRs
- Codecov integration tracks test coverage for both frontend and backend

## Important Notes

- Never commit secrets or API keys to version control
- Use `.env` files for local development configuration
- System settings (email, OAuth) are managed through the admin UI and stored encrypted in the database
- Always test mobile responsiveness - this is a mobile-first application
- Document complex business logic and any new testing procedures
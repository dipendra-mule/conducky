---
sidebar_position: 1
---

# Testing Overview

This guide explains how to set up, run, and write automated tests for the backend and frontend of Conducky. Our testing strategy ensures code quality, prevents regressions, and maintains system reliability.

## 🏗️ Testing Architecture

Conducky uses a comprehensive testing approach with multiple layers:

- **Unit Tests** - Individual component and function testing
- **Integration Tests** - Component interaction and API testing  
- **End-to-End Tests** - Full user workflow testing
- **Security Testing** - Authentication, authorization, and input validation
- **Performance Testing** - Load testing and optimization validation

## 🔧 Testing Stack

### Frontend Testing
- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **jsdom** - DOM simulation for browser environment
- **Coverage** - Code coverage reporting with thresholds

### Backend Testing  
- **Jest** - Test runner and assertion library
- **Supertest** - HTTP assertion library for API testing
- **Prisma Test Environment** - Isolated database testing
- **Coverage** - Code coverage with detailed reporting

## 🚀 Quick Start

### Run All Tests
```bash
# Run all tests (backend + frontend)
npm run test:all

# Run backend tests only
cd backend && npm test

# Run frontend tests only  
cd frontend && npm test
```

### Run Tests with Coverage
```bash
# Backend coverage
cd backend && npm run test:coverage

# Frontend coverage
cd frontend && npm run test:coverage
```

### Run Tests in Docker
```bash
# Backend tests in Docker
docker compose run --rm backend npm test

# Frontend tests in Docker
docker compose run --rm frontend npm test
```

## 📊 Coverage Requirements

Our projects maintain high code coverage standards:

- **Backend**: Minimum 80% coverage across all metrics
- **Frontend**: Minimum 75% coverage for critical components
- **Integration**: All API endpoints must have test coverage
- **Critical Paths**: 100% coverage for security and data handling

## 🔒 Security Testing

Security testing is integrated throughout our testing strategy:

### Rate Limiting
- **Production**: Rate limiting active and enforced
- **Development**: Rate limiting disabled for rapid testing
- **Test**: Rate limiting disabled for automated testing

### Security Middleware
- **Security Headers**: CSP, HSTS, frame protection, XSS protection
- **Input Validation**: Server-side validation with sanitization  
- **Input Security Scanning**: XSS, SQL injection, path traversal detection
- **File Upload Security**: Size limits, type validation, rate limiting

## 🌍 Environment Configuration

Tests automatically adapt to different environments:

```javascript
// Rate limiting disabled in test/development
const isTestOrDev = process.env.NODE_ENV === 'test' || 
                   process.env.NODE_ENV === 'development' || 
                   !process.env.NODE_ENV;
```

## 🔄 Continuous Integration

All tests run automatically in GitHub Actions:

- **Pull Requests**: Full test suite runs on every PR
- **Main Branch**: Tests run on every push to main
- **Parallel Execution**: Backend and frontend tests run simultaneously
- **Coverage Reports**: Available as workflow artifacts
- **Blocking**: Failed tests prevent PR merging

## 📁 Test Organization

### Frontend Structure (Hybrid Approach)
```
frontend/
├── __tests__/          # Integration & higher-level tests
├── components/
│   └── Button.test.tsx # Colocated unit tests
└── pages/
    └── login.test.tsx  # Colocated page tests
```

### Backend Structure
```
backend/
├── tests/
│   ├── unit/           # Unit tests
│   ├── integration/    # API integration tests
│   └── services/       # Service layer tests
└── src/
    └── services/
        └── *.test.ts   # Colocated service tests
```

## 🎯 Testing Best Practices

1. **Write Tests First**: TDD approach for critical functionality
2. **Test Behavior**: Focus on what the code does, not how it does it
3. **Isolate Tests**: Each test should be independent and idempotent
4. **Mock External Dependencies**: Use mocks for databases, APIs, and services
5. **Descriptive Names**: Test names should clearly describe what is being tested
6. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification

## 🚨 Common Issues & Solutions

### OAuth Testing
- **Issue**: Browser remembers OAuth consent
- **Solution**: Revoke app access in Google/GitHub settings

### Database State
- **Issue**: Tests interfere with each other
- **Solution**: Use database cleanup scripts between tests

### Rate Limiting
- **Issue**: Tests fail due to rate limits
- **Solution**: Ensure `NODE_ENV=test` is set

## 📚 Next Steps

Choose the testing area you need help with:

- **[Frontend Testing](./frontend-testing)** - Testing React components and pages
- **Unit Testing** - Testing individual components and functions
- **Integration Testing** - Testing component interactions
- **Security Testing** - Authentication and authorization testing
- **Performance Testing** - Load testing and optimization 
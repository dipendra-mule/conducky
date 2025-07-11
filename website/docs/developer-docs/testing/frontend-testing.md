---
sidebar_position: 2
---

# Frontend Testing

Frontend testing in Conducky uses Jest and React Testing Library to ensure component functionality, user interactions, and UI behavior work correctly across different scenarios.

## 🏗️ Testing Structure (Hybrid Approach)

Our frontend follows a hybrid testing organization:

- **Unit/Component Tests**: Colocated next to components (e.g., `components/Button.test.tsx`)
- **Integration Tests**: Central directory `frontend/__tests__/` for multi-component flows
- **Page Tests**: Colocated with pages (e.g., `pages/login.test.tsx`)

```
frontend/
├── __tests__/                    # Integration & higher-level tests
│   ├── components/
│   │   └── audit/
│   │       └── AuditLogTable.test.tsx
│   ├── lib/
│   │   └── audit.test.ts
│   └── pages/
│       ├── dashboard.test.tsx
│       ├── login.test.tsx
│       └── profile.test.tsx
├── components/
│   ├── Button.test.tsx          # Colocated unit tests
│   ├── MobileQuickActions.test.tsx
│   └── tags/
│       └── TagSelector.test.tsx
└── pages/
    └── [component].test.tsx     # Colocated page tests
```

## 🔧 Testing Stack

- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities focused on user behavior
- **jsdom** - DOM simulation for browser environment
- **@testing-library/jest-dom** - Custom Jest matchers for DOM elements
- **@testing-library/user-event** - User interaction simulation

## 🚀 Running Frontend Tests

### Prerequisites
```bash
# Install dependencies
cd frontend && npm install
```

### Basic Test Commands
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="Comment"
```

### Docker Testing
```bash
# Run tests in Docker container
docker compose run --rm frontend npm test

# Run with coverage in Docker
docker compose run --rm frontend npm run test:coverage
```

## ✍️ Writing Frontend Tests

### Component Testing Example

```typescript
// components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button Component', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies correct CSS classes', () => {
    render(<Button variant="primary">Primary Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');
  });
});
```

### Page Testing Example

```typescript
// pages/login.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './login';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/login',
  }),
}));

describe('Login Page', () => {
  test('renders login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });
});
```

### Integration Testing Example

```typescript
// __tests__/components/incident-detail/CommentsSection.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentsSection from '../../../components/incident-detail/CommentsSection';

// Mock API calls
jest.mock('../../../lib/api', () => ({
  fetchComments: jest.fn(),
  createComment: jest.fn(),
}));

describe('CommentsSection Integration', () => {
  test('loads and displays comments', async () => {
    const mockComments = [
      { id: 1, body: 'Test comment', author: 'John Doe', visibility: 'public' }
    ];
    
    require('../../../lib/api').fetchComments.mockResolvedValue(mockComments);
    
    render(<CommentsSection incidentId="123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test comment')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  test('creates new comment', async () => {
    const user = userEvent.setup();
    const mockCreate = require('../../../lib/api').createComment;
    mockCreate.mockResolvedValue({ id: 2, body: 'New comment' });
    
    render(<CommentsSection incidentId="123" />);
    
    await user.type(screen.getByLabelText(/comment/i), 'New comment');
    await user.click(screen.getByRole('button', { name: /post comment/i }));
    
    expect(mockCreate).toHaveBeenCalledWith('123', { body: 'New comment' });
  });
});
```

## 📊 Coverage Reports

### Viewing Coverage
```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage Thresholds
Our frontend maintains these coverage standards:
- **Statements**: 75%
- **Branches**: 70%
- **Functions**: 75%
- **Lines**: 75%

### Critical Components (100% Coverage Required)
- Authentication components
- Security-related utilities
- Data validation functions
- Error boundary components

## 🎯 Testing Best Practices

### 1. Test User Behavior, Not Implementation
```typescript
// ❌ Testing implementation details
expect(component.state.isLoading).toBe(true);

// ✅ Testing user-visible behavior
expect(screen.getByText('Loading...')).toBeInTheDocument();
```

### 2. Use Semantic Queries
```typescript
// ✅ Prefer accessible queries
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email address/i)
screen.getByText(/welcome back/i)

// ❌ Avoid implementation-specific queries
screen.getByTestId('submit-btn')
screen.getByClassName('email-input')
```

### 3. Mock External Dependencies
```typescript
// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/current-path',
  }),
}));

// Mock API calls
jest.mock('../lib/api', () => ({
  fetchData: jest.fn(),
}));
```

### 4. Test Accessibility
```typescript
test('form is accessible', () => {
  render(<ContactForm />);
  
  // Check for proper labels
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  
  // Check for error announcements
  expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
  
  // Check keyboard navigation
  expect(screen.getByRole('button')).toHaveFocus();
});
```

## 🚨 Common Issues & Solutions

### Issue: Tests Fail Due to Missing Router Context
```typescript
// Solution: Mock useRouter
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/test',
    query: {},
  }),
}));
```

### Issue: Async State Updates
```typescript
// Solution: Use waitFor for async updates
await waitFor(() => {
  expect(screen.getByText('Success!')).toBeInTheDocument();
});
```

### Issue: Form Validation Not Triggering
```typescript
// Solution: Use userEvent for realistic interactions
const user = userEvent.setup();
await user.type(input, 'test@example.com');
await user.click(submitButton);
```

## 🔍 Debugging Tests

### Debug Rendered Output
```typescript
import { render, screen } from '@testing-library/react';
import { debug } from '@testing-library/react';

test('debug example', () => {
  render(<MyComponent />);
  
  // Print current DOM state
  screen.debug();
  
  // Print specific element
  screen.debug(screen.getByRole('button'));
});
```

### Verbose Test Output
```bash
# Run with verbose logging
npm test -- --verbose

# Run with additional debugging
npm test -- --verbose --no-cache
``` 
---
applyTo: '**'
---
## Project Context Rules

Development environment is in `docker compose`. Run all commands for the backend of frontend using `docker compose`. Do not remove any volumes from the docker compose environment without consulting the user.

### Core Principles
- This is a code of conduct incident management system for conferences and events
- Mobile-first design is critical - most reporters and responders use mobile devices
- Multi-tenancy with event-scoped data isolation is fundamental to the architecture
- Role-based access control must be enforced at all levels (UI, API, database)

### Technology Stack Requirements
- Frontend: Next.js 14, React, TypeScript, Tailwind CSS, Shadcn/ui components
- Backend: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL
- Always use TypeScript with strict mode enabled
- Use Shadcn/ui components when available before creating custom components
- when installing a missing Shadcn/ui component, install with the command line
- Follow existing patterns in the codebase for consistency

## Code Style and Patterns

### General Code Style
- Use meaningful variable names that describe the data or function purpose
- Prefer const over let, avoid var completely
- Use arrow functions for component definitions and event handlers
- Keep functions small and focused on a single responsibility
- Add JSDoc comments for complex functions and API endpoints

### React/Next.js Patterns
- Use functional components with hooks, not class components
- Implement proper error boundaries for user-facing errors
- Use React.memo() for components that receive the same props frequently
- Prefer custom hooks for complex state logic
- Use proper TypeScript interfaces for all props and state

### CSS/Styling Rules
- Use Tailwind CSS classes exclusively, avoid custom CSS unless absolutely necessary
- Follow mobile-first responsive design: write mobile styles first, then add larger breakpoints
- Use semantic HTML elements (article, section, nav, etc.) for accessibility
- Ensure color contrast meets WCAG AA standards
- Use proper focus indicators for keyboard navigation

### API Development
- All API routes must include proper authentication and authorization
- Use consistent error response format across all endpoints
- Implement proper request validation using middleware
- Return appropriate HTTP status codes
- Add request logging for debugging and audit purposes

## Database and Security Rules

### Database Patterns
- All queries must be event-scoped when dealing with event data
- Use parameterized queries to prevent SQL injection
- Implement proper database indexes for performance
- Use database transactions for multi-table operations
- Add proper foreign key constraints and cascade rules

### Security Requirements
- Never expose user passwords or tokens in API responses
- Validate all user input on both client and server sides
- Implement rate limiting on authentication endpoints
- Use HTTPS in production, secure headers
- Log security-related events for audit purposes

### Role-Based Access Control
- Always check user permissions before returning data or allowing actions
- Use middleware to enforce role-based access at the API level
- Implement UI-level permission checks to hide unauthorized actions
- SuperAdmins cannot access event data without explicit event roles
- Event data must be isolated between different events

## Mobile-First Development

### Responsive Design Rules
- Write mobile styles first, then enhance for larger screens
- Use CSS Grid and Flexbox for layouts, avoid fixed positioning
- Ensure touch targets are minimum 44px for mobile usability
- Test on actual mobile devices, not just browser dev tools
- Implement proper mobile navigation patterns (bottom tabs, hamburger menus)

### Mobile-Specific Features
- Add pull-to-refresh functionality on list views
- Implement swipe gestures for common actions
- Use appropriate input types for mobile keyboards (tel, email, etc.)
- Add haptic feedback for important actions where supported
- Optimize images and assets for mobile network conditions

### Performance on Mobile
- Lazy load images and non-critical content
- Minimize JavaScript bundle size
- Use proper caching strategies for API responses
- Implement proper loading states to prevent user confusion
- Avoid blocking the main thread with heavy computations

## Component Development

### Component Architecture
- Create reusable components in /components/shared directory
- Use composition over inheritance for component relationships
- Implement proper prop validation with TypeScript interfaces
- Create custom hooks for shared logic between components
- Use proper component naming conventions (PascalCase for components)

### Accessibility Requirements
- Add proper ARIA labels and roles for screen readers
- Implement keyboard navigation for all interactive elements
- Use semantic HTML structure with proper heading hierarchy
- Ensure all form inputs have associated labels
- Test with screen readers and keyboard-only navigation

### Error Handling
- Implement proper error boundaries for component trees
- Show user-friendly error messages, not technical details
- Provide clear actions users can take to resolve errors
- Log detailed error information for debugging
- Use loading states to prevent user confusion during async operations

### Code Quality Standards
- Use ESLint and Prettier for consistent code formatting
- Remove console.log statements before committing code
- Use proper TypeScript types, avoid 'any' type
- Document complex business logic with clear comments
- Refactor duplicate code into reusable functions or components

## File and Folder Organization

### Project Structure
- Group related files in feature-based directories
- Keep components, hooks, and utilities in appropriate directories
- Use index.ts files for clean imports
- Separate API routes by feature/resource
- Keep types and interfaces in dedicated files

### Naming Conventions
- Use kebab-case for file names and URLs
- Use PascalCase for React components and TypeScript interfaces
- Use camelCase for variables, functions, and object properties
- Use UPPER_CASE for constants and environment variables
- Use descriptive names that explain the purpose

## Specific Implementation Guidelines

### Authentication and Authorization
- Always verify user authentication before accessing protected resources
- Implement proper session management with secure tokens
- Use middleware for consistent authentication across API routes
- Provide clear feedback for authentication failures
- Implement proper logout functionality that clears all session data

### Form Handling
- Use controlled components for all form inputs
- Implement proper form validation with clear error messages
- Show loading states during form submission
- Prevent multiple submissions of the same form
- Use proper input types for better mobile experience

### Data Fetching and State Management
- Use React Query or SWR for server state management
- Implement proper loading and error states for async operations
- Cache API responses appropriately to reduce server load
- Use optimistic updates for better user experience
- Handle network errors gracefully with retry mechanisms

### Event and Report Management
- Always scope data operations to the correct event
- Implement proper permission checks for report access
- Use proper state management for report workflow
- Add audit logging for all report-related actions
- Ensure data privacy between different events


Remember: This is a safety-critical application dealing with incident reporting. Always prioritize security, accessibility, and user experience over development speed.
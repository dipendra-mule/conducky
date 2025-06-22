# Roles Refactor Analysis - Issue #292

## Problem Statement
Currently, roles that are event related (Event Admin, Responder, and Reporter) are handled in one RBAC middleware and data model, but the Org level roles (org admin and org viewer) are done elsewhere. SuperAdmin is handled in the event specific role construction which means we end up doing a lot of overrides. We should investigate how to collapse this into one main RBAC middleware and data approach for safety and simplicity.

We also should rename the "Super Admin" role to "System Admin" to be more clear.

## Current State Analysis

### Database Schema (Prisma)

#### Event-Related Roles
- **Table**: `Role` (stores role definitions)
- **Junction Table**: `UserEventRole` (links users to roles for specific events)
- **Roles**: Reporter, Responder, Event Admin, SuperAdmin
- **Key Issue**: SuperAdmin is stored as a global role but checked through event-specific junction table

#### Organization-Related Roles  
- **Enum**: `OrganizationRole` (org_admin, org_viewer)
- **Junction Table**: `OrganizationMembership` (links users to organizations with roles)
- **No shared table** with event roles

### Backend RBAC Implementation

#### Event Roles (`backend/src/utils/rbac.ts`)
```typescript
// Main RBAC functions
- requireRole(allowedRoles: RoleName[])  // Event-specific role checking
- requireSuperAdmin()                    // Global SuperAdmin checking

// Process:
1. Checks UserEventRole table
2. SuperAdmin can access anything (global override)
3. Event-specific roles checked against eventId
4. Complex logic for eventId extraction from params/slug
```

#### Organization Roles (`backend/src/services/organization.service.ts`)
```typescript
// Separate implementation
- hasOrganizationRole(userId, organizationId, requiredRole?)
  
// Process:
1. Checks OrganizationMembership table
2. org_admin has higher privileges than org_viewer
3. Completely separate from event role system
```

#### SuperAdmin Handling Issues
- **Event RBAC**: Checks all UserEventRole records for SuperAdmin role
- **Organization controllers**: Separate `isSuperAdmin()` function in controllers
- **Inconsistent approach**: Multiple ways to check SuperAdmin status

### Frontend Role Usage

#### Event Roles
- Checked via `user.roles?.includes('SuperAdmin')`
- Role hierarchy: `['SuperAdmin', 'Admin', 'Responder', 'Reporter']`
- Multiple role checks throughout components

#### Organization Roles  
- Checked via direct role comparison: `userOrgRole === 'org_admin'`
- Role display: `{org.role === 'org_admin' ? 'Admin' : 'Viewer'}`

### Key Problems Identified

1. **Dual Role Systems**: Two completely separate role checking mechanisms
2. **SuperAdmin Inconsistency**: 
   - Stored in event role table but used globally
   - Multiple checking functions (`requireSuperAdmin()`, `isSuperAdmin()`)
   - Overrides needed everywhere
3. **Code Duplication**: Similar role checking logic implemented twice
4. **Complexity**: Developers need to understand two different systems
5. **Security Risk**: Easy to miss role checks or use wrong system
6. **Naming Confusion**: "SuperAdmin" vs "System Admin"

## Proposed Solution

### 1. Unified Role System Design

#### New Database Schema
```sql
-- New unified roles table
CREATE TABLE unified_roles (
  id UUID PRIMARY KEY,
  name VARCHAR UNIQUE,  -- 'system_admin', 'org_admin', 'org_viewer', 'event_admin', 'responder', 'reporter'
  scope VARCHAR,        -- 'system', 'organization', 'event'
  level INTEGER,        -- Hierarchy level (higher = more permissions)
  description TEXT
);

-- New unified user roles table  
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  role_id UUID REFERENCES unified_roles(id),
  scope_type VARCHAR,   -- 'system', 'organization', 'event'
  scope_id UUID,        -- NULL for system, org_id for org, event_id for event
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP,
  expires_at TIMESTAMP, -- Optional expiration
  UNIQUE(user_id, role_id, scope_type, scope_id)
);
```

#### Role Hierarchy
```
System Level (scope_id = NULL):
- system_admin (level 100) - Replaces SuperAdmin, NO automatic access to orgs/events

Organization Level (scope_id = organization_id):  
- org_admin (level 50) - Also grants event_admin on org's events
- org_viewer (level 10)

Event Level (scope_id = event_id):
- event_admin (level 40) 
- responder (level 20)
- reporter (level 5)
```

### 2. Unified RBAC Middleware

#### New Middleware Design
```typescript
// Single unified role checking function
function requireUnifiedRole(options: {
  roles?: string[],           // Required role names
  scope?: 'system' | 'organization' | 'event',
  minLevel?: number,          // Minimum hierarchy level
  inheritanceRules?: boolean  // Allow higher scopes to inherit lower scope access
}) {
  // Implementation handles all role types uniformly
}

// Specific convenience functions
function requireSystemAdmin() // system_admin role
function requireOrgRole(roles: string[], orgId?: string)
function requireEventRole(roles: string[], eventId?: string)
```

### 3. Migration Strategy

#### Phase 1: Preparation
- [ ] Create new unified schema alongside existing
- [ ] Create migration scripts to populate unified tables
- [ ] Create unified RBAC service with backward compatibility

#### Phase 2: Backend Migration  
- [ ] Update all controllers to use unified RBAC
- [ ] Replace organization role checking
- [ ] Replace event role checking  
- [ ] Add comprehensive tests

#### Phase 3: Frontend Migration
- [ ] Update all role checking logic
- [ ] Standardize role display components
- [ ] Update navigation logic

#### Phase 4: Cleanup
- [ ] Remove old role tables and code
- [ ] Update documentation
- [ ] Final testing

## Implementation Plan for This Session

### Immediate Goals (This Session)
1. **Create unified role schema** - New Prisma models
2. **Implement unified RBAC service** - Core role checking logic
3. **Create migration scripts** - Populate new tables from existing data
4. **Update key controllers** - Start with organization controllers
5. **Basic testing** - Ensure new system works

### Out of Scope (Future Work)
- Complete frontend migration
- Removal of old schema
- Advanced features (role expiration, audit trails)

## Questions for User

1. **Role Inheritance**: Should system_admin automatically have access to all organizations and events, or require explicit assignment?
   **DECISION**: System Admin should NOT have access by default. Temporarily will have org_admin rights on all orgs until we fix the creation flow.

2. **Migration Approach**: Should we maintain backward compatibility during migration, or do a complete cutover?
   **DECISION**: Complete cutover with proper database migrations.

3. **Role Naming**: Confirm the new role names:
   - SuperAdmin → system_admin ✅
   - Event Admin → event_admin ✅  
   - org_admin → org_admin (keep same) ✅
   - org_viewer → org_viewer (keep same) ✅
   - Responder → responder ✅
   - Reporter → reporter ✅

4. **Scope Inheritance**: Should org_admin automatically have event_admin access for events in their organization?
   **DECISION**: YES - org_admin should have event_admin rights on events in their org.

5. **Priority**: Which controllers/routes should we migrate first for maximum impact?
   **DECISION**: Fix everything in this session, complete cutover approach.

## Updated Role Hierarchy
```
System Level (scope_id = NULL):
- system_admin (level 100) - Replaces SuperAdmin, NO automatic access to orgs/events

Organization Level (scope_id = organization_id):  
- org_admin (level 50) - Also grants event_admin on org's events
- org_viewer (level 10)

Event Level (scope_id = event_id):
- event_admin (level 40) 
- responder (level 20)
- reporter (level 5)
```

## Implementation Status

### ✅ Completed
- [x] Analysis of current role systems
- [x] Identification of key problems  
- [x] Design of unified solution
- [x] User decisions collected
- [x] Updated implementation plan

### 🚧 In Progress
- [ ] Schema design and migration
- [ ] RBAC service implementation
- [ ] Controller updates
- [ ] Testing

### ⏳ Next Steps
1. Create new Prisma schema models
2. Create database migration
3. Implement unified RBAC service
4. Update all controllers
5. Test the complete system (this should include running all tests in the backend and frontend; run `npm run test` in both the backend and frontend directories)
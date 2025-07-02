# Report to Incident Terminology Refactor - Implementation Plan

## Overview
This document outlines the comprehensive plan to refactor all references from "report" to "incident" throughout the Conducky codebase. This addresses GitHub Issue #284 to prevent confusion between incident reports and actual metrics/activity reports.

## Scope Analysis
Based on codebase analysis, this refactor affects:
- 🗄️ **Database Schema**: 6 models, 4 enums, multiple relations
- 🔧 **Backend**: 13 routes, 5 services, 25+ API endpoints  
- 🎨 **Frontend**: 50+ components, 20+ pages, 122+ files with "report" references
- 🧪 **Tests**: 25 test suites with 291 tests
- 📚 **Documentation**: API docs, user guides, developer docs

## Implementation Strategy

### Phase 1: Database Schema Migration
**Duration**: 1-2 hours
**Risk**: HIGH - affects data integrity

#### 1.1 Prisma Schema Updates
```prisma
// Current → New
model Report → model Incident
enum ReportType → enum IncidentType  
enum ReportState → enum IncidentState
enum ReportSeverity → enum IncidentSeverity
model ReportComment → model IncidentComment
```

#### 1.2 Database Migration Script
- Rename tables: `Report` → `Incident`, `ReportComment` → `IncidentComment`
- Rename columns: `reportId` → `incidentId`, `reporterId` → `reporterId` (keep as-is, refers to person)
- Update enum values and references
- Update foreign key constraints
- Update indexes

#### 1.3 Relation Updates
- User relations: `reports` → `incidents`
- Event relations: `reports` → `incidents`  
- Notification relations: `reportId` → `incidentId`

### Phase 2: Backend API Refactor
**Duration**: 2-3 hours
**Risk**: MEDIUM - breaks API contracts

#### 2.1 File Renames
```
src/routes/report.routes.ts → incident.routes.ts
src/services/report.service.ts → incident.service.ts
tests/integration/*report*.test.js → *incident*.test.js
```

#### 2.2 API Endpoint Changes
```
/api/reports/* → /api/incidents/*
/api/reports/:reportId/evidence → /api/incidents/:incidentId/evidence
GET /api/events/:eventId/reports → /api/events/:eventId/incidents
POST /api/events/:eventId/reports → /api/events/:eventId/incidents
```

#### 2.3 Service Method Renames
```typescript
// ReportService → IncidentService
createReport() → createIncident()
getReportById() → getIncidentById()
updateReportState() → updateIncidentState()
getReportsForEvent() → getIncidentsForEvent()
```

#### 2.4 Type Definitions
```typescript
// types/index.ts updates
interface Report → interface Incident
type ReportState → type IncidentState
type ReportType → type IncidentType
```

#### 2.5 Notification System Updates
```typescript
// Update notification types
'report_submitted' → 'incident_submitted'
'report_assigned' → 'incident_assigned'  
'report_status_changed' → 'incident_status_changed'
'report_comment_added' → 'incident_comment_added'
```

### Phase 3: Frontend Refactor  
**Duration**: 3-4 hours
**Risk**: MEDIUM - affects user experience

#### 3.1 Component Renames
```
components/ReportForm.tsx → IncidentForm.tsx
components/ReportDetailView.tsx → IncidentDetailView.tsx
components/report-detail/ → incident-detail/
components/reports/ → incidents/
```

#### 3.2 Page Structure Updates
```
pages/events/[eventSlug]/reports/ → incidents/
pages/events/[eventSlug]/my-reports.tsx → my-incidents.tsx
pages/dashboard/reports.tsx → incidents.tsx
```

#### 3.3 API Client Updates
Update all fetch calls to use new endpoints:
```typescript
// API calls throughout frontend
fetch('/api/reports/...') → fetch('/api/incidents/...')
```

#### 3.4 State Management
```typescript
// State variables and hooks
const [reports, setReports] → [incidents, setIncidents]
const [selectedReport] → [selectedIncident]
useReports() → useIncidents()
```

#### 3.5 UI Text Updates
- Form labels: "Submit Report" → "Submit Incident"
- Page titles: "Reports" → "Incidents"  
- Button text: "View Reports" → "View Incidents"
- Navigation items: "Reports" → "Incidents"

### Phase 4: Test Updates
**Duration**: 1-2 hours  
**Risk**: LOW - maintains test coverage

#### 4.1 Test File Renames
```
tests/integration/report-*.test.js → incident-*.test.js
tests/integration/cross-event-reports.test.js → cross-event-incidents.test.js
```

#### 4.2 Test Content Updates
- Update test descriptions and assertions
- Update API endpoint calls in tests
- Update mock data variable names
- Update expected response structures

### Phase 5: Documentation Updates
**Duration**: 1 hour
**Risk**: LOW - documentation sync

#### 5.1 API Documentation
```
website/docs/api/create-a-new-report.api.mdx → create-a-new-incident.api.mdx
website/docs/api/get-reports.api.mdx → get-incidents.api.mdx
```

#### 5.2 User Guide Updates
- Update user-facing terminology
- Update screenshot if needed
- Update workflow descriptions

#### 5.3 Developer Documentation
- Update API endpoint references
- Update code examples
- Update architecture diagrams

## Detailed File Inventory

### Critical Files Requiring Changes

#### Backend Core Files
- `backend/prisma/schema.prisma` - Database models and enums
- `backend/src/routes/report.routes.ts` - API routes
- `backend/src/services/report.service.ts` - Business logic
- `backend/index.ts` - Route registration
- `backend/src/utils/notifications.ts` - Notification system
- `backend/src/config/swagger.ts` - API documentation

#### Frontend Core Files  
- `frontend/components/ReportForm.tsx` - Main form component
- `frontend/components/ReportDetailView.tsx` - Detail view component
- `frontend/components/report-detail/` - Detail components directory
- `frontend/pages/events/[eventSlug]/reports/` - Report pages directory
- `frontend/pages/dashboard/reports.tsx` - Dashboard page

#### Test Files (25+ files)
- All integration tests in `backend/tests/integration/`
- Frontend component tests
- API endpoint tests

## Migration Checklist

### Pre-Migration
- [ ] Backup production database
- [ ] Run full test suite (baseline)
- [ ] Create migration rollback plan
- [ ] Coordinate with team on deployment window

### Phase 1: Database
- [ ] Update Prisma schema
- [ ] Generate and review migration
- [ ] Test migration on development database
- [ ] Update backend code to use new models
- [ ] Run backend tests

### Phase 2: Backend API
- [ ] Rename route files and update imports
- [ ] Update service classes and methods
- [ ] Update API endpoint definitions
- [ ] Update notification system
- [ ] Update type definitions
- [ ] Run backend tests
- [ ] Test API endpoints manually

### Phase 3: Frontend
- [ ] Rename component files and directories
- [ ] Update component imports throughout codebase
- [ ] Update page routes and navigation
- [ ] Update API client calls
- [ ] Update state management
- [ ] Update UI text and labels
- [ ] Run frontend tests (after fixing setup issues)
- [ ] Manual testing of key user flows

### Phase 4: Tests
- [ ] Rename test files
- [ ] Update test content and assertions
- [ ] Update mock data
- [ ] Run full test suite
- [ ] Verify test coverage maintained

### Phase 5: Documentation
- [ ] Update API documentation files
- [ ] Update user guides
- [ ] Update developer documentation
- [ ] Update README files if needed

### Post-Migration
- [ ] Full system integration testing
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Deploy to staging environment
- [ ] Final production deployment
- [ ] Monitor for issues

## Risk Mitigation

### High Risk Items
1. **Database Migration**: Test thoroughly in development first
2. **API Breaking Changes**: Coordinate frontend/backend deployment
3. **User Experience**: Ensure all UI text is updated consistently

### Rollback Plan
1. Database: Keep migration rollback scripts ready
2. Code: Use feature branch with ability to revert
3. API: Maintain backward compatibility if possible during transition

## Testing Strategy

### Automated Testing
- All existing tests should pass with new terminology
- Add tests for any new validation logic
- Test database migration on copy of production data

### Manual Testing  
- Complete user journey testing
- Test all major workflows (submit incident, view incidents, etc.)
- Test role-based access control
- Test notification system

## Estimated Timeline
- **Total Duration**: 7-10 hours
- **Complexity**: HIGH due to scope
- **Recommended Approach**: Complete in single session to avoid inconsistent state

## Success Criteria
1. ✅ All tests pass with new terminology
2. ✅ No broken links or 404 errors
3. ✅ All UI text uses "incident" terminology
4. ✅ Database migration completes successfully
5. ✅ API endpoints work with new paths
6. ✅ User workflows function identically to before
7. ✅ Documentation reflects new terminology

## Notes
- This is a large refactor touching 100+ files
- Consider breaking into smaller, coordinated deployments if needed
- Maintain consistent terminology throughout (avoid mixing "report" and "incident")
- Update any hardcoded strings in configuration files
- Consider search/replace operations for efficiency, but validate each change 
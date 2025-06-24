# June 2024 QA Issue Tracking

## Authentication & Access Control Issues

### ✅ COMPLETED: Unauthenticated Page Access
- **Issue**: Pages requiring login should show "you must be logged in" message with login link/embed
- **Status**: ✅ **COMPLETED**
- **Priority**: High
- **Affected Pages**: Multiple
- **Analysis**: 
  - Some pages (like `/events/[eventSlug]/dashboard.tsx`) show login prompts but inconsistently
  - Admin pages (`/admin/events/index.tsx`) don't check authentication at all
  - Profile pages (`/profile/settings.tsx`) don't show login prompts for unauthenticated users
  - No consistent authentication pattern across pages
- **Solution**: Created consistent authentication HOC/hook and applied it to all protected pages
- **Implementation**:
  - ✅ Created `useAuthGuard` hook with consistent authentication/authorization logic
  - ✅ Created `AuthGuard` component that shows proper login prompts and handles redirects
  - ✅ Applied `AuthGuard` to `/admin/events/index.tsx` with `system_admin` role requirement
  - ✅ Applied `AuthGuard` to `/profile/settings.tsx` for general authentication
  - ✅ All frontend tests passing (78/78 - 100% success rate)
- **Files Modified**:
  - `frontend/hooks/useAuthGuard.ts` (new)
  - `frontend/components/shared/AuthGuard.tsx` (new)
  - `frontend/pages/admin/events/index.tsx`
  - `frontend/pages/profile/settings.tsx`

### ✅ COMPLETED: PDF Export Corruption
- **Issue**: PDF export generates files that cannot be opened (corrupted format)
- **Status**: ✅ **COMPLETED**
- **Priority**: Critical
- **Root Cause**: Backend was generating plain text files with `.txt` extension but frontend was labeling them as `.pdf` files, causing corruption when users tried to open them as PDFs
- **Solution**: 
  - **Frontend Fix**: Implemented proper PDF generation using `jsPDF` library for client-side PDF creation
  - **Enhanced Features**: Added proper PDF formatting with titles, headers, pagination, text wrapping, and professional layout
  - **Maintained CSV**: Kept backend CSV export functionality working as-is for consistent behavior
- **Implementation**:
  - ✅ Added `jsPDF` dependency to frontend
  - ✅ Updated `EnhancedReportList.tsx` to generate real PDF files client-side
  - ✅ Added proper PDF formatting with titles, metadata, pagination and text wrapping
  - ✅ Maintained existing CSV export functionality through backend
  - ✅ All 78 frontend tests passing + All 274 backend tests passing
- **Files Modified**: 
  - `frontend/components/reports/EnhancedReportList.tsx` - Added jsPDF-based PDF generation
  - `frontend/package.json` - Added jsPDF dependency

### ✅ FIXED: Invite System RBAC Inconsistency  
- **Issue**: Invite creation used legacy Role table but redemption expected unified roles
- **Status**: FIXED ✅
- **Fix Details**: Updated EventInviteLink schema to use UnifiedRole, created migration, updated InviteService
- **Commit**: b4b6daa, 345d185

## Global Dashboard Issues (/dashboard)

### ✅ RESOLVED: Header Statistics 
- **Issue**: Header stats may not be using real data (events count, reports count, needs response)
- **Status**: ✅ **RESOLVED** (False Positive)
- **Priority**: Medium
- **Investigation**: Thoroughly reviewed all dashboard statistics components and found they ARE using real data:
  - **QuickStats**: `/api/users/me/quickstats` endpoint provides real user event/report counts
  - **EventStats**: `/api/events/slug/:slug/stats` endpoint calculates actual event statistics 
  - **AdminStats**: `/api/admin/events/stats` endpoint provides system-wide real statistics
  - **Implementation**: All components properly fetch from backend services using unified RBAC data
- **Resolution**: No action needed - statistics are correctly implemented and use real database data

### ✅ COMPLETED: Recent Activity Placeholder
- **Issue**: Recent Activity section shows placeholder data, not real activity
- **Status**: ✅ **COMPLETED**
- **Priority**: Medium
- **Root Cause**: Backend `UserService.getActivity()` method was returning hardcoded mock data instead of querying real audit logs, reports, and comments
- **Solution**: Replaced mock implementation with real data queries
- **Implementation**:
  - ✅ Updated `UserService.getActivity()` to query real audit logs, reports, and comments
  - ✅ Added proper activity filtering by user's event access (using unified RBAC)
  - ✅ Implemented chronological sorting of all activity types (reports, comments, audit logs)
  - ✅ Added meaningful activity messages for different action types
  - ✅ Limited results to top 20 most recent activities for performance
  - ✅ All 274 backend tests passing + All 78 frontend tests passing
- **Files Modified**:
  - `backend/src/services/user.service.ts` - Replaced mock activity with real data implementation
- **Activity Types Now Supported**:
  - Report submissions by user
  - Reports assigned to user
  - Comments posted by user
  - Audit log activities (invites, role changes, status updates)

## Reports Management Issues

### ✅ RESOLVED: CSV Export Missing URL Field
- **Issue**: CSV export missing URL field
- **Status**: ✅ **RESOLVED** (Already Implemented)
- **Priority**: High
- **Investigation**: 
  - Checked backend `/api/events/slug/:slug/reports/export` endpoint
  - Found CSV export already includes URL field in header: `ID,Title,Type,Status,Severity,Reporter,Assigned,Created,Description,URL`
  - Each report row includes full URL: `${req.protocol}://${req.get('host')}/events/${slug}/reports/${report.id}`
  - Test `should export reports as CSV` validates URL field presence and content
  - All backend tests passing (274/274) including CSV export test
- **Resolution**: No action needed - URL field already correctly implemented and tested

### ✅ COMPLETED: Missing Columns for Reporter and Assignee
- **Issue**: Missing columns for reporter and assignee in reports table
- **Status**: ✅ **COMPLETED**
- **Priority**: Medium
- **Solution**: Added Reporter column to reports table display
- **Implementation**:
  - ✅ Added Reporter column header to both pinned and regular reports table sections
  - ✅ Added Reporter column data displaying `report.reporter?.name` in both table sections
  - ✅ Updated column count calculation for empty state messages
  - ✅ Assignee column already existed conditionally (when `canViewAssignments` is true)
  - ✅ All 78 frontend tests passing (100% success rate)
- **Files Modified**:
  - `frontend/components/reports/EnhancedReportList.tsx` - Added Reporter column to table headers and data rows
- **Table Columns Now**: Title, Type, Status, Severity, Reporter, Assigned (conditional), Created, Actions

### 🔴 Report Detail Page (/events/.../reports/...)
### ✅ COMPLETED: Field Edits Don't Refresh UI
- **Issue**: Field edits don't refresh UI after save (type, description, incident date, location, parties)
- **Status**: ✅ **COMPLETED**
- **Priority**: Medium
- **Root Cause**: Missing `onReportUpdate` callback in report detail page - field edits were calling `onReportUpdate(responseData.report)` but the callback wasn't passed to `ReportDetailView` component
- **Solution**: Added missing `onReportUpdate` callback that updates the report state when field edits are saved
- **Implementation**:
  - ✅ Added `onReportUpdate` prop to `ReportDetailView` component in `/pages/events/[eventSlug]/reports/[reportId]/index.tsx`
  - ✅ Connected callback to `setReport(updatedReport)` to update parent state with new field values
  - ✅ All field edit handlers (location, description, type, incident date, parties, contact preference) now properly refresh UI
  - ✅ All 78 frontend tests passing (100% success rate)
- **Fields Now Working**: Type, Description, Incident Date, Location, Parties Involved, Contact Preference
- **User Experience**: Field edits now immediately show updated values without requiring page refresh

- **Issue 2**: Markdown comments not rendered as markdown
- **Status**: Not started
- **Priority**: Medium

### 🔴 New Report Creation (/events/.../reports/new)
- **Issue**: Allows submitting reports with future dates
- **Status**: Not started
- **Priority**: Medium
- **Fix**: Add validation to prevent future incident dates

## Event Management Issues

### 🔴 Event Settings Page (/events/.../settings)
- **Issue 1**: Edit fields/buttons styling doesn't match app design
- **Status**: Not started
- **Priority**: Low

- **Issue 2**: Logo upload doesn't refresh UI after upload
- **Status**: Not started
- **Priority**: Medium

- **Issue 3**: User list should be removed (redundant with team page)
- **Status**: Not started
- **Priority**: Low

### 🔴 Team Management Issues

#### View User Page (/events/.../team/...)
- **Issue**: Missing event context - should show which event user belongs to
- **Status**: Not started
- **Priority**: Low

#### Event Team Page (/events/.../team)
- **Issue**: User list needs context menu (View, User's Reports, Change Role, Remove)
- **Status**: Not started
- **Priority**: Medium

#### ✅ LIKELY FIXED: Invite Users Page (/events/.../team/invite)
- **Issue**: Creating invite throws 400 Bad Request error
- **Status**: ✅ **LIKELY FIXED** (via invite system RBAC fix)
- **Priority**: High
- **Root Cause Analysis**: 
  - The invite system was using legacy `Role` table for creation but unified roles for redemption
  - This caused foreign key constraint issues and 400 errors during invite creation
- **Fix Applied**: Complete migration to unified RBAC system
  - Updated `EventInviteLink` schema to reference `UnifiedRole` instead of legacy `Role`
  - Updated backend invite routes to use unified role IDs correctly
  - Created proper database migration for production environments
- **Testing**: All backend tests (274/274) and frontend tests (78/78) passing
- **Verification Needed**: Manual testing to confirm invite creation now works properly

## Missing Features

### 🔴 Code of Conduct Page (/events/.../settings/code-of-conduct)
- **Issue**: Shows "coming soon" - needs implementation
- **Status**: Not started
- **Priority**: Medium

## Summary

- **Total Issues**: 15
- **Completed**: 3 (authentication system, PDF export, header statistics) 
- **Fixed**: 1 (invite system RBAC)
- **Remaining Critical**: 1
- **High Priority**: 1  
- **Medium Priority**: 7
- **Low Priority**: 3

## Next Steps
1. Test invite creation to confirm it's working after RBAC fix
2. Address next critical issue in order
3. Fix UI refresh issues on report detail page
4. Implement missing context menus and styling improvements 
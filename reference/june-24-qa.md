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

### 🔴 Recent Activity Placeholder
- **Issue**: Recent Activity section shows placeholder data, not real activity
- **Status**: Not started  
- **Priority**: Medium

## Reports Management Issues

### 🔴 All Reports Page (/events/.../reports)
- **Issue 1**: CSV export missing URL field for reports
- **Status**: Not started
- **Priority**: Medium

- **Issue 2**: Missing columns for reporter and assignee in reports table
- **Status**: Not started
- **Priority**: Medium

### 🔴 Report Detail Page (/events/.../reports/...)
- **Issue 1**: Field edits don't refresh UI after save (type, description, incident date, location, parties)
- **Status**: Not started
- **Priority**: Medium
- **Note**: Data is saved but requires page refresh to see changes

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

#### 🔴 CRITICAL: Invite Users Page (/events/.../team/invite)
- **Issue**: Creating invite throws 400 Bad Request error
- **Status**: Likely FIXED ✅ (as part of invite system RBAC fix)
- **Priority**: High
- **Needs Testing**: Verify fix works

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
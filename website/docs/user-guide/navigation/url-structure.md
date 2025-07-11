---
sidebar_position: 4
---

# URL Structure

Understanding Conducky's URL structure helps you navigate efficiently, bookmark important pages, and share links with team members. This page explains the URL patterns and how they relate to navigation.

## URL Architecture

Conducky uses a hierarchical URL structure that reflects the three-context navigation system:

```
https://your-conducky-instance.com/
├── /dashboard (Global context)
├── /events/[eventSlug]/ (Event context)
├── /admin/ (System admin context)
└── /profile (User management)
```

## Global URLs

These URLs work across the entire system and are accessible based on your user permissions:

### Dashboard and Reporting
- `/dashboard` - Multi-event overview and personal dashboard
- `/dashboard/incidents` - Cross-event incident reports (if you belong to multiple events)
- `/dashboard/notifications` - Notification center for all your events

### Profile and Account Management
- `/profile` - User profile and account settings
- `/profile/events` - Event membership management and invite code redemption
- `/profile/settings` - Personal preferences and notification settings

### Authentication
- `/login` - User login page
- `/register` - New user registration (when available)
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form (with token)

### Invitations
- `/invite/[code]` - Accept event invitation using invite code
- `/org-invite/[code]` - Accept organization invitation (if applicable)

## Event URLs

Event URLs follow the pattern `/events/[eventSlug]/` where `eventSlug` is the unique identifier for the event:

### Public Event Pages (No Authentication Required)
- `/events/[eventSlug]/` - Public event information page
- `/events/[eventSlug]/code-of-conduct` - Public code of conduct page

### Event Dashboard and Management (Authentication Required)
- `/events/[eventSlug]/dashboard` - Event-specific dashboard
- `/events/[eventSlug]/incidents` - Event incident reports (role-scoped access)
- `/events/[eventSlug]/incidents/new` - Submit new incident report
- `/events/[eventSlug]/incidents/[incidentId]` - Specific incident details

### Team Management (Responder/Admin Access)
- `/events/[eventSlug]/team` - Team member list and management
- `/events/[eventSlug]/team/invite` - Send team invitations (Admin only)
- `/events/[eventSlug]/team/[userId]` - Individual team member details

### Event Settings (Admin Only)
- `/events/[eventSlug]/settings` - General event settings
- `/events/[eventSlug]/settings/code-of-conduct` - Code of conduct management
- `/events/[eventSlug]/settings/notifications` - Notification preferences
- `/events/[eventSlug]/audit` - Event audit log (Admin access)

### Example Event URLs
For an event with slug "devconf-2024":
```
/events/devconf-2024/dashboard
/events/devconf-2024/incidents
/events/devconf-2024/incidents/new
/events/devconf-2024/team
/events/devconf-2024/settings
```

## System Admin URLs

System Admin URLs are only accessible to users with System Admin role:

### System Management
- `/admin/dashboard` - System-wide overview and statistics
- `/admin/events` - All events management and overview
- `/admin/events/new` - Create new event form
- `/admin/system/settings` - Global system configuration

### Event Administration
- `/admin/events/[eventId]/settings` - System-level event settings
- `/admin/events/[eventId]/users` - Event user management
- `/admin/system/audit` - System-wide audit log
- `/admin/system/logs` - System logs and monitoring

### Organization Management (if applicable)
- `/admin/organizations` - Organization management
- `/admin/organizations/new` - Create new organization
- `/admin/organizations/[orgId]/settings` - Organization settings

## URL Parameters and Query Strings

### Common Query Parameters

**Filtering and Search:**
- `?status=open` - Filter incidents by status
- `?assigned=me` - Show incidents assigned to current user
- `?search=keyword` - Search across incident content
- `?page=2` - Pagination for long lists

**Date Ranges:**
- `?from=2024-01-01&to=2024-12-31` - Date range filtering
- `?recent=7d` - Show items from last 7 days

**Sorting:**
- `?sort=created&order=desc` - Sort by creation date, newest first
- `?sort=priority&order=asc` - Sort by priority, lowest first

### Example URLs with Parameters
```
/events/devconf-2024/incidents?status=investigating&assigned=me
/dashboard/incidents?recent=7d&sort=priority
/events/devconf-2024/team?role=responder
```

## URL Security and Access Control

### Authentication Requirements

**Public URLs** (no authentication required):
- Event public pages (`/events/[eventSlug]/`)
- Code of conduct pages (`/events/[eventSlug]/code-of-conduct`)
- Login and registration pages

**Authenticated URLs** (login required):
- All dashboard pages
- Profile and settings pages
- Event-specific management pages

**Role-Based URLs** (specific permissions required):
- Event admin pages require Event Admin role
- System admin pages require System Admin role
- Incident details require appropriate event role

### Automatic Redirects

Conducky automatically handles access control with redirects:

1. **Unauthenticated users** → Redirected to `/login`
2. **Insufficient permissions** → Redirected to appropriate dashboard
3. **Invalid event slugs** → Redirected to global dashboard with error message
4. **Disabled events** → Redirected with notification about event status

## Bookmarking and Sharing

### Safe URLs to Bookmark
- **Dashboard pages** - Always accessible if you maintain access
- **Event dashboards** - Stable as long as you belong to the event
- **Profile pages** - Always accessible while authenticated

### URLs to Avoid Bookmarking
- **Specific incident URLs** - May become inaccessible if incident is closed or archived
- **Admin invite URLs** - Single-use or time-limited
- **Password reset URLs** - Single-use and time-limited

### Sharing URLs with Team Members

**Safe to share:**
- Event dashboard URLs with team members who have access
- Public event pages with anyone
- Code of conduct pages with anyone

**Avoid sharing:**
- Specific incident URLs (may contain sensitive information)
- Admin or system URLs (require special permissions)
- Personal profile URLs (contain private information)

## URL Best Practices

### For Users
1. **Bookmark your frequently used dashboards** for quick access
2. **Use the event switcher** instead of manually typing event URLs
3. **Copy URLs from the address bar** when sharing with authorized team members
4. **Be cautious sharing URLs** that might contain sensitive information

### For Administrators
1. **Use descriptive event slugs** that are easy to remember and type
2. **Keep event slugs consistent** with your event naming conventions
3. **Document important URLs** for your team members
4. **Monitor access logs** for unusual URL access patterns

### For Developers
1. **Follow the established URL patterns** when adding new features
2. **Implement proper access control** for all new URLs
3. **Use consistent parameter naming** across similar endpoints
4. **Provide appropriate redirects** for edge cases and errors

## Mobile URL Considerations

### Mobile-Friendly URLs
All Conducky URLs are designed to work well on mobile devices:
- **Short and readable** event slugs
- **Touch-friendly** navigation elements
- **Responsive design** that adapts to mobile screens
- **Fast loading** even on slower mobile connections

### Mobile Sharing
- **URLs work in mobile browsers** and can be shared via messaging apps
- **Deep linking** works from mobile notifications
- **Progressive web app** features enhance mobile URL handling
- **Offline support** for previously visited URLs 
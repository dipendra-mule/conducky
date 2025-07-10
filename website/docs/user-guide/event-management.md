---
sidebar_position: 7
---
# Event Management

This document explains how events are created and managed in Conducky, including the workflow for System Admins and Organization Admins.

---

## Event Creation Workflow

Conducky supports flexible event creation through multiple pathways depending on organizational structure:

### Organization-Based Events

1. **Organization Admin creates event** within their organization
2. **Event inherits organization context** and admin automatically gets event admin role
3. **Event Admin configures detailed settings** (contact info, dates, CoC, etc.)
4. **Event becomes active** once fully configured
5. **Event Admin manages** ongoing operations (users, reports, settings)

### Direct System Admin Creation

1. **System Admin creates minimal event** with basic information (name, slug, description)
2. **Event is created as inactive** (`isActive: false`) until fully configured
3. **System Admin assigns Event Admin** role to designated event organizer
4. **Event Admin completes setup** and activates the event

This workflow ensures proper separation of concerns and supports both organizational hierarchies and direct system administration.

---

## Event Data Model

- Each event has a unique `id`, `name`, and `slug`.
- Events are related to users (via roles), reports, audit logs, and invite links.
- Events have an `isActive` status that controls visibility and functionality.
- See `Event` in `schema.prisma`:

```prisma
model Event {
  id             String   @id @default(uuid())
  name           String
  slug           String   @unique
  description    String?
  isActive       Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  userEventRoles UserEventRole[]
  reports        Report[]
  auditLogs      AuditLog[]
  inviteLinks    EventInviteLink[]
}
```

---

## Creating Events

Events can be created by System Admins globally or by Organization Admins within their organizations.

### Creating Events (Organization Admin)

Organization Admins can create events within their organization:

1. **Navigate to Organization Dashboard**: Access your organization's event management section
2. **Create New Event**: Click **"Create Event"**
3. **Fill event information**:
   - **Name**: Display name for the event (e.g., "DevConf 2024")
   - **Slug**: URL-safe identifier (e.g., "devconf-2024")
   - **Description**: Brief description of the event
   - **Organization**: Automatically set to your organization
4. **Create event**: Click **"Create Event"**
5. **Configure settings**: Complete event setup in the Event Admin interface

### Creating Events (System Admin)

### Creating Events (System Admin)

System Admins can create events globally for any organization:

1. **Navigate to System Admin**: Use the sidebar to access **System Admin → Events Management**
2. **Access creation form**: Click **"Create Event"** or go to `/admin/events/new`
3. **Fill event information**:
   - **Name**: Display name for the event (e.g., "DevConf 2024")
   - **Slug**: URL-safe identifier (e.g., "devconf-2024")
   - **Description**: Brief description of the event
   - **Organization**: Select target organization (if applicable)
4. **Create event**: Click **"Create Event"**
5. **Assign Event Admin**: Assign appropriate Event Admin role to the designated organizer

The event will be created and ready for configuration by the assigned Event Admin.

### Generating Admin Invites

After creating an event, System Admins can generate invite links for event organizers:

1. **Navigate to event management**: Go to **System Admin → Events Management** (`/admin/events`)
2. **Select event**: Click on the event you want to manage
3. **Access settings**: Navigate to the **Settings** tab
4. **Create invite**:
   - Click **"Create Admin Invite"**
   - Add a note (email address recommended for tracking)
   - Set expiration date (optional, defaults to 30 days)
   - Set maximum uses (optional, defaults to 1)
5. **Share invite**: Copy the generated invite link and send to the event organizer

### Via the API

System Admins can use the API for programmatic event creation:

```bash
# Create basic event
POST /api/admin/events
{
  "name": "My Conference 2024",
  "slug": "my-conference-2024",
  "description": "Annual technology conference"
}

# Generate admin invite
POST /api/admin/events/{eventId}/invites
{
  "note": "admin@myconference.org",
  "maxUses": 1,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

Requirements:

- Must be authenticated as a System Admin
- Slug must be unique across the system
- Slug must be URL-safe (lowercase, alphanumeric, hyphens only)

---

## Event Admin Responsibilities

Once an event organizer accepts the admin invite, they become the event admin and can:

### Complete Event Setup

- **Configure event details**: Add contact information, dates, website
- **Upload event logo**: Custom branding for the event
- **Set up Code of Conduct**: Define community guidelines
- **Activate event**: Make the event live and accessible

### Ongoing Management

- **User management**: Invite and manage team members (responders, reporters)
- **Report oversight**: Monitor and manage incident reports
- **Team coordination**: Assign roles and responsibilities
- **Settings updates**: Modify event configuration as needed

---

## Listing Events

### For System Admins

System Admins can view all events in the system with administrative information:

- **UI**: Navigate to **System Admin → Events Management** (`/admin/events`)
- **API**: `GET /api/admin/events` returns all events with statistics
- **Information shown**: Event details, user counts, activity summaries, admin invite status

### For Regular Users

Regular users see only events they belong to:

- **UI**: Global dashboard (`/dashboard`) shows user's events
- **API**: `GET /api/users/me/events` returns user's events with roles
- **Information shown**: Events where user has a role, with role-specific previews

---

## Event Permissions and Roles

### Role Hierarchy

Each event can have users with different roles:

- **Admin**: Full event management capabilities
- **Responder**: Report management and team coordination
- **Reporter**: Basic report submission and viewing

### Permission Matrix

| Action | Reporter | Responder | Admin | System Admin* |
|--------|----------|-----------|-------|-------------|
| View own reports | ✅ | ✅ | ✅ | ❌** |
| View all reports | ❌ | ✅ | ✅ | ❌** |
| Submit reports | ✅ | ✅ | ✅ | ❌** |
| Manage reports | ❌ | ✅ | ✅ | ❌** |
| Invite users | ❌ | ❌ | ✅ | ❌** |
| Event settings | ❌ | ❌ | ✅ | ❌** |
| Create events | ❌ | ❌ | ❌ | ✅ |
| System admin | ❌ | ❌ | ❌ | ✅ |

*System Admins need explicit event roles to access event data
**System Admins can access event data only when assigned an event role

---

## Inline Editing of Event Metadata

Event admins can edit event metadata directly from the main event page using an inline editing interface.

### Editable Fields

- **Name**: Event display name
- **Logo**: Event branding image
- **Start Date**: Event start date and time
- **End Date**: Event end date and time
- **Website**: Event website URL
- **Description**: Event description
- **Code of Conduct**: Community guidelines (Markdown supported)
- **Contact Email**: Primary contact for the event

### Who Can Edit

- Only users with the `Admin` role for the event will see edit icons
- System Admins can edit if they have been assigned an Admin role for the event
- Non-admin users cannot edit event metadata

### How It Works

1. **Click edit icon**: Pencil icon appears next to editable fields for admins
2. **Edit inline**: Click to enable editing directly on the page
3. **Save changes**: Click checkmark to save, or X to cancel
4. **Immediate updates**: Changes are reflected in the UI upon success
5. **Error handling**: Clear error messages for validation failures

---

## Event Logo Upload

Event admins can upload custom logos for visual branding.

### Upload Process

1. **Access logo section**: Click the pencil icon next to the current logo (or placeholder)
2. **Select image**: Choose a PNG or JPG file (max 5MB)
3. **Preview**: See how the logo will appear
4. **Save**: Confirm the upload

### Technical Details

- **Storage**: Logos are stored in the database as BLOBs
- **Access**: Retrieved via `GET /events/slug/:slug/logo`
- **Formats**: PNG and JPG supported
- **Size limit**: Maximum 5MB per file
- **Fallback**: Default placeholder shown if no logo uploaded

---

## Event Slugs and URLs

Event slugs are used throughout the application for URL routing:

- **Format**: Lowercase letters, numbers, and hyphens only
- **Uniqueness**: Must be unique across the entire system
- **Immutability**: Cannot be changed after creation (to preserve URLs)
- **URL pattern**: `/events/[eventSlug]/` for all event-scoped pages

### Examples

- Event: "DevConf 2024" → Slug: "devconf-2024"
- Event: "PyData Chicago" → Slug: "pydata-chicago"
- Event: "RustConf" → Slug: "rustconf"

---

## Report Management Integration

Events integrate with the report management system:

### Report Access Control

- **Event-scoped**: All reports belong to a specific event
- **Role-based access**: Different roles see different reports
- **Privacy**: Users cannot see reports from other events

### Report Features

- **Titles**: All reports require descriptive titles (10-70 characters)
- **Evidence uploads**: Multiple file attachments supported
- **Assignment**: Reports can be assigned to responders
- **Severity levels**: Low, medium, high, critical
- **Resolution tracking**: Outcome documentation when resolved

---

## Admin API Endpoints

### System Admin Event Management

- `POST /api/admin/events` - Create new event
- `GET /api/admin/events` - List all events with statistics
- `GET /api/admin/events/:eventId` - Get specific event details

### System Admin Invite Management

- `GET /api/admin/events/:eventId/invites` - List event invites
- `POST /api/admin/events/:eventId/invites` - Create admin invite
- `PATCH /api/admin/events/:eventId/invites/:inviteId` - Update invite

### Event Admin Management

- `GET /api/events/slug/:slug` - Get event details
- `PATCH /api/events/slug/:slug` - Update event settings
- `POST /api/events/slug/:slug/logo` - Upload event logo
- `GET /api/events/slug/:slug/users` - List event users
- `POST /api/events/slug/:slug/invites` - Create user invites

See [API Endpoints](../developer-docs/api-endpoints.md) for complete documentation.

---

## Security and Audit

### Access Control

- **System Admin isolation**: Cannot access event data without explicit roles
- **Event isolation**: Users cannot access other events' data
- **Role validation**: All actions validated against user permissions
- **Invite security**: Secure token generation for invite links

### Audit Logging

All event management actions are logged:

- **Event creation**: System Admin actions logged
- **Role assignments**: User role changes tracked
- **Settings updates**: Event configuration changes recorded
- **Access attempts**: Unauthorized access attempts logged

---

## Troubleshooting

### Common Issues

**System Admin cannot access event data**

- Solution: Have an event admin assign you an event role

**Event creation fails**

- Check: Slug uniqueness and format
- Verify: System Admin permissions
- Review: Required fields completion

**Invite links not working**

- Check: Expiration date and usage limits
- Verify: Link integrity and format
- Review: User registration process

**Event not appearing in lists**

- Check: User role assignment
- Verify: Event active status
- Review: Permission settings

### Getting Help

For event management issues:

1. Check user roles and permissions
2. Verify event configuration
3. Review audit logs for errors
4. Contact system administrators
5. Consult [troubleshooting guide](troubleshooting)

---

## Future Enhancements

Planned event management improvements:

- **Bulk operations**: Manage multiple events simultaneously
- **Event templates**: Reusable event configurations
- **Advanced analytics**: Event usage and engagement metrics
- **Integration APIs**: Connect with external event management systems
- **Automated workflows**: Streamlined event lifecycle management

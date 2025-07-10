---
sidebar_position: 2
---

# Event Management

This guide covers System Admin functions for creating and managing events in Conducky.

## Overview

System Admins can create new events and manage them at a system level. This includes event creation, generating admin invites, and overseeing event access and status.

**Important**: System Admins have separate permissions from event-level roles. To access event data (reports, users, etc.), System Admins must be explicitly assigned an event role by an event admin.

## Creating Events

The event creation workflow has been streamlined for better user experience:

### New Simplified Workflow

1. **System Admin creates basic event** (name, slug, description only)
2. **Event is created as inactive** (`isActive: false`) until fully configured
3. **System Admin generates admin invite link** for the event organizer
4. **Event organizer accepts invite** and becomes event admin
5. **Event admin completes detailed setup** (contact info, dates, CoC, etc.)
6. **Event becomes active** once fully configured

### Via the UI

1. Log in as a System Admin
2. Navigate to **System Admin → Events Management** in the sidebar
3. Click **"Create Event"** or go to `/admin/events/new`
4. Fill in the basic event details:
   - **Name**: Display name for the event
   - **Slug**: URL-safe identifier (lowercase, letters, numbers, hyphens only)
   - **Description**: Brief description of the event
5. Click **"Create Event"**

The event will be created in an inactive state, ready for admin assignment.

### Via the API

Use the `POST /api/admin/events` endpoint with:

```json
{
  "name": "My Conference 2024",
  "slug": "my-conference-2024",
  "description": "Annual technology conference"
}
```

Requirements:

- Must be authenticated as a System Admin
- Slug must be unique across the system
- Slug must be URL-safe (lowercase, alphanumeric, hyphens only)

## Managing Events

### Listing All Events

System Admins can view all events in the system:

- **UI**: Navigate to **System Admin → Events Management** (`/admin/events`)
- **API**: `GET /api/admin/events` returns all events (System Admin only)

### Event Details and Settings

From the events list, System Admins can:

- **View event details**: Click on any event to see full information
- **Manage invites**: Create and manage admin invite links
- **View basic stats**: See user counts and activity summaries

### Event Access Restrictions

System Admins can access event management interfaces, but they **cannot** access event data (reports, detailed user information, etc.) unless they are explicitly assigned an event role.

To access event data:

1. Have an event admin assign you a role in the event
2. Use the standard event interface (`/events/[slug]/`)

## Admin Invite Management

### Generating Admin Invites

After creating an event:

1. Go to **System Admin → Events Management** (`/admin/events`)
2. Click on the event you want to manage
3. Navigate to the **Settings** tab
4. In the **Invite Management** section:
   - Click **"Create Admin Invite"**
   - Optionally add a note (email address recommended)
   - Copy the generated invite link
5. Send the invite link to your designated event organizer

### Managing Existing Invites

System Admins can:

- **View all invites**: See all admin invite links for an event
- **Disable invites**: Mark invite links as inactive
- **Track usage**: See which invites have been used and when

### API Endpoints

The following endpoints are available for System Admin event management:

#### Event Management

- `POST /api/admin/events` - Create new event
- `GET /api/admin/events` - List all events
- `GET /api/admin/events/:eventId` - Get specific event details

#### Invite Management

- `GET /api/admin/events/:eventId/invites` - List invites for an event
- `POST /api/admin/events/:eventId/invites` - Create new admin invite
- `PATCH /api/admin/events/:eventId/invites/:inviteId` - Update invite (disable/enable)

All admin endpoints require System Admin authentication and return appropriate error responses for unauthorized access.

## Organizations and Events

### Organization-Based Events

Events can be created within organizations for better structure:

1. **Organization Admin creates event** within their organization
2. **Event inherits organization context** and admin automatically gets event admin role
3. **Event Admin configures detailed settings**
4. **Event becomes active** once fully configured

### Direct System Admin Creation

1. **System Admin creates minimal event** with basic information
2. **Event is created as inactive** until fully configured
3. **System Admin assigns Event Admin** role to designated event organizer
4. **Event Admin completes setup** and activates the event

## Troubleshooting

### Common Issues

- **Cannot see system admin navigation**: Verify System Admin role assignment
- **Cannot create events**: Check System Admin permissions and database connectivity
- **Event not accessible**: Ensure event is active and you have proper roles
- **Invite links not working**: Check that invites haven't expired or been disabled

### Event Status Issues

If events aren't working properly:

1. **Check event status**: Ensure event is active (`isActive: true`)
2. **Verify permissions**: Confirm System Admin role is properly assigned
3. **Review logs**: Check system logs for error messages
4. **Test connectivity**: Ensure database connections are working

### Getting Help

For additional support:

- Review the [System Settings](./system-settings.md) documentation
- Check the [Security Management](./security-management.md) guide
- Consult the [Database Monitoring](./database-monitoring.md) tools

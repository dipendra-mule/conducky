---
sidebar_position: 3
---

# Event Structure

Understanding how events are structured in Conducky helps you work more effectively with the system. This page explains the technical aspects of events, their relationships, and data organization.

## Event Data Model

Each event in Conducky has the following core structure:

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

### Core Event Properties

**Unique Identifiers:**
- **`id`**: Internal UUID for database relationships
- **`slug`**: Human-readable URL identifier (e.g., "devconf-2024")

**Basic Information:**
- **`name`**: Display name shown to users
- **`description`**: Optional detailed description
- **`isActive`**: Controls event visibility and functionality

**Timestamps:**
- **`createdAt`**: When the event was created
- **`updatedAt`**: Last modification time

### Event Relationships

Events are connected to other system entities through several relationships:

**User Relationships:**
- **`userEventRoles`**: Links users to events with specific roles (Reporter, Responder, Admin)

**Content Relationships:**
- **`reports`**: All incident reports belong to a specific event
- **`auditLogs`**: Event-specific audit trail for all actions

**Management Relationships:**
- **`inviteLinks`**: Invitation links for joining the event

## Event Isolation

Events provide strong data isolation between different organizations and conferences:

### Data Scoping

All event-related data is strictly scoped to individual events:

- **Reports**: Cannot be viewed across events
- **Users**: Must have explicit roles in each event
- **Audit logs**: Event-specific activity tracking
- **Settings**: Each event has independent configuration

### Access Control

Event access is controlled through role-based permissions:

- **No default access**: Users cannot access events without explicit roles
- **Role-specific permissions**: Different roles see different data and features
- **System Admin isolation**: Even System Admins need event roles to access event data

### Security Benefits

This isolation provides several security advantages:

- **Data privacy**: Sensitive incident data cannot leak between events
- **Role separation**: Users can have different roles in different events
- **Audit clarity**: Actions are clearly attributed to specific events
- **Compliance support**: Easier to meet data protection requirements

## Event States and Lifecycle

### Event Status

Events can be in different states that affect functionality:

**Active Events (`isActive: true`):**
- Fully functional with all features available
- Visible to users with appropriate roles
- Can receive new incident reports
- Team management and settings are accessible

**Inactive Events (`isActive: false`):**
- Limited functionality during initial setup
- Not visible in public event listings
- Cannot receive incident reports until activated
- Used for events under configuration

**Disabled Events:**
- Temporarily disabled by System Admins
- Data preserved but inaccessible to users
- Can be re-enabled when needed
- Used for maintenance or temporary suspension

### Event Lifecycle Phases

Events typically go through these phases:

1. **Creation**: Basic event information is set up
2. **Configuration**: Event details, team, and settings are configured
3. **Activation**: Event becomes live and operational
4. **Operation**: Active incident management and team coordination
5. **Completion**: Event ends but data is preserved
6. **Archival**: Long-term storage with read-only access

## Event Metadata and Configuration

### Editable Event Metadata

Event Admins can manage various aspects of event configuration:

**Basic Information:**
- **Name**: Event display name
- **Description**: Detailed event description
- **Website**: Event website URL
- **Contact Email**: Primary contact for the event

**Visual Branding:**
- **Logo**: Event branding image (PNG/JPG, max 5MB)
- **Custom styling**: Future enhancement for event-specific themes

**Operational Settings:**
- **Start Date**: Event start date and time
- **End Date**: Event end date and time
- **Time Zone**: Event time zone for proper scheduling

**Community Guidelines:**
- **Code of Conduct**: Community guidelines (Markdown supported)
- **Reporting Guidelines**: Instructions for incident reporting
- **Contact Information**: How to reach event organizers

### Configuration Storage

Event configuration is stored in several ways:

- **Database fields**: Core metadata in the Event table
- **File storage**: Logos and attachments stored as BLOBs
- **Structured data**: Complex settings stored as JSON
- **Related tables**: Specialized configuration in linked tables

## Event URLs and Routing

### URL Structure

Events use a consistent URL structure based on the event slug:

**Public URLs** (no authentication required):
- `/events/[eventSlug]/` - Public event information
- `/events/[eventSlug]/code-of-conduct` - Public code of conduct

**Authenticated URLs** (role-based access):
- `/events/[eventSlug]/dashboard` - Event dashboard
- `/events/[eventSlug]/incidents` - Incident management
- `/events/[eventSlug]/team` - Team management
- `/events/[eventSlug]/settings` - Event configuration

### Slug Characteristics

Event slugs have specific properties:

- **Immutable**: Cannot be changed after creation
- **Unique**: Must be unique across the entire system
- **URL-safe**: Only lowercase letters, numbers, and hyphens
- **Persistent**: URLs remain valid throughout event lifecycle

## Event Integration Points

### Report Management Integration

Events integrate closely with the incident reporting system:

**Report Scoping:**
- All reports belong to exactly one event
- Users can only see reports from events where they have roles
- Report assignment and management is event-specific

**Role-Based Access:**
- **Reporters**: Can submit and view their own reports
- **Responders**: Can view and manage all event reports
- **Event Admins**: Full access to all event reports and management

### User Management Integration

Events connect to the user system through roles:

**Role Assignment:**
- Users can have different roles in different events
- Roles are event-specific and don't transfer between events
- System Admins need explicit event roles to access event data

**Team Management:**
- Event Admins can invite users to their events
- Role changes are tracked in audit logs
- Users can leave events voluntarily

### Audit and Compliance Integration

Events maintain comprehensive audit trails:

**Event-Specific Logging:**
- All actions within an event are logged
- Logs include user, action, timestamp, and details
- Logs are scoped to individual events for privacy

**Compliance Support:**
- Event-specific data retention policies
- Audit trails for regulatory compliance
- Data export capabilities for legal requirements

## Performance Considerations

### Data Organization

Events are organized for optimal performance:

**Indexing Strategy:**
- Event slug is indexed for fast URL resolution
- User-event relationships are indexed for quick access checks
- Report queries are optimized with event-specific indexes

**Caching Strategy:**
- Event metadata is cached for faster page loads
- User role information is cached to reduce database queries
- Navigation data is cached per event context

### Scalability Design

The event structure supports large-scale deployments:

- **Horizontal scaling**: Events can be distributed across database shards
- **Independent operation**: Events don't interfere with each other
- **Resource isolation**: Heavy usage in one event doesn't affect others
- **Parallel processing**: Event operations can be processed in parallel

Understanding these technical aspects helps administrators make informed decisions about event management and helps users understand how their data is organized and protected within the Conducky system. 
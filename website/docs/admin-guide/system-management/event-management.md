---
sidebar_position: 2
---

# Event Management

System Admins are responsible for creating and managing events across the platform. This guide covers the streamlined event creation workflow and ongoing event administration.

## 🎯 Event Creation Workflow

The event creation workflow follows a clear organizational hierarchy:

### Standard Workflow Steps

1. **System Admin creates organizations** and assigns Organization Admins via invitation
2. **Organization Admin accepts invite** and gains access to organization management
3. **Organization Admin creates events** within their organization
4. **Organization Admin assigns Event Admins** via invitation for each event
5. **Event Admin completes detailed setup** (contact info, dates, CoC, team, etc.)
6. **Event becomes active** once fully configured

This hierarchy ensures proper organizational structure and clear responsibility chains.

## 🖥️ Creating Events via UI

### Step-by-Step Process

1. **Log in as a System Admin**
2. **Navigate to System Admin → Events Management** in the sidebar
3. **Click "Create Event"** or go to `/admin/events/new`
4. **Fill in the basic event details:**
   - **Name**: Display name for the event (e.g., "DevConf 2024")
   - **Slug**: URL-safe identifier (lowercase, letters, numbers, hyphens only)
   - **Description**: Brief description of the event
5. **Click "Create Event"**

The event will be created in an inactive state, ready for admin assignment.

### Event Slug Requirements

- Must be unique across the entire system
- URL-safe format only: lowercase letters, numbers, and hyphens
- No spaces, special characters, or uppercase letters
- Examples: `devconf-2024`, `pycon-us-2024`, `react-summit`

## 📧 Admin Invite Generation

After creating an event, you need to assign an event organizer:

### Generating Invites

1. **Go to System Admin → Events Management** (`/admin/events`)
2. **Click on the event** you want to manage
3. **Navigate to the Settings tab**
4. **In the Invite Management section:**
   - Click **"Create Admin Invite"**
   - Optionally add a note (email address recommended for tracking)
   - Copy the generated invite link
5. **Send the invite link** to your designated event organizer

### Invite Best Practices

- **Include email in note**: Track who the invite was sent to
- **Set expiration**: Use reasonable expiration times for security
- **Monitor usage**: Check if invites have been accepted
- **Revoke unused invites**: Clean up expired or unused invites

## 🔧 API-Based Event Creation

For automated or bulk event creation, use the API endpoints:

### Create Event Endpoint

**POST** `/api/admin/events`

```json
{
  "name": "My Conference 2024",
  "slug": "my-conference-2024", 
  "description": "Annual technology conference"
}
```

### Requirements

- Must be authenticated as a System Admin
- Slug must be unique across the system
- Slug must be URL-safe (lowercase, alphanumeric, hyphens only)

### Response

```json
{
  "message": "Event created successfully",
  "event": {
    "id": "event-uuid",
    "name": "My Conference 2024",
    "slug": "my-conference-2024",
    "description": "Annual technology conference",
    "isActive": false,
    "setupRequired": true
  }
}
```

## 📋 Event Lifecycle Management

### Event States

Events progress through several states:

1. **Created (Inactive)**: Basic event created by System Admin
2. **Admin Assigned**: Event organizer accepted admin invite
3. **In Setup**: Event admin configuring details
4. **Active**: Fully configured and accepting reports
5. **Archived**: Event completed and archived

### Monitoring Event Setup

System Admins can monitor event setup progress:

- **Setup Status**: View which configuration steps are completed
- **Admin Assignment**: Check if event has an assigned admin
- **Configuration Progress**: Monitor setup completion
- **Activation Status**: See when events become active

## 🏢 Organization Integration

Events can be created within organizations for better structure:

### Creating Events in Organizations

1. **Navigate to Organizations Management**
2. **Select the target organization**
3. **Use "Create Event" within the organization context**
4. **Event inherits organization settings and branding**

### Benefits of Organization Events

- **Shared branding**: Events inherit organization logos and themes
- **Unified management**: Organization admins can manage multiple events
- **Consistent policies**: Shared code of conduct and policies
- **Analytics**: Organization-level reporting and analytics

## 📊 Event Analytics and Monitoring

### System-Wide Event Metrics

Monitor key metrics across all events:

- **Total Events**: Active vs inactive event counts
- **User Activity**: Registration and participation trends
- **Incident Volume**: Report submission patterns
- **Geographic Distribution**: Event locations and user distribution

### Individual Event Monitoring

Track specific event performance:

- **User Registration**: Growth and engagement metrics
- **Incident Reports**: Volume and resolution times
- **Team Activity**: Response team engagement
- **System Usage**: Feature adoption and usage patterns

## 🔒 Event Security and Compliance

### Access Control

- **Event Isolation**: Ensure proper data separation between events
- **Role Verification**: Validate admin and user role assignments
- **Permission Auditing**: Regular review of event-level permissions

### Data Protection

- **Event Data Isolation**: Verify multi-tenant data separation
- **Backup Verification**: Ensure event data is properly backed up
- **Retention Policies**: Implement appropriate data retention

### Compliance Monitoring

- **Audit Logging**: Track all event-related administrative actions
- **Policy Compliance**: Ensure events follow organizational policies
- **Security Reviews**: Regular security assessments of event configurations

## 🚨 Troubleshooting Event Issues

### Common Event Creation Problems

**Slug Already Exists**
- Solution: Choose a unique slug or modify the existing one
- Check: Verify slug uniqueness across all events

**Invalid Slug Format**
- Solution: Use only lowercase letters, numbers, and hyphens
- Avoid: Spaces, special characters, uppercase letters

**Permission Denied**
- Solution: Verify System Admin authentication
- Check: Ensure proper role assignment

### Event Setup Issues

**Admin Invite Not Working**
- Check: Invite link expiration and usage limits
- Verify: Email delivery and spam folder
- Solution: Generate new invite if needed

**Event Not Activating**
- Check: Required configuration completion
- Verify: All mandatory fields are filled
- Review: Event admin permissions

**Configuration Problems**
- Review: Event settings and requirements
- Check: Integration with organization settings
- Verify: Code of conduct and policy setup

## 📈 Best Practices

### Event Planning

- **Plan ahead**: Create events well before launch dates
- **Clear naming**: Use descriptive, consistent naming conventions
- **Proper delegation**: Assign appropriate event admins early
- **Documentation**: Maintain records of event configurations

### Ongoing Management

- **Regular monitoring**: Check event health and activity
- **Proactive support**: Assist event admins with configuration
- **Performance tracking**: Monitor system impact of large events
- **Security reviews**: Regular security assessments

### Scaling Considerations

- **Resource planning**: Monitor system resources during large events
- **Performance optimization**: Optimize for high-traffic events
- **Backup strategies**: Ensure adequate backup coverage
- **Incident response**: Prepare for event-related system issues 
---
sidebar_position: 3
---

# System Settings

This guide covers global system settings that System Admins can configure to control the behavior of the entire Conducky installation.

## Overview

System settings allow System Admins to configure global options that affect all users and events in the Conducky installation. These settings control system-wide behavior and appearance.

## Accessing System Settings

1. Log in as a System Admin
2. Navigate to **System Admin → System Settings** in the sidebar
3. Go to `/admin/system/settings`

## Available Settings

### Public Event Listing

Control whether public event listings are shown on the home page:

**Setting**: Show Public Event List

**Description**: When enabled, the home page displays a list of all active events for unauthenticated users

**Default**: Disabled (false)

**Impact**:
- **Enabled**: Unauthenticated users see all events on the home page with links to public event pages
- **Disabled**: Home page shows only login/registration options for unauthenticated users

**Use Cases**:
- **Public conferences**: Enable to allow attendees to discover and join events
- **Private organizations**: Disable to require authentication before showing any event information
- **Mixed environments**: Can be toggled based on current needs

### Managing Settings

#### Via the UI

1. Go to **System Admin → System Settings** (`/admin/system/settings`)
2. Use the toggle switch to enable/disable "Show Public Event List"
3. Changes take effect immediately on the home page
4. Click **"Save Changes"** to persist your updates

#### Via the API

System settings can also be managed programmatically:

**View Current Settings** (public access):
```bash
GET /api/system/settings
```

**Update Settings** (System Admin only):
```bash
PATCH /api/admin/system/settings
```

Example API usage:

```json
PATCH /api/admin/system/settings
{
  "showPublicEventList": true
}
```

**Response Format**:
```json
{
  "success": true,
  "settings": {
    "showPublicEventList": true
  }
}
```

## System Configuration

### Email Settings

Configure email delivery for notifications and system communications:

**SMTP Configuration**:
- **Provider**: Choose between console (development), SMTP, or SendGrid
- **Host/Port**: SMTP server details for custom email providers
- **Authentication**: Username and password for SMTP servers
- **Security**: TLS/SSL encryption settings

For detailed email configuration, see [System Configuration](./system-configuration.md).

### Authentication Settings

**Session Management**:
- **Session Duration**: How long users stay logged in
- **Session Security**: Cookie settings and encryption
- **Password Requirements**: Minimum password complexity

**Social Login**:
- **OAuth Providers**: Enable/disable Google and GitHub login
- **Provider Configuration**: Client IDs and secrets for OAuth

For social login setup, see [Social Login Setup](./social-login-setup.md).

## System Health and Monitoring

### Health Check Endpoints

Monitor system status using built-in health checks:

**Basic Health Check**:
```bash
GET /api/health
```

**Detailed System Status**:
```bash
GET /api/admin/system/status
```

**Database Connection**:
```bash
GET /api/admin/system/database/status
```

### Performance Monitoring

System Admins can monitor database performance and query optimization:

- **Query Performance**: Track slow queries and execution times
- **N+1 Detection**: Identify inefficient database access patterns
- **Connection Monitoring**: Monitor database connection pool usage

For detailed performance monitoring, see [Database Monitoring](./database-monitoring.md).

## Global User Management

### User Statistics

View system-wide user metrics:

- **Total Users**: Count of all registered users
- **Active Users**: Users who have logged in recently
- **Event Participation**: Users with event roles
- **Role Distribution**: Breakdown of user roles across events

### System-Level Roles

Manage global system roles:

**System Admin Role**:
- **Grant**: Assign System Admin privileges to trusted users
- **Revoke**: Remove System Admin access when no longer needed
- **Audit**: Track System Admin actions and access

**Note**: System Admins cannot access event data without explicit event roles.

## Security Settings

### Access Control

**IP Restrictions** (if implemented):
- **Allowed IPs**: Whitelist specific IP addresses or ranges
- **Admin Access**: Restrict System Admin access to specific locations
- **Geographic Blocking**: Block access from specific countries/regions

### Audit Logging

**System Events**:
- **User Registration**: Track new account creation
- **Role Changes**: Monitor privilege escalation
- **System Access**: Log System Admin actions
- **Configuration Changes**: Track system setting modifications

### Rate Limiting

**API Protection**:
- **Authentication Endpoints**: Limit login attempts
- **Registration**: Prevent spam account creation
- **Password Reset**: Limit reset request frequency

For comprehensive security practices, see [Security Overview](./security-overview.md).

## Backup and Maintenance

### System Backup Configuration

**Database Backups**:
- **Schedule**: Automated backup frequency
- **Retention**: How long to keep backup files
- **Storage**: Local vs. cloud backup storage
- **Verification**: Test backup integrity regularly

**Configuration Backups**:
- **Settings Export**: Export system configuration
- **Environment Variables**: Backup critical configuration
- **OAuth Credentials**: Secure backup of authentication settings

### Maintenance Mode

**System Maintenance**:
- **Enable Maintenance Mode**: Block user access during updates
- **Custom Messages**: Display maintenance notifications
- **Admin Override**: Allow System Admin access during maintenance

## Troubleshooting

### Common Issues

**Settings Not Persisting**:
1. Check database connectivity
2. Verify System Admin permissions
3. Review server logs for errors
4. Ensure proper session authentication

**Public Event List Not Updating**:
1. Clear browser cache
2. Check that events are marked as active
3. Verify setting is properly saved
4. Test with incognito/private browsing

**API Access Issues**:
1. Confirm System Admin authentication
2. Check API endpoint URLs
3. Verify request format and headers
4. Review API logs for error details

### Getting Help

For additional system administration support:

- **Database Issues**: See [Database Monitoring](./database-monitoring.md)
- **Security Concerns**: Review [Security Overview](./security-overview.md)
- **OAuth Problems**: Check [Social Login Setup](./social-login-setup.md)
- **Event Issues**: Consult [Event Management](./event-management.md)

## Best Practices

### Configuration Management

1. **Document Changes**: Keep records of system setting modifications
2. **Test Settings**: Verify changes in development before production
3. **Monitor Impact**: Watch for user experience changes after updates
4. **Regular Reviews**: Periodically audit system settings for relevance

### Security Considerations

1. **Principle of Least Privilege**: Only enable features that are needed
2. **Regular Updates**: Keep system settings current with security best practices
3. **Access Logging**: Monitor who makes system-level changes
4. **Backup Critical Settings**: Ensure system configuration is recoverable

---
sidebar_position: 6
---

# Event Administration

This page covers advanced event management features for Event Admins and System Admins, including API endpoints, security considerations, and troubleshooting common issues.

## Admin API Endpoints

### System Admin Event Management

System Admins have access to system-wide event management APIs:

**Create New Event:**
```bash
POST /api/admin/events
{
  "name": "Conference 2024",
  "slug": "conference-2024",
  "description": "Annual technology conference",
  "organizationId": "optional-org-id"
}
```

**List All Events:**
```bash
GET /api/admin/events
```
Returns all events with statistics including user counts, report counts, and activity summaries.

**Get Specific Event Details:**
```bash
GET /api/admin/events/:eventId
```
Returns detailed event information including team composition and recent activity.

### System Admin Invite Management

**List Event Invites:**
```bash
GET /api/admin/events/:eventId/invites
```
Shows all invitation links for the event with usage statistics.

**Create Admin Invite:**
```bash
POST /api/admin/events/:eventId/invites
{
  "note": "admin@conference.org",
  "maxUses": 1,
  "expiresAt": "2024-12-31T23:59:59Z",
  "role": "Admin"
}
```

**Update Invite Settings:**
```bash
PATCH /api/admin/events/:eventId/invites/:inviteId
{
  "maxUses": 5,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### Event Admin Management APIs

**Get Event Details:**
```bash
GET /api/events/slug/:slug
```
Returns event information scoped to the requesting user's permissions.

**Update Event Settings:**
```bash
PATCH /api/events/slug/:slug
{
  "name": "Updated Event Name",
  "description": "Updated description",
  "website": "https://example.com",
  "contactEmail": "contact@example.com"
}
```

**Upload Event Logo:**
```bash
POST /api/events/slug/:slug/logo
Content-Type: multipart/form-data
```

**List Event Users:**
```bash
GET /api/events/slug/:slug/users
```
Returns team members with their roles and activity information.

**Create User Invites:**
```bash
POST /api/events/slug/:slug/invites
{
  "emails": ["user1@example.com", "user2@example.com"],
  "role": "Responder",
  "message": "Welcome to our event team!"
}
```

See the [API Reference](/api) for complete documentation with request/response examples.

## Report Management Integration

Events integrate closely with the incident reporting system:

### Report Access Control

**Event-Scoped Reports:**
- All reports belong to exactly one event
- Users cannot access reports from other events
- Report visibility is controlled by event roles

**Role-Based Report Access:**
- **Reporters**: Can only see their own submitted reports
- **Responders**: Can view and manage all event reports
- **Event Admins**: Full access to all event reports and analytics

### Report Features by Event

**Report Titles:**
- All reports require descriptive titles (10-70 characters)
- Titles help with organization and searching
- Clear titles improve response team efficiency

**Evidence Uploads:**
- Multiple file attachments supported per report
- Files are scoped to the event for security
- Event admins can configure upload limits

**Assignment System:**
- Reports can be assigned to specific responders
- Assignment notifications keep team informed
- Workload distribution across team members

**Severity Levels:**
- Low, medium, high, critical severity options
- Helps prioritize response efforts
- Can trigger different notification rules

**Resolution Tracking:**
- Outcome documentation when reports are resolved
- Status tracking throughout incident lifecycle
- Historical data for pattern analysis

## Security and Audit

### Access Control Implementation

**System Admin Isolation:**
- Cannot access event data without explicit roles
- Maintains separation between system and event administration
- Prevents accidental data access across events

**Event Isolation:**
- Users cannot access other events' data
- Strong database-level isolation
- API endpoints validate event access

**Role Validation:**
- All actions validated against user permissions
- Real-time permission checking
- Consistent enforcement across UI and API

**Invite Security:**
- Secure token generation for invite links
- Time-limited and usage-limited invitations
- Audit trail for all invitation activity

### Audit Logging

All event management actions are comprehensively logged:

**Event Creation:**
- System Admin actions logged with full details
- Includes event metadata and initial configuration
- Tracks who created what and when

**Role Assignments:**
- User role changes tracked with before/after states
- Includes who made the change and why
- Automatic and manual role changes distinguished

**Settings Updates:**
- Event configuration changes recorded
- Field-level change tracking
- Rollback capability for critical changes

**Access Attempts:**
- Unauthorized access attempts logged
- Failed authentication tracked
- Suspicious activity patterns identified

### Audit Log Access

**Event Admins:**
- Can view audit logs for their events
- See team member activity and changes
- Monitor event configuration changes

**System Admins:**
- Can view system-wide audit logs
- Monitor cross-event patterns
- Investigate security incidents

**Compliance Support:**
- Audit logs support regulatory compliance
- Data retention policies enforced
- Export capabilities for legal requirements

## Event Lifecycle Management

### Event States

**Inactive Events:**
- Created but not yet fully configured
- Limited functionality until activation
- Not visible in public listings

**Active Events:**
- Fully operational with all features
- Can receive and process incident reports
- Visible to users with appropriate roles

**Disabled Events:**
- Temporarily suspended by System Admins
- Data preserved but access restricted
- Can be re-enabled when issues resolved

**Archived Events:**
- Completed events with historical data
- Read-only access for reference
- Long-term data retention

### Lifecycle Transitions

**Activation Process:**
1. Complete basic event configuration
2. Set up initial team members
3. Configure code of conduct
4. Verify all settings
5. Activate for full operation

**Deactivation Process:**
1. Notify team members of status change
2. Complete any pending incident reports
3. Export necessary data
4. Disable event access
5. Archive for historical reference

## Troubleshooting Common Issues

### Event Access Problems

**System Admin cannot access event data:**
- **Solution**: Have an Event Admin assign an appropriate event role
- **Why**: System Admins are isolated from event data for security
- **Check**: Verify role assignment in team management

**Event creation fails:**
- **Check slug uniqueness**: Ensure the slug isn't already in use
- **Verify slug format**: Only lowercase letters, numbers, and hyphens
- **Confirm permissions**: Ensure you have System Admin or Organization Admin role
- **Review required fields**: All mandatory fields must be completed

**Invite links not working:**
- **Check expiration date**: Verify the invite hasn't expired
- **Verify usage limits**: Ensure the invite hasn't exceeded max uses
- **Test link integrity**: Copy the complete URL including parameters
- **Check user registration**: Ensure the invitee can create an account

**Event not appearing in lists:**
- **Check user role assignment**: Verify users have appropriate event roles
- **Verify event active status**: Ensure event is activated
- **Review permission settings**: Confirm proper access controls
- **Refresh data**: Try clearing cache or refreshing the page

### Performance Issues

**Slow event loading:**
- **Check database indexes**: Verify proper indexing on event queries
- **Monitor API response times**: Identify bottlenecks in data fetching
- **Review caching strategy**: Ensure effective caching of event data
- **Analyze user load**: Consider scaling for high-traffic events

**Large team management:**
- **Paginate user lists**: Break large teams into manageable pages
- **Optimize role queries**: Use efficient database queries for roles
- **Cache team data**: Reduce repeated lookups for team information
- **Batch operations**: Use bulk operations for role changes

### Data Integrity Issues

**Missing event data:**
- **Check database consistency**: Verify referential integrity
- **Review backup procedures**: Ensure proper data backup
- **Validate migration scripts**: Check for data migration issues
- **Monitor audit logs**: Look for unusual data changes

**Role assignment problems:**
- **Verify role validation**: Ensure proper role checking
- **Check permission inheritance**: Verify role-based permissions
- **Review audit trail**: Track role assignment history
- **Test role functionality**: Validate role-based features

## Getting Help

### Support Channels

**For Event Management Issues:**
1. **Check user roles and permissions**: Verify appropriate access
2. **Review event configuration**: Ensure proper setup
3. **Consult audit logs**: Look for error patterns
4. **Contact system administrators**: For technical issues
5. **Reference troubleshooting guide**: For common problems

**For Technical Problems:**
1. **Check system logs**: Look for error messages
2. **Test with different browsers**: Rule out client issues
3. **Verify network connectivity**: Ensure stable connections
4. **Contact technical support**: For persistent problems
5. **Review API documentation**: For integration issues

### Information to Provide

When seeking help, include:

**Event Information:**
- Event name and slug
- Event status (active/inactive)
- Team size and composition
- Recent configuration changes

**User Information:**
- Affected user accounts
- User roles in the event
- When the issue started
- Steps already attempted

**Technical Details:**
- Browser and version
- Error messages or screenshots
- API responses (if applicable)
- Network or performance issues

## Future Enhancements

Planned event administration improvements include:

**Bulk Operations:**
- Manage multiple events simultaneously
- Bulk role assignments across events
- Mass configuration updates

**Event Templates:**
- Reusable event configurations
- Standard team structures
- Pre-configured settings

**Advanced Analytics:**
- Event usage and engagement metrics
- Team performance analytics
- Cross-event comparison tools

**Integration APIs:**
- Connect with external event management systems
- Automated data synchronization
- Third-party service integrations

**Automated Workflows:**
- Streamlined event lifecycle management
- Automated team notifications
- Scheduled event operations

These enhancements will provide even more powerful tools for event administrators while maintaining the current security and isolation features. 
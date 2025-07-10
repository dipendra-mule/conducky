---
sidebar_position: 6
---

# Frequently Asked Questions (FAQ)

This section covers the most common questions users have about Conducky.

## General Questions

### What is Conducky?

Conducky is a comprehensive incident management platform designed specifically for conferences, events, and organizations that need to handle Code of Conduct incidents. It provides a secure, multi-tenant system where different events can manage their incidents independently while maintaining proper role-based access controls.

### Who should use Conducky?

Conducky is designed for:
- **Conference organizers** who need to manage Code of Conduct incidents
- **Event safety teams** that handle harassment and conduct violations
- **Community managers** dealing with member conduct issues
- **Organizations** that need formal incident tracking and response workflows

### How does Conducky protect privacy and confidentiality?

Conducky takes privacy seriously with several built-in protections:
- **Event isolation**: Incidents are strictly scoped to individual events
- **Role-based access**: Users only see information they're authorized to view
- **Secure authentication**: All access requires proper login credentials
- **Internal/external comments**: Sensitive discussions can be kept internal to the response team
- **Evidence protection**: Files are securely stored and access-controlled

## Getting Started

### How do I get access to Conducky?

Access to Conducky typically comes through:
1. **Event invitations**: Event administrators send invitation links
2. **Direct registration**: If you're setting up the first account (becomes System Admin)
3. **Invite codes**: Some events provide codes you can use to join

### I received an invitation link. What do I do?

1. Click the invitation link you received
2. If you don't have an account, create one by clicking "Create Account"
3. If you already have an account, simply log in
4. Accept the invitation to join the event with your assigned role
5. You'll be redirected to the event dashboard

### I can't see any navigation or events. What's wrong?

This usually means:
- You're not logged in properly - check if your name appears in the user menu
- You don't have roles in any events - contact an event administrator
- There's a browser issue - try clearing cache or using incognito mode

See the [Troubleshooting Guide](./troubleshooting.md) for more details.

## User Roles and Permissions

### What are the different user roles?

**Event-level roles:**
- **Reporter**: Can submit incidents and view their own incidents
- **Responder**: Can view and respond to all incidents in the event
- **Event Admin**: Full management of the event, users, and settings

**System-level roles:**
- **System Admin**: Can create events and manage the overall system
- **Regular User**: Has no system-level privileges (most users)

### Can I have different roles in different events?

Yes! Conducky supports multi-event participation where you can have different roles in different events. For example, you might be an Event Admin for one conference and a Responder for another.

### What's the difference between System Admin and Event Admin?

- **System Admin**: System-wide access, can create events, but needs specific event roles to access event data
- **Event Admin**: Full control within a specific event, but no system-wide access

System Admins don't automatically have access to event data - they must be explicitly added to events by Event Admins.

## Incidents and Incident Management

### Who can submit incidents?

Anyone with at least "Reporter" role in an event can submit incidents. This includes:
- Event attendees (Reporter role)
- Response team members (Responder role)
- Event administrators (Event Admin role)

### Can I submit incidents anonymously?

Currently, anonymous reporting is not available. All incidents require the reporter to be logged in and have appropriate access to the event. This is planned for future releases.

### Who can see my incident?

Report visibility depends on your role and the incident:
- **Reporters**: Can only see their own incidents
- **Responders**: Can see all incidents in events where they have Responder role
- **Event Admins**: Can see all incidents in events they administer

### What happens after I submit an incident?

1. The incident is immediately available to the response team
2. Responders and Event Admins receive notifications (when implemented)
3. The response team can change the incident state (investigating, resolved, etc.)
4. Comments can be added for communication and documentation
5. You'll be able to track progress through the incident detail page

### Can I edit or delete my incident after submitting?

Currently, incidents cannot be edited or deleted by reporters after submission. If you need changes:
- Add a comment with additional information or corrections
- Contact the response team to request changes
- The response team can update incident details if needed

## Comments and Communication

### What's the difference between internal and external comments?

- **External comments**: Visible to everyone who can access the incident - **Internal comments**: Only visible to Responders and Event Admins

This allows the response team to have private discussions while keeping appropriate information visible to reporters.

### Can I edit or delete my comments?

Yes, you can edit and delete your own comments. Look for the three-dot menu (⋮) next to your comments for these options.

### How do I know if there are new comments on my incident?

Notifications will alert you to new activity on your incidents (when the notification system is fully implemented). You can also check the [Notification Center](./notification-center.md) for updates.

## Events and Organizations

### How do I join multiple events?

You can join multiple events by:
1. Receiving invitation links for each event
2. Using invite codes through your profile page (accessible from the user menu)
3. Being directly added by Event Admins

### Can I leave an event?

Yes, you can leave events through your profile page (accessible from the user menu). However:
- This will remove your access to all event data
- You won't be able to see incidents you submitted
- Event Admins can re-invite you if needed

### What happens if an event is disabled?

If an event is disabled by a System Admin:
- Event data remains intact but becomes inaccessible
- Users cannot access the event dashboard or incidents
- Only System Admins can re-enable disabled events

## Technical Questions

### What browsers are supported?

Conducky works best with modern browsers:
- **Recommended**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: All modern mobile browsers
- **Features**: JavaScript must be enabled

### Is Conducky mobile-friendly?

Yes! Conducky is designed with mobile-first principles:
- Responsive design works on all screen sizes
- Touch-friendly interface for smartphones and tablets
- Optimized navigation for mobile devices

### Can I use Conducky offline?

No, Conducky requires an internet connection to function. All data is stored securely on the server and requires real-time access.

### How is my data backed up?

Data backup and security are handled by your system administrators. For specific backup policies and data retention, contact your organization's administrators.

## Integration and API

### Does Conducky have an API?

Yes! Conducky provides a comprehensive REST API. See the [API Reference](/api) for complete documentation.

### Can Conducky integrate with other systems?

The API allows for various integrations. Common integration points include:
- **Email systems**: For notifications and incident submission
- **Chat platforms**: For team notifications (Slack, Discord, etc.)
- **Analytics tools**: For reporting and metrics
- **Authentication systems**: For single sign-on (SSO)

Contact your system administrators about specific integration needs.

## Account and Profile Management

### How do I change my password?

1. Go to your Profile Settings (accessible from the user menu)
2. Look for the "Change Password" section
3. Enter your current password and new password
4. Click "Update Password"

### Can I change my email address?

Yes, you can update your email address in Profile Settings (accessible from the user menu). Note that this is the email used for login, so make sure you remember the new address.

### How do I update my profile picture?

Profile pictures (avatars) can be updated in Profile Settings (accessible from the user menu). Look for the avatar section and upload a new image.

### Can I delete my account?

Account deletion must be handled by system administrators. Contact your organization's System Admin if you need your account deleted.

## Troubleshooting

### I'm getting a 404 error when trying to access an event

This usually means:
- The event URL is incorrect (check the spelling)
- You don't have access to the event
- The event has been disabled
- You're not logged in

### The sidebar navigation isn't showing

The sidebar only appears when you:
- Are logged in
- Have roles in at least one event
- Are in an appropriate page context

See [Navigation Issues](./troubleshooting.md#navigation-issues) for more details.

### I can't submit an incident - the form isn't working

Check that:
- You have at least Reporter role in the event
- All required fields are filled out correctly
- Any file uploads meet size and format requirements
- Your internet connection is stable

### My notifications aren't working

The notification system may not be fully enabled in your installation. Contact your system administrators if you're not receiving expected notifications.

## Getting Help

### Where can I get more help?

1. **Documentation**: Check the [User Guide](./intro), [Admin Guide](../admin-guide/intro), or [Developer Docs](../developer-docs/intro)
2. **Troubleshooting**: See the detailed [Troubleshooting Guide](./troubleshooting.md)
3. **Event issues**: Contact your event administrators
4. **System issues**: Contact your system administrators
5. **Community**: Join discussions on [GitHub](https://github.com/mattstratton/conducky/discussions)

### How do I incident a bug or request a feature?

- **Bugs**: Report issues on [GitHub Issues](https://github.com/mattstratton/conducky/issues)
- **Feature requests**: Start a discussion on [GitHub Discussions](https://github.com/mattstratton/conducky/discussions)
- **Security issues**: Contact the maintainers directly (see the project's security policy)

### Can I contribute to Conducky?

Yes! Conducky welcomes contributions:
- **Code**: See the [Contributing Guide](https://github.com/mattstratton/conducky/blob/main/CONTRIBUTING.md)
- **Documentation**: Improvements and translations are welcome
- **Testing**: Help test new features and incident issues
- **Feedback**: Share your experience and suggestions

---

**Didn't find your question here?** 

Check the [Troubleshooting Guide](./troubleshooting.md) for technical issues, or ask in the [GitHub Discussions](https://github.com/mattstratton/conducky/discussions) for community support.
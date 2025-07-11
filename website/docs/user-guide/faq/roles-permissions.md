---
sidebar_position: 3
---

# Roles & Permissions FAQ

Understanding user roles and what each role can do in Conducky.

## What are the different user roles?

**Event-level roles:**
- **Reporter**: Can submit incidents and view their own incidents
- **Responder**: Can view and respond to all incidents in the event
- **Event Admin**: Full management of the event, users, and settings

**System-level roles:**
- **System Admin**: Can create events and manage the overall system
- **Regular User**: Has no system-level privileges (most users)

## Can I have different roles in different events?

Yes! Conducky supports multi-event participation where you can have different roles in different events. For example, you might be an Event Admin for one conference and a Responder for another.

## What's the difference between System Admin and Event Admin?

- **System Admin**: System-wide access, can create events, but needs specific event roles to access event data
- **Event Admin**: Full control within a specific event, but no system-wide access

System Admins don't automatically have access to event data - they must be explicitly added to events by Event Admins.

## What can Reporters do?

**Reporters can:**
- Submit new incident reports
- View their own submitted reports
- Add comments to their own reports
- Upload evidence and documentation
- Track the status of their reports

**Reporters cannot:**
- See reports from other users
- Change report states or assignments
- Access team management features
- See internal team discussions

## What can Responders do?

**Responders can:**
- View all reports in events where they have Responder role
- Change report states (submitted → investigating → resolved → closed)
- Assign reports to team members
- Add internal and external comments
- Access evidence and sensitive information
- See team member information and roles
- Participate in internal discussions

**Responders cannot:**
- Invite new users or change roles
- Modify event settings
- Access system administration features

## What can Event Admins do?

**Event Admins have full event management capabilities:**

**User Management:**
- Invite new team members with any role
- Change user roles within the event
- Remove users from the event
- View team member activity and statistics

**Event Configuration:**
- Modify event details (name, description, dates)
- Upload event logos and branding
- Configure Code of Conduct content
- Set up event-specific settings and policies

**Report Management:**
- View and manage all reports in the event
- Change report states and assignments
- Add internal and external comments
- Access sensitive information and evidence

## How do I know what role I have in each event?

You can check your roles by:
1. **Event dashboard**: Your role is displayed on each event's main page
2. **Profile page**: Shows all your roles across different events
3. **Navigation menu**: Available options reflect your permissions
4. **Event team page**: Lists all team members and their roles

*Screenshot needed: Event dashboard showing user role and permissions*

## Can my role be changed?

Yes, roles can be changed by:
- **Event Admins** can change roles within their events
- **System Admins** can assign system-level roles
- **You cannot change your own role** - this requires administrator action

Contact the appropriate administrators if you need different permissions.

## What happens if I'm removed from an event?

If you're removed from an event:
- You lose access to all event data immediately
- You cannot see incidents you previously submitted
- Your comments remain but you cannot edit them
- You can be re-invited by Event Admins if needed

## Do I need different accounts for different events?

No! You use the same account across all events. Your single account can have different roles in different events, and you can switch between events using the event selector in the navigation.

## Why can't I see certain features or options?

If you can't see expected features:
1. **Check your role**: You might not have permission for that feature
2. **Verify the event**: Make sure you're in the correct event context
3. **Check your browser**: Try refreshing or clearing cache
4. **Contact administrators**: They can verify your permissions

## How do permissions work across multiple events?

Permissions are **event-specific**:
- Your role in Event A doesn't affect your permissions in Event B
- You need separate role assignments for each event
- System Admins still need event-specific roles to access event data
- You can have any combination of roles across different events

*Screenshot needed: Multi-event role display showing different permissions per event* 
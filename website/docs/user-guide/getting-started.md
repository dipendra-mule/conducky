---
sidebar_position: 2
---

# Getting Started

Welcome to the Conducky User Guide! This comprehensive guide will help you get started with Conducky, from creating your first account to managing reports and teams.

## 🚀 Before You Begin

**New to Conducky?** Consider starting with our [5-Minute Quick Start](./quick-start) for a faster introduction.

**Already familiar with the basics?** Jump to specific sections using the table of contents or check our [FAQ](./faq) for quick answers.

---

## Account Creation and Authentication

### Creating an Account

New users can create an account in several ways:

#### 1. **Direct Registration** (First User)
Visit `/register` to create a new account when setting up a new Conducky instance:

1. **Navigate** to your organization's Conducky URL + `/register`
2. **Enter** your email address, full name, and password
3. **Password requirements**: 8+ characters, mix of letters, numbers, symbols
4. **Automatic elevation**: The first user to register becomes a SuperAdmin automatically
5. **Next steps**: Subsequent users need invitations to access functionality

:::tip First User Benefits
As the first user, you become a SuperAdmin with full system access. You can create events, manage system settings, and invite other users.
:::

#### 2. **Invitation Links** (Most Common)
Most users join through event invitations sent by administrators:

1. **Click** the invitation link sent by an event administrator
2. **Create account** or log in if you already have one
3. **Accept invitation** to join the event with the specified role
4. **Automatic redirect** to the event dashboard

**Example invitation workflow:**
```
Event Admin sends link → You click link → Create/login → Accept invite → Access event
```

#### 3. **Invite Codes** (Alternative Method)
Some organizations provide codes you can redeem yourself:

1. **Get the code** from your event administrator
2. **Log in** to your Conducky account
3. **Go to** `/profile/events`
4. **Enter code** in the "Join Event" section
5. **Confirm** your participation

### Password Management

#### Forgot Password
1. **Visit** the login page
2. **Click** "Forgot Password" link
3. **Enter** your email address
4. **Check email** for reset link
5. **Follow link** to `/reset-password`
6. **Create** new password

#### Change Password
Update your password anytime from your profile:
1. **Navigate** to Profile Settings (accessible from the user menu)
2. **Find** "Change Password" section
3. **Enter** current password and new password
4. **Click** "Update Password"

:::warning Security Best Practices
- Use a unique, strong password
- Don't share your account credentials
- Log out when using shared computers
- Report any suspicious activity to administrators
:::

---

## First Steps After Login

After logging into Conducky, you'll be directed to your appropriate starting point based on your user type and event memberships.

### Understanding Your Dashboard

#### First-Time Users
**What you'll see:**
- Global dashboard with information about joining events
- Instructions for getting started
- Links to documentation and support

**Next steps:**
1. Wait for event invitations from administrators
2. Check your email for invitation links
3. Contact organizers if you need access to specific events

#### Single Event Users
**What you'll see:**
- Global dashboard showing your one event
- Quick access to event features
- Event-specific statistics and activity

**What you can do:**
- Click "Go to Event" to enter the event workspace
- Submit reports if you have Reporter role or higher
- View your role and permissions

#### Multi-Event Users
**What you'll see:**
- Global dashboard with cards for all your events
- Cross-event statistics and activity
- Quick navigation between events

**What you can do:**
- Switch between events using event cards
- View consolidated reports across events
- Manage your profile and settings globally

#### SuperAdmins
**What you'll see:**
- Global dashboard with system administration options
- Access to create new events
- System-wide management features

**Important note:** SuperAdmins need explicit event roles to access event data!

### Home Page for Visitors

Before logging in, the Conducky home page content depends on system configuration:

#### Public Event Listing Enabled
- **Shows:** List of all active events with links to public event pages
- **Purpose:** Allows visitors to learn about events and find contact information
- **Access:** Available to anyone visiting the site

#### Public Event Listing Disabled
- **Shows:** Login and registration options only
- **Purpose:** Keeps events private and requires authentication for all access
- **Access:** Users must log in to see any event information

:::info Administrator Control
The public event listing can be controlled by SuperAdmins through System Settings. This affects what visitors see before authentication.
:::

---

## Understanding Navigation

Conducky uses a three-level navigation system designed to help you work efficiently across different contexts:

### 1. **Global Dashboard** (`/dashboard`)
**Purpose:** Multi-event overview and system-wide access
**Who sees it:** All logged-in users
**What's here:**
- Cards for all events you belong to
- Cross-event reporting features (for multi-event users)
- Profile and account management access
- System admin features (SuperAdmins only)

### 2. **Event Context** (`/events/[eventSlug]/`)
**Purpose:** Event-specific functionality and team collaboration
**Who sees it:** Users with roles in the specific event
**What's here:**
- Event dashboard with activity overview
- Report submission and management
- Team management (Event Admins)
- Event-specific settings

### 3. **System Admin** (`/admin/`)
**Purpose:** Installation and system management
**Who sees it:** SuperAdmins only
**What's here:**
- Event creation and management
- System-wide configuration
- User management across events
- Global settings and maintenance

:::tip Navigation Tips
- Use breadcrumbs at the top to understand your current location
- The sidebar navigation changes based on your current context
- Your role in each event determines what navigation items you see
:::

**Need more navigation help?** See the detailed [Navigation Guide](./navigation.md).

---

## Profile Management

### Profile Settings (User Menu)

Manage your personal account information:

#### Profile Information
- **Name**: Display name shown to other users
- **Email**: Login email and contact address
- **Avatar**: Profile picture (optional)
- **Bio**: Brief description (if enabled)

#### Security Settings
- **Password**: Change your account password
- **Two-Factor Authentication**: Enable additional security (if available)
- **Active Sessions**: View and manage login sessions

#### Notification Preferences
- **Email notifications**: Control what emails you receive
- **In-app notifications**: Manage notification types and frequency
- **Quiet hours**: Set times when you don't want notifications

#### Privacy Settings
- **Profile visibility**: Control who can see your profile information
- **Contact preferences**: Manage how others can contact you

:::tip Profile Best Practices
- Keep your email address current for important notifications
- Use a professional profile picture if your events are work-related
- Review notification settings to avoid email overload
:::

### Event Management (`/profile/events`)

View and manage your event memberships:

#### Current Events
**What you'll see:**
- List of all events you belong to
- Your role in each event
- Event status (active, upcoming, past)
- Quick actions for each event

**Available actions:**
- **Go to Event**: Jump directly to event dashboard
- **View Role**: See your permissions and responsibilities
- **Leave Event**: Remove yourself from the event (with confirmation)

#### Join Events
**Invite codes:**
- Enter codes provided by event administrators
- Automatically assigned the role specified by the code
- Immediate access upon successful redemption

**Invitation status:**
- View pending invitations
- Accept or decline invitations
- See invitation history

#### Role Information
Understanding your permissions in each event helps you know what you can do:

**Reporter permissions:**
- Submit new reports
- View and edit your own reports
- Add comments to your reports
- Upload evidence to your reports

**Responder permissions:**
- Everything Reporters can do, plus:
- View all reports submitted to the event
- Change report states (submitted → investigating → resolved)
- Assign reports to team members
- Add internal comments for team communication
- Add external comments visible to reporters
- Access cross-event reporting (if you're in multiple events)

**Event Admin permissions:**
- Everything Responders can do, plus:
- Manage team members and their roles
- Create and send invitation links
- Configure event settings and information
- Access event analytics and reporting
- Manage public event pages
- Oversee the entire incident response process

:::warning Leaving Events
When you leave an event, you lose access to all event data, including reports you submitted. Event Admins can re-invite you if needed.
:::

---

## Your First Event

### Joining an Event

Most users join events through invitation links sent by event administrators. Here's the complete process:

#### Step-by-Step Invitation Process

1. **Receive invitation**
   - Email from event administrator
   - Contains unique invitation link
   - Specifies your intended role

2. **Click invitation link**
   - Opens Conducky in your browser
   - May prompt you to log in or create account
   - Shows invitation details

3. **Authentication**
   - **Existing users**: Log in with your credentials
   - **New users**: Click "Create Account" and fill out registration
   - **Password requirements**: Follow security guidelines

4. **Accept invitation**
   - Review event details and your assigned role
   - Click "Accept Invitation" to confirm
   - **Note**: You can decline if you don't want to participate

5. **Automatic redirect**
   - Taken directly to the event dashboard
   - Event-specific navigation appears in sidebar
   - Can immediately access features based on your role

#### Alternative: Invite Codes

If you have an invite code instead of a link:

1. **Log in** to your Conducky account
2. **Navigate** to `/profile/events`
3. **Find** "Join Event" section
4. **Enter** the invite code provided by the administrator
5. **Click** "Join Event" to redeem the code
6. **Confirm** your participation

### Understanding Your Role

Your role in each event determines what you can see and do. Here's what each role can accomplish:

#### Reporter Role
**Best for:** Event attendees, community members
**Primary purpose:** Submit and track incident reports

**What you can do:**
- Submit new reports about incidents
- View all your submitted reports
- Edit reports before final submission
- Add comments and additional information
- Upload evidence files (photos, documents)
- Track the status of your reports
- Communicate with the response team

**What you can't do:**
- View other people's reports
- Change report states or assignments
- Access team management features
- Configure event settings

**Typical workflow:**
1. Witness or experience an incident
2. Submit a report with details and evidence
3. Monitor progress and respond to team questions
4. Provide additional information as needed

#### Responder Role
**Best for:** Code of Conduct team members, safety volunteers
**Primary purpose:** Handle and respond to incident reports

**What you can do:**
- Everything Reporters can do, plus:
- View all reports submitted to the event
- Change report states (submitted → investigating → resolved)
- Assign reports to team members
- Add internal comments for team communication
- Add external comments visible to reporters
- Access cross-event reporting (if you're in multiple events)

**What you can't do:**
- Manage team membership
- Create invitation links
- Configure event settings
- Access event administration features

**Typical workflow:**
1. Receive notification of new report
2. Review report details and evidence
3. Begin investigation and change state
4. Communicate with reporter and team
5. Work toward resolution
6. Update report status and close case

#### Event Admin Role
**Best for:** Event organizers, safety team leads
**Primary purpose:** Manage the entire event safety operation

**What you can do:**
- Everything Responders can do, plus:
- Manage team members and their roles
- Create and send invitation links
- Configure event settings and information
- Access event analytics and reporting
- Manage public event pages
- Oversee the entire incident response process

**What you can't do:**
- Create new events (SuperAdmin function)
- Access other events without explicit roles
- Modify system-wide settings

**Typical workflow:**
1. Set up event before it starts
2. Invite and train response team
3. Monitor incident activity during event
4. Ensure proper response to all reports
5. Conduct post-event analysis and improvements

:::tip Role Progression
Many users start as Reporters and may be promoted to Responder or Event Admin roles as they gain experience and trust within the community.
:::

### Getting Oriented in Your Event

Once you've joined an event, take a few minutes to explore and understand the environment:

#### Explore the Event Dashboard
1. **Event information**: Name, dates, description
2. **Recent activity**: Latest reports and team actions
3. **Quick stats**: Summary of reports, team size, activity levels
4. **Navigation sidebar**: Changes based on your role

#### Understand Event-Specific Features
1. **Report submission**: Know how to submit reports quickly
2. **Team roster**: See who's on the response team
3. **Event policies**: Review any specific guidelines
4. **Contact information**: Know how to reach administrators

#### Test Key Functions
1. **Submit a test report** (if appropriate for your role)
2. **Explore navigation** to understand available features
3. **Check notification settings** for this event
4. **Verify your contact information** is current

---

## Cross-Event Features

If you participate in multiple events, Conducky provides powerful tools to manage your multi-event responsibilities efficiently.

### Global Reports Dashboard (`/dashboard/reports`)

**Purpose:** Unified view of reports across all your events
**Who can access:** Users with Responder or Event Admin roles in any event
**What you can do:**
- View reports from all events where you have appropriate access
- Filter by event, status, assignment, and priority
- Search across all reports simultaneously
- Perform bulk actions on multiple reports
- Track your workload across multiple events

**Advanced filtering options:**
- **By event**: Focus on specific events
- **By status**: Find reports needing attention
- **By assignment**: See what's assigned to you
- **By priority**: Handle urgent matters first
- **By date range**: Review activity over time
- **By reporter**: Track specific individuals (responders only)

**Benefits for multi-event users:**
- **Efficiency**: No need to switch between events constantly
- **Prioritization**: See urgent reports from all events in one place
- **Workload management**: Balance responsibilities across events
- **Pattern recognition**: Identify trends across your events

### Notification Center (`/dashboard/notifications`)

**Purpose:** Centralized alerts for all your event activities
**Who can access:** All logged-in users
**What you get notified about:**
- New report submissions in your events
- Status changes on reports you're involved with
- Comments added to your reports
- Assignment changes and team updates
- Event-specific announcements

**Notification features:**
- **Priority levels**: Urgent, high, normal, low
- **Type filtering**: Reports, comments, assignments, announcements
- **Read/unread status**: Track what you've seen
- **Direct actions**: Click to go directly to relevant content
- **Mobile optimized**: Works great on phones and tablets

**Customization options:**
- **Email preferences**: Choose what triggers emails
- **Frequency settings**: Immediate, hourly, daily digests
- **Quiet hours**: Set times when you don't want notifications
- **Event-specific settings**: Different rules for different events

:::tip Notification Strategy
For multi-event users, consider setting up email notifications for urgent items and using the in-app notification center for everything else.
:::

### Profile Management for Multi-Event Users

**Global profile benefits:**
- **Single login**: One account for all your events
- **Consistent identity**: Same name and avatar across events
- **Unified settings**: Manage preferences once
- **Cross-event history**: Track your involvement over time

**Event-specific considerations:**
- **Different roles**: You might be a Reporter in one event, Admin in another
- **Role-based access**: Navigation changes based on your role in each event
- **Event switching**: Easy navigation between your events
- **Separate contexts**: Activities in one event don't affect others

---

## Next Steps and Recommendations

Now that you understand the basics, here are recommended next steps based on your role:

### For All Users

<div className="next-steps">
  <div className="step">
    <h3>🔍 Explore Navigation</h3>
    <p>Understand how to move around efficiently</p>
    <a href="./navigation">Learn Navigation →</a>
  </div>
  
  <div className="step">
    <h3>❓ Check the FAQ</h3>
    <p>Quick answers to common questions</p>
    <a href="./faq">Browse FAQ →</a>
  </div>
  
  <div className="step">
    <h3>🆘 Troubleshooting</h3>
    <p>Solutions for common issues</p>
    <a href="./troubleshooting">Get Help →</a>
  </div>
</div>

### For Reporters
**Your priorities:**
1. **Practice submitting reports** - Understand the process before you need it
2. **Bookmark your event dashboard** - Quick access when needed
3. **Set up notifications** - Stay informed about your reports
4. **Review event policies** - Understand what types of incidents to report

**Recommended reading:**
- [Authentication Guide](./authentication) - Account security
- [FAQ](./faq) - Common questions about reporting
- [Troubleshooting](./troubleshooting) - Solutions for common issues

### For Responders
**Your priorities:**
1. **Learn report management** - Practice changing states and adding comments
2. **Understand team communication** - Use internal comments effectively
3. **Set up cross-event views** - If you work multiple events
4. **Configure notifications** - Stay on top of new reports

**Recommended reading:**
- [Report Comments Guide](./report-comments) - Team communication
- [Cross-Event Reports](./cross-event-reports) - Multi-event management
- [Notification Center](./notification-center) - Stay informed

### For Event Admins
**Your priorities:**
1. **Set up your team** - Invite and train responders
2. **Configure event settings** - Customize for your event's needs
3. **Learn user management** - Handle team changes effectively
4. **Plan for launch** - Prepare before your event starts

**Recommended reading:**
- [Event Management Guide](./event-management) - Complete event setup
- [User Management](./user-management) - Team administration
- [Invite Links](./invite-links) - Adding team members

### For SuperAdmins
**Your priorities:**
1. **Complete system setup** - Configure global settings
2. **Create initial events** - Set up for your organization
3. **Train Event Admins** - Prepare others to manage events
4. **Review security settings** - Ensure proper system protection

**Recommended reading:**
- [Admin Guide](../admin-guide/intro) - System administration
- [System Configuration](../admin-guide/system-configuration) - Global settings
- [Deployment Guide](../admin-guide/deployment) - Installation and maintenance

---

## Getting Help

### Self-Service Resources

**Quick problems:**
- [FAQ](./faq) - Immediate answers to common questions
- [Troubleshooting](./troubleshooting) - Step-by-step problem solving
- [Navigation Guide](./navigation) - Understanding the interface

**Learning more:**
- Complete [User Guide](./intro) sections relevant to your role
- [Recent Updates](./recent-updates) - New features and changes
- [Public Event Pages](./public-event-pages) - Understanding public information

### Contact Support

**For event-specific issues:**
- Contact your event administrators
- Use team communication features
- Check event-specific documentation

**For account or system issues:**
- Contact your system administrators
- Report technical problems with specific details
- Use proper channels for security concerns

**For community help:**
- [GitHub Discussions](https://github.com/mattstratton/conducky/discussions) - Community support
- [GitHub Issues](https://github.com/mattstratton/conducky/issues) - Bug reports
- Documentation feedback - Help improve these guides

---

**Ready to dive deeper?** Continue with our specialized guides or return to the [User Guide overview](./intro) to explore specific topics.

🤖 This was generated by a bot. If you have questions, please contact the maintainers.

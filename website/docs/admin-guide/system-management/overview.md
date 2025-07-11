---
sidebar_position: 1
---

# System Management Overview

This guide covers System Admin functions for managing the overall Conducky system. System Admins have the highest level of access and are responsible for platform-wide administration.

## 🔐 System Admin Role

System Admins have system-wide access and can:

- **Create new events and organizations** across the platform
- **View all events and organizations** in the system
- **Generate admin invite links** for events
- **Manage global system settings** (including public event listing)
- **Monitor system health and usage**
- **Configure OAuth providers** and authentication settings
- **Access system-wide analytics** and performance metrics

**Important**: System Admins have separate permissions from event-level roles. To access event data (reports, users, etc.), System Admins must be explicitly assigned an event role by an event admin.

## 🧭 System Admin Navigation

System Admins have access to a dedicated system administration interface through the sidebar navigation:

### Accessing System Admin Features

1. **Login as System Admin**: The sidebar will automatically show system admin navigation
2. **System Admin Section**: Look for the "System Admin" section in the sidebar with:
   - 🏠 **System Dashboard** - Overview of all events and system health
   - 🎯 **Events Management** - Create and manage events
   - 🏢 **Organizations** - Manage multi-tenant organizations
   - 👥 **User Management** - System-wide user administration
   - ⚙️ **System Settings** - Global configuration and OAuth setup
   - 📊 **Monitoring** - System performance and health metrics

### Context Switching

System Admins can switch between two contexts:

- **System Administration**: Managing the Conducky installation (pages starting with `/admin/`)
- **Personal Dashboard**: Participating in events as a regular user (`/dashboard` and pages starting with `/events/`)

## 🏗️ System Management Areas

The system management documentation is organized into focused areas:

### [Event Management](./event-management)
- Creating and configuring events
- Event lifecycle management
- Admin invite generation
- Event settings and customization

### [OAuth Configuration](./oauth-setup)
- Google OAuth setup and configuration
- GitHub OAuth setup and configuration
- Social login troubleshooting
- OAuth security best practices

### User Administration
- System-wide user management
- Role assignments across events
- User activity monitoring
- Account management and cleanup

### System Settings
- Global platform configuration
- Public event listing settings
- System-wide security policies
- Feature toggles and customization

### Monitoring & Performance
- System health monitoring
- Database performance tracking
- Usage analytics and reporting
- Performance optimization

### Security Administration
- Security best practices
- System-wide security policies
- Audit log management
- Incident response procedures

### Troubleshooting
- Common system issues and solutions
- Performance troubleshooting
- Configuration problems
- Recovery procedures

## 🚀 Quick Start for New System Admins

### 1. First Login
- Access the system with your System Admin credentials
- Familiarize yourself with the System Admin navigation
- Review the System Dashboard for platform overview

### 2. Initial Configuration
- Configure OAuth providers (Google/GitHub) for social login
- Review and update system settings
- Set up monitoring and alerting if needed

### 3. Create Your First Event
- Use the simplified event creation workflow
- Generate admin invite for event organizer
- Monitor event setup completion

### 4. User Management
- Review existing users and their roles
- Set up user management policies
- Configure user invitation processes

## 🔒 Security Considerations

### Access Control
- System Admin access should be limited to essential personnel
- Use strong authentication and consider MFA
- Regular review of System Admin accounts

### Data Protection
- System Admins can access system-wide data
- Follow data protection policies and regulations
- Implement proper audit logging

### Change Management
- Document all system-level changes
- Test changes in development environment first
- Maintain rollback procedures

## 📊 Monitoring Responsibilities

### System Health
- Monitor system performance and availability
- Track resource usage and capacity
- Respond to system alerts promptly

### User Activity
- Monitor user registration and activity trends
- Track event creation and usage patterns
- Identify and address abuse or unusual activity

### Security Monitoring
- Review audit logs regularly
- Monitor for security incidents
- Maintain incident response procedures

## 📚 Additional Resources

- **[API Documentation](../../developer-docs/api/overview)** - System Admin API endpoints
- **[Security Guide](../../security/overview)** - Platform security documentation
- **[Deployment Guide](../deployment)** - System deployment and maintenance 
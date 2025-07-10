---
sidebar_position: 18
---

# Data Security and Privacy

Conducky takes the security and privacy of your data seriously. This page explains how your sensitive information is protected within the platform.

## 🔒 Data Encryption at Rest

All sensitive data stored in the Conducky database is automatically encrypted using industry-standard encryption methods:

### What Data is Encrypted

**Incident Reports:**
- **Incident descriptions** - Your detailed reports of what happened
- **Parties involved** - Names or identifiers of people involved in incidents  
- **Location information** - Where incidents occurred
- **Comments** - All comments added to incident reports

**Event Information:**
- **Contact emails** - Event organizer contact information

**System Settings:**
- **OAuth credentials** - Third-party login configuration
- **SMTP passwords** - Email server credentials

### Encryption Technical Details

- **Algorithm**: AES-256-GCM (Advanced Encryption Standard with Galois/Counter Mode)
- **Key Management**: Secure encryption keys with PBKDF2 key derivation
- **Salt Generation**: Unique salt for each piece of encrypted data
- **Authentication**: Authenticated encryption prevents tampering

### What This Means for You

✅ **Your sensitive data is protected** even if someone gains unauthorized access to the database

✅ **Automatic encryption** happens transparently - you don't need to do anything special

✅ **Searchable when authorized** - authorized users can still search and filter your data normally

✅ **Performance optimized** - encryption is designed to minimize impact on system performance

## 🛡️ What Data is NOT Encrypted

For operational and performance reasons, some data is stored unencrypted but is still protected by access controls:

- **User accounts** - Email addresses and profile information (protected by authentication)
- **Event names and descriptions** - Public event information  
- **Audit logs** - System activity logs (contain only metadata, not sensitive content)
- **User roles and permissions** - Access control information
- **Timestamps and IDs** - Technical metadata for system operation

## 🔐 Access Controls

In addition to encryption, Conducky implements comprehensive access controls:

### Role-Based Access Control (RBAC)
- **System Administrators** - Full system access for platform management
- **Organization Administrators** - Access to their organization's events and data
- **Event Administrators** - Access to manage specific events
- **Responders** - Access to handle incident reports for assigned events
- **Reporters** - Can submit reports and view their own submissions

### Data Isolation
- **Multi-tenancy** - Each event's data is completely isolated from other events
- **Event-scoped access** - Users can only access data for events they're authorized for
- **Organization boundaries** - Organization data is isolated from other organizations

## 🌐 Data in Transit

All data transmitted between your browser and Conducky is protected:

- **HTTPS encryption** - All communications use TLS/SSL encryption
- **Secure headers** - Additional security headers protect against common attacks
- **Session security** - User sessions are protected with secure, HTTP-only cookies

## 📊 What You Can Do

### As a User:
- **Use strong passwords** - Choose unique, complex passwords for your account
- **Log out when done** - Especially on shared or public computers
- **Report security concerns** - Contact administrators if you notice anything suspicious

### As an Event Administrator:
- **Manage user access carefully** - Only grant roles to trusted individuals
- **Review user lists regularly** - Remove access for users who no longer need it
- **Use secure communication** - Don't share sensitive incident details outside the platform
- **Monitor audit logs** - Review system activity for your events

## 🔍 Transparency and Compliance

### Open Source Security
- Conducky is open source, allowing security experts to review the code
- Security implementations follow industry best practices
- Regular security updates and improvements

### Audit Trail
- All significant actions are logged for accountability
- Administrators can review who accessed what data and when
- Audit logs help ensure proper use of the system

### Data Retention
- You control how long your data is stored
- Event administrators can export and delete event data as needed
- System administrators can provide data exports upon request

## 🚨 Incident Response

If you suspect a security issue:

1. **Report immediately** to your event administrators or system administrators
2. **Don't attempt to investigate yourself** - This could interfere with proper incident response
3. **Document what you observed** - Include timestamps and screenshots if relevant
4. **Change your password** if you suspect your account may be compromised

## 📞 Questions or Concerns

If you have questions about data security or privacy:

- **Contact your event administrators** for event-specific questions
- **Contact system administrators** for platform-wide security questions
- **Review our documentation** for additional technical details
- **Check our changelog** for information about security updates

---

*This security overview is designed to help you understand how your data is protected. For technical implementation details, administrators should refer to the [Admin Security Guide](../admin-guide/security-overview.md).* 
---
sidebar_position: 11
---

# Security Overview and Encryption Management

This guide provides system administrators with comprehensive information about Conducky's security architecture, encryption implementation, and administrative security controls.

## 🔒 Database Encryption Implementation

### Overview

Conducky implements comprehensive database encryption for all sensitive user data using industry-standard AES-256-GCM encryption with authenticated encryption to prevent tampering.

### Encrypted Data Types

**Phase 1 - Core Incident Data (Implemented):**
- `Incident.description` - Detailed incident reports
- `Incident.parties` - Individuals involved in incidents
- `Incident.location` - Incident location information
- `IncidentComment.body` - All comments on incident reports

**Phase 2 - Extended Data (Implemented):**
- `Event.contactEmail` - Event organizer contact information

**System Settings (Pre-existing):**
- OAuth provider credentials
- SMTP server passwords
- Other sensitive system configuration

### Encryption Technical Specifications

**Algorithm:** AES-256-GCM (Advanced Encryption Standard, 256-bit key, Galois/Counter Mode)
- **Key Size:** 256 bits (32 bytes)
- **Authentication:** Built-in authentication tag prevents tampering
- **Mode:** GCM provides both confidentiality and authenticity

**Security Features:**
- **Unique Salt Per Operation:** Each encryption uses a unique salt to prevent rainbow table attacks
- **PBKDF2 Key Derivation:** Master encryption key is derived using PBKDF2 with high iteration count
- **Format:** `salt:iv:encrypted:authTag` (all hex-encoded)
- **Backward Compatibility:** Supports legacy 3-part format during migration

## 🔐 Encryption Key Management

### Environment Configuration

**Required Environment Variable:**
```bash
ENCRYPTION_KEY=your-secret-encryption-key-here
```

**Key Requirements:**
- **Minimum Length:** 32 characters
- **Recommended:** 64+ character random string
- **Character Set:** Alphanumeric and special characters
- **Generation:** Use cryptographically secure random generation

**Example Key Generation:**
```bash
# Generate a secure encryption key (produces ~64 character base64 string)
openssl rand -base64 48
```

### Production Deployment

**Railway Deployment:**
```bash
# Set encryption key via Railway CLI
railway variables set ENCRYPTION_KEY="your-generated-key-here"

# Verify key is set correctly
railway variables list | grep ENCRYPTION_KEY
```

**Docker/Docker Compose:**
```bash
# Add to .env file
echo "ENCRYPTION_KEY=your-generated-key-here" >> .env

# Or set in docker-compose.yml environment section
environment:
  - ENCRYPTION_KEY=your-generated-key-here
```

### Key Rotation (Advanced)

For security best practices, encryption keys should be rotated periodically:

1. **Generate New Key:** Create a new encryption key
2. **Deploy Migration:** Use migration scripts to re-encrypt data with new key
3. **Update Environment:** Replace old key with new key in production
4. **Verify Operation:** Test that all encrypted data can be accessed

*Note: Key rotation requires planned maintenance and careful coordination.*

## 🛡️ Security Architecture

### Multi-Layer Security Model

**1. Network Security:**
- HTTPS/TLS encryption for all communications
- Secure headers (HSTS, CSP, X-Frame-Options)
- Rate limiting on sensitive endpoints

**2. Authentication & Authorization:**
- Passport.js-based authentication
- Session-based authentication with secure cookies
- Role-Based Access Control (RBAC)
- Multi-tenancy with event-scoped data isolation

**3. Data Protection:**
- Database encryption for sensitive data
- Input validation and sanitization
- SQL injection prevention via Prisma ORM
- XSS protection through output encoding

**4. Audit & Monitoring:**
- Comprehensive audit logging
- Database performance monitoring
- Failed authentication tracking
- Administrative action logging

### Role-Based Access Control (RBAC)

**System Roles:**
- **System Admin** - Full platform access and management
- **Organization Admin** - Organization-wide access and management
- **Organization Viewer** - Read-only organization access
- **Event Admin** - Event-specific administrative access
- **Responder** - Incident handling and response
- **Reporter** - Incident reporting and own submissions

**Permission Inheritance:**
- System Admin → All permissions
- Organization Admin → All events in organization
- Event Admin → Specific event only
- Role levels prevent privilege escalation

## 📊 Database Performance Considerations

### Query Limitations with Encryption

**Operations NOT Available on Encrypted Fields:**
- `LIKE` queries for text search
- `ORDER BY` on encrypted content
- Database-level aggregations
- Server-side full-text search

**Workarounds Implemented:**
- Client-side filtering after decryption
- Search indexing on non-encrypted metadata
- Optimized queries with proper database indexes
- Batch operations for performance

### Performance Monitoring

**Database Monitoring Service:**
- Query execution time tracking
- Slow query identification (>100ms)
- N+1 query detection
- Performance metrics and reporting

**Admin Endpoints:**
```bash
GET /api/admin/database/performance
POST /api/admin/database/performance/reset
```

## 🔧 Administrative Tasks

### Migration Management

**Phase Migration Commands:**
```bash
# Security fix migration (completed)
npm run migrate:encrypt-security:dry-run
npm run migrate:encrypt-security

# Phase 1 migration (completed)
npm run migrate:phase1-encryption:dry-run
npm run migrate:phase1-encryption

# Phase 2 migration (completed)
npm run migrate:phase2-encryption:dry-run
npm run migrate:phase2-encryption
```

**Migration Best Practices:**
1. **Always run dry-run first** to see what will be affected
2. **Backup database** before running migrations
3. **Test in staging** environment first
4. **Monitor performance** after migration
5. **Verify data integrity** post-migration

### Encryption Validation

**Test Encryption Status:**
```bash
# Check if data is properly encrypted
node -e "
const { isEncrypted } = require('./dist/src/utils/encryption');
// Test sample data
console.log('Sample encrypted data valid:', isEncrypted('salt:iv:data:tag'));
"
```

**Database Queries:**
```sql
-- Check encryption coverage (sample queries)
SELECT COUNT(*) as total_incidents,
       COUNT(CASE WHEN description LIKE 'salt:%:%:%' THEN 1 END) as encrypted_descriptions
FROM "Incident";

SELECT COUNT(*) as total_comments,
       COUNT(CASE WHEN body LIKE 'salt:%:%:%' THEN 1 END) as encrypted_bodies  
FROM "IncidentComment";
```

## 🚨 Security Incident Response

### Incident Types and Response

**1. Unauthorized Access Attempt:**
- Review audit logs for suspicious activity
- Check authentication logs for failed attempts
- Verify user account integrity
- Consider password reset for affected accounts

**2. Data Breach Concerns:**
- **Immediate:** Isolate affected systems
- **Assessment:** Determine scope and impact
- **Communication:** Notify stakeholders as appropriate
- **Remediation:** Apply necessary security fixes
- **Documentation:** Record incident and response

**3. Encryption Key Compromise:**
- **Critical Priority:** Immediate key rotation required
- Generate new encryption key
- Plan maintenance window for re-encryption
- Update all production environments
- Verify all systems operational with new key

### Audit Log Analysis

**Review Administrative Actions:**
```bash
# Check recent admin actions
GET /api/admin/system/audit?action=*admin*&limit=100

# Check specific user activity
GET /api/admin/system/audit?userId=USER_ID&limit=50

# Check failed authentication attempts
GET /api/admin/system/audit?action=login_failed&limit=100
```

## 📈 Monitoring and Maintenance

### Regular Security Tasks

**Daily:**
- Monitor audit logs for unusual activity
- Check system health and performance metrics
- Review failed authentication attempts

**Weekly:**
- Review user access and role assignments
- Check for system updates and security patches
- Analyze database performance reports

**Monthly:**
- Conduct security configuration review
- Review and update user access permissions
- Analyze incident trends and patterns

**Quarterly:**
- Security architecture review
- Consider encryption key rotation
- Update disaster recovery procedures

### Performance Optimization

**Encryption Performance Tuning:**
- Monitor query execution times
- Optimize database indexes
- Implement client-side caching where appropriate
- Use batch operations for bulk updates

**Scaling Considerations:**
- Database read replicas for query performance
- Application-level caching for frequently accessed data
- CDN for static assets and public content

## 🔍 Compliance and Documentation

### Security Documentation

**Maintain Current Documentation:**
- Security policies and procedures
- Incident response procedures
- User access management procedures
- Encryption key management procedures

**Audit Requirements:**
- Regular security assessments
- Access log reviews
- Compliance reporting
- Security training documentation

### Data Protection Compliance

**GDPR/Privacy Considerations:**
- Right to data export (implemented)
- Right to data deletion (implemented)
- Data processing transparency (documented)
- Consent management (event-specific)

**Industry Standards:**
- Follow OWASP security guidelines
- Implement defense-in-depth strategy
- Regular security vulnerability assessments
- Incident response procedures

---

For user-facing security information, refer to the [User Security Guide](../user-guide/data-security.md). 
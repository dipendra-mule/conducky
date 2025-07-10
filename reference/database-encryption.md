# Database Encryption Implementation Plan

We need to make sure that sensitive data is encrypted in the database for security compliance and data protection.

NOTE: Be sure to review GitHub issue #304 for an existing concern about the encryption of the data.
Additional note: don't forget to review the sample data seed scripts to see if they will need to be updated to use the new encryption format.

## Current State

✅ **Already Implemented:**
- Encryption utilities exist in `backend/src/utils/encryption.ts`
- Uses AES-256-GCM with proper authentication
- System settings (OAuth credentials, SMTP passwords) are already encrypted
- Environment validation for `ENCRYPTION_KEY` is in place
- Production-ready encryption key management with PBKDF2 key derivation

🔒 **SECURITY FIX COMPLETED - Issue #304 RESOLVED:**
- ✅ **Fixed Critical Vulnerability**: Replaced fixed salt with unique salts per encryption
- ✅ **New Secure Format**: `salt:iv:encrypted:authTag` (all hex-encoded)
- ✅ **Backward Compatibility**: Legacy format detection and decryption maintained
- ✅ **Migration Script**: Created and tested migration for existing encrypted data
- ✅ **Comprehensive Testing**: 22 encryption tests passing with security validations
- ✅ **No Seed Script Updates Needed**: Current seed scripts don't use encryption functions

## Data That Needs Encryption

Based on schema analysis and security requirements:

### High Priority (Sensitive User Data)
- **Incident Comments** (`IncidentComment.body`) - Contains potentially sensitive details about incidents
- **Incident Details** (`Incident.description`, `Incident.parties`, `Incident.location`) - Core sensitive incident data
- **User Contact Information** (additional fields if added)

### Medium Priority (Administrative Data)
- **Event Contact Email** (`Event.contactEmail`) - Already visible to users but could be sensitive
- **Organization Contact Details** (when added)

### Low Priority (Audit Trail)
- **Audit Log Details** (`AuditLog.details`) - May contain sensitive change details

## Implementation Phases

### ✅ Phase 0: Security Fix (COMPLETED)
**Status: COMPLETED** ✅
- [x] Fixed encryption security vulnerability (#304)
- [x] Implemented unique salts per encryption operation
- [x] Created migration script for existing encrypted data
- [x] Updated encryption tests with security validations
- [x] Verified backward compatibility with legacy format

### 🚀 Phase 1: Core Incident Data (READY TO START)
**Priority: High**
- [ ] Encrypt incident comments (`IncidentComment.body`)
- [ ] Encrypt incident descriptions (`Incident.description`)
- [ ] Encrypt incident parties (`Incident.parties`)
- [ ] Encrypt incident locations (`Incident.location`)
- [ ] Update incident services to use encryption utilities
- [ ] Create migration scripts for existing incident data
- [ ] Update tests for encrypted incident data

### 🔄 Phase 2: Extended Data
**Priority: Medium**
- [ ] Event contact emails (if not already handled)
- [ ] User profile sensitive data (when applicable)
- [ ] Organization contact details (future implementation)

### 🔍 Phase 3: Audit and Advanced
**Priority: Low**
- [ ] Audit log details (selective encryption based on sensitivity)
- [ ] Advanced search considerations for encrypted data

## Performance Considerations

### Database Query Limitations
- **No server-side searching**: Can't use SQL `LIKE` or `ILIKE` on encrypted fields
- **No server-side sorting**: Can't use `ORDER BY` on encrypted text fields  
- **Indexing limitations**: Cannot index encrypted content for performance

### Client-Side Filtering Trade-offs

**❌ What We'll Lose (Database Operations):**
```sql
-- These operations will NOT work on encrypted fields:
SELECT * FROM incidents WHERE description LIKE '%harassment%';
SELECT * FROM incidents WHERE description ILIKE '%sexual%';
SELECT * FROM incidents ORDER BY description;
SELECT * FROM incident_comments WHERE body LIKE '%follow-up%';
SELECT COUNT(*) FROM incidents WHERE parties LIKE '%John%';
```

**✅ What We'll Need Instead (Application Level):**
```javascript
// All filtering/searching must happen after decryption:
const incidents = await prisma.incident.findMany({ where: { eventId } });
const filtered = incidents
  .map(incident => ({ ...incident, description: decryptField(incident.description) }))
  .filter(incident => incident.description.toLowerCase().includes('harassment'));
```

**📊 Performance Impact Estimates:**
- **Small events (<100 incidents)**: Minimal impact (~100ms additional load time)
- **Medium events (100-500 incidents)**: Moderate impact (~200-500ms additional load time)  
- **Large events (500+ incidents)**: More significant impact (~500ms-2s additional load time)
- **Mitigation**: Implement client-side caching, pagination, and lazy loading

**🔍 Search Considerations:**
- Implement client-side search indexing for encrypted content
- Consider search-friendly encrypted data structures for future
- Maintain search keywords/tags in separate, non-encrypted fields for basic filtering

## Migration Documentation

### Railway Production Deployment Steps

**⚠️ PRODUCTION DEPLOYMENT CHECKLIST:**

#### Pre-Migration (Railway Environment)
1. **Environment Validation**
   ```bash
   # Via Railway CLI:
   railway run bash -c 'echo $ENCRYPTION_KEY | wc -c' # Should be 33+ chars
   railway run node -e 'require("./dist/src/utils/encryption").validateEncryptionKey(process.env.ENCRYPTION_KEY)'
   ```

2. **Database Backup**
   ```bash
   # Create backup before migration
   railway run pg_dump $DATABASE_URL > conducky_backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Test Migration in Staging**
   ```bash
   # Run dry-run in staging environment first
   railway run npm run migrate:encrypt-security:dry-run
   ```

#### Migration Execution
1. **Deploy New Code**
   ```bash
   git push railway main  # Deploy encryption security fixes
   ```

2. **Run Security Migration**
   ```bash
   # This will re-encrypt any legacy format system settings
   railway run npm run migrate:encrypt-security
   ```

3. **Deploy Phase 1 (When Ready)**
   ```bash
   # After Phase 1 implementation:
   railway run npm run migrate:phase1-encryption
   ```

#### Post-Migration Validation
1. **Verify Encryption**
   ```bash
   railway run node -e 'require("./scripts/validate-encryption").validateAllEncrypted()'
   ```

2. **Performance Testing**
   ```bash
   # Monitor application logs for query performance
   railway logs --follow
   ```

#### Downtime Estimates
- **Security Fix**: ~2-5 minutes (minimal existing encrypted data)
- **Phase 1**: ~10-30 minutes depending on incident volume
- **Phase 2**: ~5-15 minutes depending on event/user data
- **Phase 3**: ~5-15 minutes depending on audit log volume

#### Rollback Strategy
- **Security Fix**: No rollback needed (maintains backward compatibility)
- **Phase 1+**: Rollback via database backup restoration
- **Alternative**: Deploy hotfix to temporarily disable encryption checks

### Migration Command Reference

```bash
# Security fix (completed)
docker compose exec backend npm run migrate:encrypt-security:dry-run
docker compose exec backend npm run migrate:encrypt-security

# Future phase migrations (when implemented)
docker compose exec backend npm run migrate:phase1-encryption:dry-run
docker compose exec backend npm run migrate:phase1-encryption

# Validation commands
docker compose exec backend npm test -- tests/unit/encryption.test.js
docker compose exec backend npm run test:encryption-integration
```

## Next Steps

Since the **critical encryption security issue (#304) has been resolved**, we're now ready to proceed with **Phase 1** implementation:

1. **Start Phase 1**: Begin encrypting core incident data (comments, descriptions, parties, locations)
2. **Update Services**: Modify incident and comment services to use encryption utilities  
3. **Create Migration Scripts**: Build migration scripts for existing incident data
4. **Performance Testing**: Validate client-side filtering performance with realistic data volumes
5. **Documentation**: Update API documentation and developer guides for encrypted field handling

## Testing Strategy

### Automated Testing
- [x] Unit tests for encryption utilities (22 tests passing)
- [x] Integration tests for security migration
- [ ] Performance tests for client-side filtering
- [ ] End-to-end tests for encrypted data workflows

### Manual Testing
- [x] Encryption security fix validation
- [ ] Phase 1 incident data encryption/decryption
- [ ] Search and filter functionality with encrypted data
- [ ] Migration scripts with realistic data volumes

## Security Documentation

- Add a page in documentation about the security of the system, and make sure that it includes the encryption of the data
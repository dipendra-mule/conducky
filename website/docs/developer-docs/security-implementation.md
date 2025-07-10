---
sidebar_position: 7
---

# Security Implementation Guide

This guide covers the security architecture, encryption utilities, and best practices for developers working on Conducky.

## 🔒 Database Encryption Architecture

### Overview

Conducky implements field-level database encryption for all sensitive user data using AES-256-GCM encryption with authenticated encryption to prevent tampering.

### Encryption Utilities

All encryption functionality is centralized in `backend/src/utils/encryption.ts`:

```typescript
import { encryptField, decryptField, isEncrypted } from '../utils/encryption';

// Encrypt sensitive data before storing
const encryptedDescription = encryptField(incident.description);

// Decrypt data when retrieving
const decryptedDescription = decryptField(encryptedDescription);

// Check if data is encrypted
if (isEncrypted(storedData)) {
  const plaintext = decryptField(storedData);
}
```

### Encrypted Fields

**Current Implementation:**

- `Incident.description` - Incident details and narratives
- `Incident.parties` - Names/identifiers of involved parties  
- `Incident.location` - Incident location information
- `IncidentComment.body` - All comment content
- `Event.contactEmail` - Event organizer contact information
- System settings (OAuth credentials, SMTP passwords)

### Format Specification

**Encryption Format:** `salt:iv:encrypted:authTag`
- **salt**: 32-byte random salt (hex-encoded)
- **iv**: 16-byte initialization vector (hex-encoded) 
- **encrypted**: Encrypted data (hex-encoded, may be empty for empty strings)
- **authTag**: 16-byte authentication tag (hex-encoded)

**Legacy Format:** `salt:iv:encrypted` (supported for backward compatibility)

## 🛠️ Development Guidelines

### Using Encryption in Services

**Pattern for Service Methods:**

```typescript
// In service classes (e.g., IncidentService)
class IncidentService {
  
  // Helper methods for encryption/decryption
  private encryptIncidentData(incident: any) {
    return {
      ...incident,
      description: incident.description ? encryptField(incident.description) : null,
      parties: incident.parties ? encryptField(incident.parties) : null,
      location: incident.location ? encryptField(incident.location) : null,
    };
  }

  private decryptIncidentData(incident: any) {
    return {
      ...incident,
      description: incident.description ? decryptField(incident.description) : null,
      parties: incident.parties ? decryptField(incident.parties) : null,
      location: incident.location ? decryptField(incident.location) : null,
    };
  }

  // Create method - encrypt before storing
  async createIncident(data: IncidentCreateData) {
    const encryptedData = this.encryptIncidentData(data);
    const incident = await this.prisma.incident.create({
      data: encryptedData
    });
    // Return decrypted data to API
    return this.decryptIncidentData(incident);
  }

  // Read method - decrypt before returning
  async getIncidentById(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id }
    });
    if (!incident) return null;
    return this.decryptIncidentData(incident);
  }

  // Update method - encrypt new values
  async updateIncident(id: string, data: IncidentUpdateData) {
    const encryptedData = this.encryptIncidentData(data);
    const incident = await this.prisma.incident.update({
      where: { id },
      data: encryptedData
    });
    return this.decryptIncidentData(incident);
  }
}
```

### Error Handling

**Graceful Degradation:**
```typescript
// The decryptField function handles errors gracefully
const decryptedValue = decryptField(encryptedValue);
// If decryption fails, returns the original value
// This prevents data loss during format changes or key rotation
```

**Manual Error Handling:**
```typescript
try {
  const decrypted = decryptField(encryptedData);
  return decrypted;
} catch (error) {
  logger.error('Decryption failed for sensitive data', { error: error.message });
  // Handle appropriately - may need to return error to user
  throw new Error('Unable to decrypt sensitive data');
}
```

### Testing Encrypted Fields

**Unit Test Pattern:**
```typescript
describe('IncidentService Encryption', () => {
  it('should encrypt incident data before storing', async () => {
    const incidentData = {
      description: 'Sensitive incident details',
      parties: 'John Doe',
      location: 'Conference Room A'
    };

    const result = await incidentService.createIncident(incidentData);

    // Verify data is returned decrypted
    expect(result.description).toBe(incidentData.description);
    
    // Verify data is stored encrypted (check database directly)
    const storedIncident = await prisma.incident.findUnique({
      where: { id: result.id }
    });
    expect(isEncrypted(storedIncident.description)).toBe(true);
    expect(storedIncident.description).not.toBe(incidentData.description);
  });
});
```

### Migration Patterns

**For New Encrypted Fields:**

1. **Add Migration Script:**
   ```typescript
   // backend/scripts/migrate-new-field-encryption.js
   const { encryptField, isEncrypted } = require('../dist/src/utils/encryption');
   
   async function migrateNewFieldEncryption(dryRun = false) {
     const records = await prisma.modelName.findMany({
       where: {
         newField: { not: null }
       }
     });
   
     for (const record of records) {
       if (!isEncrypted(record.newField)) {
         const encrypted = encryptField(record.newField);
         if (!dryRun) {
           await prisma.modelName.update({
             where: { id: record.id },
             data: { newField: encrypted }
           });
         }
       }
     }
   }
   ```

2. **Add NPM Scripts:**
   ```json
   {
     "scripts": {
       "migrate:new-field:dry-run": "node scripts/migrate-new-field-encryption.js --dry-run",
       "migrate:new-field": "node scripts/migrate-new-field-encryption.js"
     }
   }
   ```

## 🔐 Security Best Practices

### Environment Configuration

**Development:**
```bash
# Use a long, unique key for development
ENCRYPTION_KEY=development-encryption-key-that-is-long-enough-for-testing
```

**Production:**
```bash
# Generate cryptographically secure key
openssl rand -base64 48
# Result: Set as ENCRYPTION_KEY environment variable
```

### Data Handling Rules

**DO:**
- Always encrypt sensitive user data before database storage
- Use helper methods for consistent encryption/decryption
- Return decrypted data from service methods to API layers
- Test both encrypted storage and decrypted retrieval
- Use `isEncrypted()` to check format before decryption
- Handle encryption errors gracefully

**DON'T:**
- Return encrypted data to API responses
- Store plaintext sensitive data in database
- Hard-code encryption keys
- Skip validation of encryption format
- Ignore decryption errors
- Encrypt data multiple times

### Performance Considerations

**Client-Side Filtering:**
```typescript
// Since encrypted data can't be filtered in SQL, handle client-side
const incidents = await prisma.incident.findMany({
  where: { eventId } // Filter on non-encrypted fields only
});

// Decrypt and filter client-side
const filtered = incidents
  .map(incident => ({
    ...incident,
    description: decryptField(incident.description)
  }))
  .filter(incident => 
    incident.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
```

**Pagination Strategy:**
```typescript
// Get more records than needed to account for client-side filtering
const rawIncidents = await prisma.incident.findMany({
  where: { eventId },
  take: limit * 2, // Get extra records
  skip: offset
});

const decryptedIncidents = rawIncidents.map(decryptIncidentData);
const filtered = applyClientFilters(decryptedIncidents);
return filtered.slice(0, limit); // Return requested amount
```

## 🔍 Debugging Encrypted Data

### Identifying Encryption Issues

**Check Encryption Format:**
```typescript
import { isEncrypted } from '../utils/encryption';

// Verify data format
console.log('Is encrypted:', isEncrypted(data));
console.log('Format parts:', data.split(':').length); // Should be 3 or 4
```

**Manual Decryption Testing:**
```typescript
// Test decryption in development
try {
  const decrypted = decryptField(encryptedData);
  console.log('Decryption successful:', decrypted);
} catch (error) {
  console.error('Decryption failed:', error.message);
}
```

### Common Issues

**Empty String Handling:**
- Empty strings (`""`) are encrypted and return encrypted format
- `null` and `undefined` values are passed through unchanged
- Use `isEncrypted()` to verify format before decryption

**Legacy Format Support:**
- Old 3-part format: `salt:iv:encrypted`
- New 4-part format: `salt:iv:encrypted:authTag`  
- Both formats are supported during transition

**Key Management:**
- Encryption key must be consistent across all application instances
- Key changes require data re-encryption
- Missing or wrong key causes decryption failures

## 📊 Monitoring and Auditing

### Audit Log Integration

Encryption operations are automatically audited through existing audit logging:

```typescript
import { logAudit } from '../utils/audit';

// Audit sensitive data access
await logAudit({
  eventId,
  userId,
  action: 'view_incident_details',
  targetType: 'Incident',
  targetId: incidentId
});
```

### Performance Monitoring

Monitor encryption impact on performance:

```typescript
// Track encryption overhead
const start = Date.now();
const encrypted = encryptField(sensitiveData);
const encryptionTime = Date.now() - start;

if (encryptionTime > 10) { // Log slow encryption
  logger.warn('Slow encryption detected', { 
    encryptionTime, 
    dataLength: sensitiveData.length 
  });
}
```

## 🧪 Testing Strategy

### Unit Tests

Test encryption utilities independently:
```typescript
describe('Encryption Utilities', () => {
  it('should encrypt and decrypt data correctly', () => {
    const original = 'sensitive data';
    const encrypted = encryptField(original);
    const decrypted = decryptField(encrypted);
    
    expect(encrypted).not.toBe(original);
    expect(isEncrypted(encrypted)).toBe(true);
    expect(decrypted).toBe(original);
  });
});
```

### Integration Tests

Test service-level encryption:
```typescript
describe('IncidentService Integration', () => {
  it('should handle end-to-end encryption workflow', async () => {
    // Create with sensitive data
    const incident = await incidentService.createIncident({
      description: 'Sensitive incident details'
    });
    
    // Verify returned data is decrypted
    expect(incident.description).toBe('Sensitive incident details');
    
    // Verify stored data is encrypted
    const stored = await prisma.incident.findUnique({
      where: { id: incident.id }
    });
    expect(isEncrypted(stored.description)).toBe(true);
    
    // Verify retrieval returns decrypted data
    const retrieved = await incidentService.getIncidentById(incident.id);
    expect(retrieved.description).toBe('Sensitive incident details');
  });
});
```

---

For production deployment and key management, see the [Admin Security Guide](../admin-guide/security-overview.md). 
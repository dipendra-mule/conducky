const { encryptField, decryptField, isEncrypted } = require('../../src/utils/encryption');

describe('Encryption Utilities', () => {
  const originalEnv = process.env.ENCRYPTION_KEY;

  beforeAll(() => {
    // Set a test encryption key
    process.env.ENCRYPTION_KEY = 'test-encryption-key-for-conducky-testing';
  });

  afterAll(() => {
    // Restore original environment
    if (originalEnv) {
      process.env.ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  describe('encryptField', () => {
    it('should encrypt a string value', () => {
      const plaintext = 'sensitive-password-123';
      const encrypted = encryptField(plaintext);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.split(':')).toHaveLength(3); // iv:encrypted:authTag format
    });

    it('should return empty string for empty input', () => {
      expect(encryptField('')).toBe('');
      expect(encryptField(null)).toBe(null);
      expect(encryptField(undefined)).toBe(undefined);
    });

    it('should produce different outputs for same input (due to random IV)', () => {
      const plaintext = 'same-input-text';
      const encrypted1 = encryptField(plaintext);
      const encrypted2 = encryptField(plaintext);
      
      expect(encrypted1).not.toBe(encrypted2);
      expect(encrypted1.split(':')[0]).not.toBe(encrypted2.split(':')[0]); // Different IVs
    });
  });

  describe('decryptField', () => {
    it('should decrypt an encrypted value back to original', () => {
      const plaintext = 'my-secret-smtp-password';
      const encrypted = encryptField(plaintext);
      const decrypted = decryptField(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should return non-encrypted values as-is', () => {
      const plainValue = 'not-encrypted-value';
      expect(decryptField(plainValue)).toBe(plainValue);
    });

    it('should handle empty and null values', () => {
      expect(decryptField('')).toBe('');
      expect(decryptField(null)).toBe(null);
      expect(decryptField(undefined)).toBe(undefined);
    });

    it('should throw error for invalid encrypted format', () => {
      expect(() => decryptField('invalid:format')).toThrow();
      expect(() => decryptField('not:encrypted:format:too:many:parts')).toThrow();
    });
  });

  describe('isEncrypted', () => {
    it('should identify encrypted values correctly', () => {
      const plaintext = 'test-value';
      const encrypted = encryptField(plaintext);
      
      expect(isEncrypted(encrypted)).toBe(true);
      expect(isEncrypted(plaintext)).toBe(false);
    });

    it('should return false for empty or invalid values', () => {
      expect(isEncrypted('')).toBe(false);
      expect(isEncrypted(null)).toBe(false);
      expect(isEncrypted(undefined)).toBe(false);
      expect(isEncrypted('not-encrypted')).toBe(false);
      expect(isEncrypted('invalid:format')).toBe(false);
    });

    it('should validate hex format in encrypted values', () => {
      expect(isEncrypted('abc123:def456:789abc')).toBe(true);
      expect(isEncrypted('xyz123:def456:789abc')).toBe(false); // 'xyz' is not hex
      expect(isEncrypted('abc123:def456:789xyz')).toBe(false); // 'xyz' is not hex
    });
  });

  describe('end-to-end encryption workflow', () => {
    it('should handle typical email password encryption workflow', () => {
      const smtpPassword = 'super-secret-smtp-password-2024!';
      
      // Encrypt for storage
      const encryptedPassword = encryptField(smtpPassword);
      expect(isEncrypted(encryptedPassword)).toBe(true);
      
      // Decrypt for use
      const decryptedPassword = decryptField(encryptedPassword);
      expect(decryptedPassword).toBe(smtpPassword);
    });

    it('should handle multiple different passwords', () => {
      const passwords = [
        'gmail-app-password-123',
        'outlook-smtp-secret',
        'mailgun-api-key-456',
        'sendgrid-token-789'
      ];

      const encrypted = passwords.map(pwd => encryptField(pwd));
      const decrypted = encrypted.map(enc => decryptField(enc));

      expect(decrypted).toEqual(passwords);
      expect(encrypted.every(enc => isEncrypted(enc))).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should use fallback key in test environment when ENCRYPTION_KEY is missing', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;

      // In test environment, functions should still work with fallback key
      const testValue = 'test-value';
      const encrypted = encryptField(testValue);
      expect(isEncrypted(encrypted)).toBe(true);
      
      const decrypted = decryptField(encrypted);
      expect(decrypted).toBe(testValue);

      // Restore key
      process.env.ENCRYPTION_KEY = originalKey;
    });
  });
}); 
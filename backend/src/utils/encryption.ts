import crypto from 'crypto';
import logger from '../config/logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, this is always 16
const KEY_LENGTH = 32; // AES-256 requires 32 bytes
const SALT_LENGTH = 32; // Length for unique salt per encryption
const MIN_KEY_LENGTH = 32; // Minimum length for the raw encryption key

/**
 * Validate encryption key requirements
 * @param key The encryption key to validate
 * @throws Error if key doesn't meet requirements
 */
export function validateEncryptionKey(key: string): void {
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required for field encryption');
  }
  
  if (key.length < MIN_KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be at least ${MIN_KEY_LENGTH} characters long. Current length: ${key.length}`);
  }
  
  // Check for common weak keys
  const weakKeys = [
    'password',
    '12345678901234567890123456789012',
    'abcdefghijklmnopqrstuvwxyz123456',
    'conducky-dev-encryption-key-change-in-production'
  ];
  
  if (weakKeys.includes(key)) {
    logger().warn('⚠️  WARNING: Using a default or weak encryption key. This should be changed in production!');
  }
  
  // In production, warn if key appears to be the default dev key
  if (process.env.NODE_ENV === 'production' && (key.includes('dev') || key.includes('development'))) {
    throw new Error('Production environments must not use development encryption keys');
  }
}

/**
 * Derive encryption key from master key and unique salt using PBKDF2
 * @param masterKey The master encryption key from environment
 * @param salt Unique salt for this encryption operation
 * @returns Derived encryption key
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * Get master encryption key from environment variable
 */
function getMasterKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  
  // In test environment, use a default key if none is provided
  if (process.env.NODE_ENV === 'test' && !key) {
    return 'test-encryption-key-32-characters-long!';
  }
  
  validateEncryptionKey(key || '');
  return key!;
}

/**
 * Encrypt a string value for secure storage with unique salt per operation
 * @param text The plaintext to encrypt
 * @returns Encrypted string in format: salt:iv:encrypted:authTag (all hex encoded)
 */
export function encryptField(text: string): string {
  if (text === null || text === undefined) return text;
  
  try {
    const masterKey = getMasterKey();
    
    // Generate unique salt for this encryption operation
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Derive encryption key using the unique salt
    const derivedKey = deriveKey(masterKey, salt);
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
    cipher.setAAD(Buffer.from('conducky-field-encryption', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    // Return format: salt:iv:encrypted:authTag (all hex encoded)
    return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  } catch (error: any) {
    // Re-throw specific validation errors
    if (error.message && error.message.includes('ENCRYPTION_KEY')) {
      throw error;
    }
    
    // Don't log sensitive encryption errors in production
    if (process.env.NODE_ENV === 'development') {
      logger().error('Encryption error:', error);
    }
    throw new Error('Failed to encrypt field');
  }
}

/**
 * Decrypt a previously encrypted string
 * @param encryptedText The encrypted text in format: salt:iv:encrypted:authTag OR legacy format: iv:encrypted:authTag
 * @returns Decrypted plaintext
 */
export function decryptField(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(':')) {
    return encryptedText; // Return as-is if not encrypted format
  }
  
  try {
    const masterKey = getMasterKey();
    const parts = encryptedText.split(':');
    
    let salt: Buffer;
    let iv: Buffer;
    let encrypted: string;
    let authTag: Buffer;
    
    if (parts.length === 4) {
      // New format: salt:iv:encrypted:authTag
      salt = Buffer.from(parts[0], 'hex');
      iv = Buffer.from(parts[1], 'hex');
      encrypted = parts[2];
      authTag = Buffer.from(parts[3], 'hex');
    } else if (parts.length === 3) {
      // Legacy format: iv:encrypted:authTag (for backward compatibility)
      // Use the old fixed salt for legacy data
      salt = Buffer.from('conducky-settings-salt-v1', 'utf8');
      iv = Buffer.from(parts[0], 'hex');
      encrypted = parts[1];
      authTag = Buffer.from(parts[2], 'hex');
    } else {
      throw new Error('Invalid encrypted field format');
    }
    
    // Derive the key using the salt (unique for new format, fixed for legacy)
    const derivedKey = deriveKey(masterKey, salt);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(authTag);
    decipher.setAAD(Buffer.from('conducky-field-encryption', 'utf8'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // Don't log sensitive decryption errors in production
    if (process.env.NODE_ENV === 'development') {
      logger().error('Decryption error:', error);
    }
    // Return original value if decryption fails (graceful degradation)
    return encryptedText;
  }
}

/**
 * Check if a value appears to be encrypted
 * @param value The value to check
 * @returns True if the value appears to be in encrypted format
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(':');
  
  // Check for both new format (4 parts) and legacy format (3 parts)
  if (parts.length !== 3 && parts.length !== 4) {
    return false;
  }
  
  // Check that all non-empty parts are hex, and allow empty encrypted content (for empty strings)
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    // Allow empty part only for encrypted content (index 2 in both 3 and 4-part formats)
    if (part === '' && i === 2) {
      continue; // Empty encrypted content is valid (happens when encrypting empty string)
    }
    if (!/^[0-9a-f]+$/i.test(part)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if a value is in legacy encryption format (3 parts vs 4 parts)
 * @param value The encrypted value to check
 * @returns True if the value is in legacy format
 */
export function isLegacyEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(':');
  return parts.length === 3 && parts.every(part => /^[0-9a-f]+$/i.test(part));
} 
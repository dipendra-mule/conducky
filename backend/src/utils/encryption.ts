import crypto from 'crypto';
import logger from '../config/logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, this is always 16
const KEY_LENGTH = 32; // AES-256 requires 32 bytes
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
    logger.warn('⚠️  WARNING: Using a default or weak encryption key. This should be changed in production!');
  }
  
  // In production, warn if key appears to be the default dev key
  if (process.env.NODE_ENV === 'production' && (key.includes('dev') || key.includes('development'))) {
    throw new Error('Production environments must not use development encryption keys');
  }
}

/**
 * Get encryption key from environment variable
 * In production, this should be a strong, randomly generated key
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  // In test environment, use a default key if none is provided
  if (process.env.NODE_ENV === 'test' && !key) {
    const testKey = 'test-encryption-key-32-characters-long!';
    const salt = Buffer.from('conducky-settings-salt-v1', 'utf8');
    return crypto.pbkdf2Sync(testKey, salt, 100000, KEY_LENGTH, 'sha512');
  }
  
  validateEncryptionKey(key || '');
  
  // Always derive a proper 32-byte key using PBKDF2
  const salt = Buffer.from('conducky-settings-salt-v1', 'utf8'); // Fixed salt for consistency
  return crypto.pbkdf2Sync(key!, salt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt a string value for secure storage
 * @param text The plaintext to encrypt
 * @returns Encrypted string in format: iv:encrypted:authTag
 */
export function encryptField(text: string): string {
  if (!text) return text;
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('conducky-field-encryption', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:encrypted:authTag (all hex encoded)
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  } catch (error) {
    // Don't log sensitive encryption errors in production
    if (process.env.NODE_ENV === 'development') {
      logger.error('Encryption error:', error);
    }
    throw new Error('Failed to encrypt field');
  }
}

/**
 * Decrypt a previously encrypted string
 * @param encryptedText The encrypted text in format: iv:encrypted:authTag
 * @returns Decrypted plaintext
 */
export function decryptField(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(':')) {
    return encryptedText; // Return as-is if not encrypted format
  }
  
  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted field format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    decipher.setAAD(Buffer.from('conducky-field-encryption', 'utf8'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // Don't log sensitive decryption errors in production
    if (process.env.NODE_ENV === 'development') {
      logger.error('Decryption error:', error);
    }
    throw new Error('Failed to decrypt field');
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
  return parts.length === 3 && parts.every(part => /^[0-9a-f]+$/i.test(part));
} 
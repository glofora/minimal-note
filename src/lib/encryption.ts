import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM
const AUTH_TAG_LENGTH = 16; // 128 bits authentication tag

export interface EncryptedPayload {
  encrypted: string; // Hex string
  iv: string;        // Hex string
  tag: string;       // Hex string
}

/**
 * Derives a reliable 32-byte Buffer key from the TOKEN_ENCRYPTION_KEY environment variable.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      'TOKEN_ENCRYPTION_KEY environment variable is not defined. Please set it in your .env file.'
    );
  }

  // If a 64-character hex key is provided, decode it directly
  if (secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)) {
    return Buffer.from(secret, 'hex');
  }

  // Otherwise derive a deterministic 256-bit key via SHA-256
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a plain text string using AES-256-GCM.
 *
 * @param plainText The secret text to encrypt (e.g., Google OAuth refresh token)
 * @returns Structured object containing hex-encoded ciphertext, IV, and auth tag
 */
export function encrypt(plainText: string): EncryptedPayload {
  if (!plainText) {
    throw new Error('Cannot encrypt empty or null payload.');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag,
  };
}

/**
 * Decrypts an encrypted payload using AES-256-GCM and verifies authentication tag integrity.
 *
 * @param payload Structured object containing hex-encoded ciphertext, IV, and auth tag
 * @returns Original decrypted plain text string
 * @throws Error if ciphertext has been tampered with or key is invalid
 */
export function decrypt(payload: EncryptedPayload): string {
  if (!payload || !payload.encrypted || !payload.iv || !payload.tag) {
    throw new Error('Invalid encrypted payload provided for decryption.');
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(payload.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Serializes an EncryptedPayload into a single compact string format (iv:tag:encrypted).
 */
export function serializeEncryptedPayload(payload: EncryptedPayload): string {
  return `${payload.iv}:${payload.tag}:${payload.encrypted}`;
}

/**
 * Deserializes a compact string format (iv:tag:encrypted) back into an EncryptedPayload.
 */
export function deserializeEncryptedPayload(compactString: string): EncryptedPayload {
  const parts = compactString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid compact encrypted token format.');
  }
  return {
    iv: parts[0],
    tag: parts[1],
    encrypted: parts[2],
  };
}

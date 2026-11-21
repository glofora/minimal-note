/**
 * Google Drive Personal Backup Data Models & Database Adapter Interface
 * 
 * Clean abstraction allowing plug-and-play integration with any database:
 * Prisma, Drizzle, Supabase (Postgres), MongoDB (Mongoose), MySQL, or SQLite.
 */

export type AutoBackupFrequency = 'off' | 'daily' | 'weekly';

export interface GoogleDriveBackupRecord {
  userId: string;
  googleEmail: string;
  encryptedRefreshToken: string; // Hex ciphertext
  iv: string;                    // Hex IV
  tag: string;                   // Hex auth tag
  isEnabled: boolean;
  autoBackupFrequency: AutoBackupFrequency;
  lastBackupAt: string | null;   // ISO timestamp
  lastBackupSize: number | null; // Size in bytes
  createdAt?: string;
  updatedAt?: string;
}

export interface IGoogleDriveStorageAdapter {
  /**
   * Retrieves the user's stored Google Drive backup credentials and preferences.
   */
  getUserBackupRecord(userId: string): Promise<GoogleDriveBackupRecord | null>;

  /**
   * Saves or updates the user's Google Drive backup record.
   */
  saveUserBackupRecord(userId: string, data: Partial<GoogleDriveBackupRecord>): Promise<GoogleDriveBackupRecord>;

  /**
   * Clears/deletes the user's Google Drive credentials when disconnected or revoked.
   */
  deleteUserBackupRecord(userId: string): Promise<void>;
}

/**
 * Default in-memory storage adapter for zero-config local testing and development.
 * Replace with your production Prisma or SQL database adapter in production.
 */
class MemoryGoogleDriveStorageAdapter implements IGoogleDriveStorageAdapter {
  private records = new Map<string, GoogleDriveBackupRecord>();

  async getUserBackupRecord(userId: string): Promise<GoogleDriveBackupRecord | null> {
    return this.records.get(userId) || null;
  }

  async saveUserBackupRecord(userId: string, data: Partial<GoogleDriveBackupRecord>): Promise<GoogleDriveBackupRecord> {
    const existing = this.records.get(userId);
    const updated: GoogleDriveBackupRecord = {
      userId,
      googleEmail: data.googleEmail ?? existing?.googleEmail ?? '',
      encryptedRefreshToken: data.encryptedRefreshToken ?? existing?.encryptedRefreshToken ?? '',
      iv: data.iv ?? existing?.iv ?? '',
      tag: data.tag ?? existing?.tag ?? '',
      isEnabled: data.isEnabled ?? existing?.isEnabled ?? true,
      autoBackupFrequency: data.autoBackupFrequency ?? existing?.autoBackupFrequency ?? 'daily',
      lastBackupAt: data.lastBackupAt !== undefined ? data.lastBackupAt : (existing?.lastBackupAt ?? null),
      lastBackupSize: data.lastBackupSize !== undefined ? data.lastBackupSize : (existing?.lastBackupSize ?? null),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.records.set(userId, updated);
    return updated;
  }

  async deleteUserBackupRecord(userId: string): Promise<void> {
    this.records.delete(userId);
  }
}

// Global active storage adapter instance
let activeStorageAdapter: IGoogleDriveStorageAdapter = new MemoryGoogleDriveStorageAdapter();

export function getGoogleDriveStorageAdapter(): IGoogleDriveStorageAdapter {
  return activeStorageAdapter;
}

export function setGoogleDriveStorageAdapter(adapter: IGoogleDriveStorageAdapter): void {
  activeStorageAdapter = adapter;
}

/**
 * ==============================================================================
 * DATABASE SCHEMA SNIPPETS FOR PRODUCTION
 * ==============================================================================
 * 
 * --- 1. PRISMA SCHEMA (schema.prisma) ---
 * 
 * model GoogleDriveBackup {
 *   id                    String    @id @default(cuid())
 *   userId                String    @unique
 *   user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
 *   googleEmail           String
 *   encryptedRefreshToken String    @db.Text
 *   iv                    String
 *   tag                   String
 *   isEnabled             Boolean   @default(true)
 *   autoBackupFrequency   String    @default("daily") // "off" | "daily" | "weekly"
 *   lastBackupAt          DateTime?
 *   lastBackupSize        Int?      // bytes
 *   createdAt             DateTime  @default(now())
 *   updatedAt             DateTime  @updatedAt
 * }
 * 
 * --- 2. POSTGRESQL / SUPABASE SQL MIGRATION ---
 * 
 * CREATE TABLE IF NOT EXISTS google_drive_backups (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id TEXT UNIQUE NOT NULL,
 *   google_email TEXT NOT NULL,
 *   encrypted_refresh_token TEXT NOT NULL,
 *   iv TEXT NOT NULL,
 *   tag TEXT NOT NULL,
 *   is_enabled BOOLEAN DEFAULT true,
 *   auto_backup_frequency TEXT DEFAULT 'daily',
 *   last_backup_at TIMESTAMPTZ,
 *   last_backup_size BIGINT,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 */

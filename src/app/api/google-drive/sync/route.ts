import { NextRequest, NextResponse } from 'next/server';
import {
  getCurrentUserId,
  getAuthenticatedDriveClient,
  findAppBackupFile,
  uploadOrUpdateBackupFile,
  downloadBackupFile,
  BACKUP_FILE_NAME,
} from '@/lib/google-drive';
import { getGoogleDriveStorageAdapter } from '@/lib/db/google-drive-model';

/**
 * Checks if an error is due to an invalid/revoked OAuth token.
 */
function isInvalidGrantError(err: any): boolean {
  const message = err?.message || '';
  const errorDesc = err?.response?.data?.error_description || '';
  const errorCode = err?.response?.data?.error || '';
  return (
    message.includes('invalid_grant') ||
    errorDesc.includes('invalid_grant') ||
    errorCode === 'invalid_grant' ||
    err?.status === 401 ||
    err?.code === 401
  );
}

/**
 * Handles invalid grant by clearing database record and returning 401.
 */
async function handleRevokedAccess(userId: string) {
  const storageAdapter = getGoogleDriveStorageAdapter();
  await storageAdapter.deleteUserBackupRecord(userId);
  return NextResponse.json(
    {
      error: 'DRIVE_DISCONNECTED',
      message: 'Your Google Drive connection was revoked or expired. Please reconnect.',
    },
    { status: 401 }
  );
}

/**
 * GET /api/google-drive/sync
 * ?mode=info    => Returns backup metadata without downloading the full payload
 * ?mode=restore => Downloads and returns the backup payload from appDataFolder
 */
export async function GET(req: NextRequest) {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const storageAdapter = getGoogleDriveStorageAdapter();
  const record = await storageAdapter.getUserBackupRecord(userId);

  if (!record || !record.encryptedRefreshToken) {
    return NextResponse.json(
      {
        isConnected: false,
        googleEmail: null,
        lastBackupAt: null,
        lastBackupSize: null,
        autoBackupFrequency: 'off',
        isEnabled: false,
      },
      { status: 200 }
    );
  }

  const mode = req.nextUrl.searchParams.get('mode') || 'info';

  try {
    const drive = await getAuthenticatedDriveClient(record);

    // MODE 1: INFO (Fetch metadata only, fast & lightweight)
    if (mode === 'info') {
      const file = await findAppBackupFile(drive, BACKUP_FILE_NAME);

      return NextResponse.json({
        isConnected: true,
        googleEmail: record.googleEmail,
        exists: Boolean(file),
        lastBackupAt: file?.modifiedTime || record.lastBackupAt,
        lastBackupSize: file?.size ? parseInt(file.size, 10) : record.lastBackupSize,
        autoBackupFrequency: record.autoBackupFrequency,
        isEnabled: record.isEnabled,
        fileName: file?.name || BACKUP_FILE_NAME,
      });
    }

    // MODE 2: RESTORE (Download the full backup payload)
    if (mode === 'restore') {
      const file = await findAppBackupFile(drive, BACKUP_FILE_NAME);
      if (!file || !file.id) {
        return NextResponse.json(
          { error: 'NO_BACKUP_FOUND', message: 'No backup file found in Google Drive appDataFolder.' },
          { status: 404 }
        );
      }

      const backupData = await downloadBackupFile(drive, file.id);

      return NextResponse.json({
        success: true,
        data: backupData,
        lastModified: file.modifiedTime,
        sizeBytes: file.size ? parseInt(file.size, 10) : null,
      });
    }

    return NextResponse.json({ error: 'INVALID_MODE', message: 'Supported modes: info, restore' }, { status: 400 });
  } catch (err: any) {
    console.error('Google Drive Sync GET error:', err);
    if (isInvalidGrantError(err)) {
      return handleRevokedAccess(userId);
    }
    return NextResponse.json(
      { error: 'DRIVE_SYNC_FAILED', message: err.message || 'Failed to communicate with Google Drive' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/google-drive/sync
 * Uploads/updates the single backup file inside Google Drive's hidden appDataFolder.
 * Also updates preferences if provided in request body.
 */
export async function POST(req: NextRequest) {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const storageAdapter = getGoogleDriveStorageAdapter();
  const record = await storageAdapter.getUserBackupRecord(userId);

  if (!record || !record.encryptedRefreshToken) {
    return NextResponse.json(
      { error: 'NOT_CONNECTED', message: 'Google Drive is not connected. Please connect first.' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    // Preference updates (e.g. changing auto-backup frequency)
    if (body.updatePreferencesOnly) {
      const updated = await storageAdapter.saveUserBackupRecord(userId, {
        autoBackupFrequency: body.autoBackupFrequency ?? record.autoBackupFrequency,
        isEnabled: body.isEnabled ?? record.isEnabled,
      });
      return NextResponse.json({ success: true, record: updated });
    }

    if (!body.data) {
      return NextResponse.json(
        { error: 'MISSING_DATA', message: 'Payload "data" field is required for backup.' },
        { status: 400 }
      );
    }

    const drive = await getAuthenticatedDriveClient(record);

    // Overwrite existing or create single backup file in hidden appDataFolder
    const { modifiedTime, sizeBytes } = await uploadOrUpdateBackupFile(
      drive,
      body.data,
      BACKUP_FILE_NAME
    );

    // Update DB record with fresh backup metadata
    await storageAdapter.saveUserBackupRecord(userId, {
      lastBackupAt: modifiedTime,
      lastBackupSize: sizeBytes,
    });

    return NextResponse.json({
      success: true,
      lastBackupAt: modifiedTime,
      sizeBytes,
      fileName: BACKUP_FILE_NAME,
      storageLocation: 'appDataFolder (Hidden)',
    });
  } catch (err: any) {
    console.error('Google Drive Sync POST error:', err);
    if (isInvalidGrantError(err)) {
      return handleRevokedAccess(userId);
    }
    return NextResponse.json(
      { error: 'BACKUP_UPLOAD_FAILED', message: err.message || 'Failed to upload backup to Google Drive' },
      { status: 500 }
    );
  }
}

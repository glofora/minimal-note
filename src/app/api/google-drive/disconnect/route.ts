import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId, revokeGoogleToken } from '@/lib/google-drive';
import { decrypt } from '@/lib/encryption';
import { getGoogleDriveStorageAdapter } from '@/lib/db/google-drive-model';

/**
 * POST /api/google-drive/disconnect
 * Revokes Google OAuth access via Google's token revocation endpoint
 * and clears the user's stored Google Drive credentials and preferences from the database.
 */
export async function POST(req: NextRequest) {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const storageAdapter = getGoogleDriveStorageAdapter();
  const record = await storageAdapter.getUserBackupRecord(userId);

  if (record && record.encryptedRefreshToken) {
    try {
      // Decrypt token and call Google's revocation endpoint
      const refreshToken = decrypt({
        encrypted: record.encryptedRefreshToken,
        iv: record.iv,
        tag: record.tag,
      });

      await revokeGoogleToken(refreshToken);
    } catch (err) {
      console.warn('Could not cleanly revoke Google token with Google endpoint (may already be revoked):', err);
    }
  }

  // Delete credentials from database regardless of Google endpoint response
  await storageAdapter.deleteUserBackupRecord(userId);

  return NextResponse.json({
    success: true,
    message: 'Google Drive disconnected and authorization revoked successfully.',
  });
}

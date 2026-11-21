import { google } from 'googleapis';
import { decrypt, encrypt, type EncryptedPayload } from '@/lib/encryption';
import type { GoogleDriveBackupRecord } from '@/lib/db/google-drive-model';

export const BACKUP_FILE_NAME = 'app-backup.json';

/**
 * Strict Minimal OAuth 2.0 Scopes
 * - drive.appdata: Access ONLY to Google Drive's hidden Application Data folder (cannot read/write user's personal Drive files)
 * - userinfo.email: To display the linked Google account email in the UI
 */
export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/userinfo.email',
];

/**
 * Creates a configured Google OAuth2 Client.
 */
export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Missing Google OAuth credentials. Ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI are set.'
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generates the Google OAuth 2.0 authorization URL requesting an offline refresh token.
 */
export function generateGoogleDriveAuthUrl(state: string): string {
  const oauth2Client = getOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Forces refresh_token generation on every link
    scope: GOOGLE_DRIVE_SCOPES,
    state,
    include_granted_scopes: true,
  });
}

/**
 * Exchanges authorization code for tokens and extracts the linked Google email.
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  encryptedRefreshToken: EncryptedPayload;
  googleEmail: string;
}> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error(
      'Google did not return a refresh_token. Ensure prompt: "consent" and access_type: "offline" are used.'
    );
  }

  oauth2Client.setCredentials(tokens);

  // Retrieve user's Google email
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  const googleEmail = userInfo.data.email || 'unknown@gmail.com';

  const encryptedRefreshToken = encrypt(tokens.refresh_token);

  return {
    encryptedRefreshToken,
    googleEmail,
  };
}

/**
 * Creates an authenticated Google Drive API client using a stored encrypted refresh token.
 */
export async function getAuthenticatedDriveClient(record: GoogleDriveBackupRecord) {
  const refreshToken = decrypt({
    encrypted: record.encryptedRefreshToken,
    iv: record.iv,
    tag: record.tag,
  });

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * Searches for the existing backup file inside Google Drive's hidden appDataFolder.
 */
export async function findAppBackupFile(
  drive: any,
  filename = BACKUP_FILE_NAME
): Promise<{ id: string; name: string; modifiedTime?: string; size?: string } | null> {
  const response = await drive.files.list({
    spaces: 'appDataFolder',
    fields: 'files(id, name, modifiedTime, size)',
    q: `name = '${filename}' and trashed = false`,
    pageSize: 1,
  });

  const files = response.data.files || [];
  return files.length > 0 ? files[0] : null;
}

/**
 * Uploads a new backup or updates the existing single backup file in appDataFolder (WhatsApp style).
 */
export async function uploadOrUpdateBackupFile(
  drive: any,
  data: any,
  filename = BACKUP_FILE_NAME
): Promise<{ fileId: string; modifiedTime: string; sizeBytes: number }> {
  const existingFile = await findAppBackupFile(drive, filename);
  const jsonString = JSON.stringify(data, null, 2);
  const sizeBytes = Buffer.byteLength(jsonString, 'utf8');

  if (existingFile && existingFile.id) {
    // Update existing file in-place
    const updateRes = await drive.files.update({
      fileId: existingFile.id,
      media: {
        mimeType: 'application/json',
        body: jsonString,
      },
      fields: 'id, name, modifiedTime, size',
    });

    return {
      fileId: updateRes.data.id,
      modifiedTime: updateRes.data.modifiedTime || new Date().toISOString(),
      sizeBytes: updateRes.data.size ? parseInt(updateRes.data.size, 10) : sizeBytes,
    };
  } else {
    // Create new file inside hidden appDataFolder
    const createRes = await drive.files.create({
      requestBody: {
        name: filename,
        parents: ['appDataFolder'],
        mimeType: 'application/json',
      },
      media: {
        mimeType: 'application/json',
        body: jsonString,
      },
      fields: 'id, name, modifiedTime, size',
    });

    return {
      fileId: createRes.data.id,
      modifiedTime: createRes.data.modifiedTime || new Date().toISOString(),
      sizeBytes: createRes.data.size ? parseInt(createRes.data.size, 10) : sizeBytes,
    };
  }
}

/**
 * Downloads and parses the user's backup payload from Google Drive appDataFolder.
 */
export async function downloadBackupFile(drive: any, fileId: string): Promise<any> {
  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
    },
    { responseType: 'json' }
  );

  return response.data;
}

/**
 * Revokes Google OAuth access via Google's token revocation endpoint.
 */
export async function revokeGoogleToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.ok;
  } catch (err) {
    console.warn('Failed to revoke token with Google endpoint:', err);
    return false;
  }
}

/**
 * Helper to extract current user ID from the request or session.
 * In your Next.js application, replace this with your session provider
 * (e.g., `const session = await auth()`, `getServerSession()`, or Supabase/Clerk auth).
 */
export function getCurrentUserId(request?: Request): string {
  // Check custom header if passed
  if (request) {
    const headerUserId = request.headers.get('x-user-id');
    if (headerUserId) return headerUserId;
  }
  // Default fallback for single-user / local / demo instances
  return 'default-user-id';
}

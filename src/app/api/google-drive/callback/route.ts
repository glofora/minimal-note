import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/google-drive';
import { getGoogleDriveStorageAdapter } from '@/lib/db/google-drive-model';

/**
 * GET /api/google-drive/callback
 * Handles the redirect from Google OAuth consent screen.
 * Exchanges authorization code for encrypted refresh_token and links Google account.
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const settingsUrl = `${appBaseUrl}/?googleDrive=`;

  if (error) {
    console.warn('Google OAuth consent rejected or failed:', error);
    return NextResponse.redirect(`${settingsUrl}error&reason=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}error&reason=missing_code_or_state`);
  }

  try {
    // Decode and verify state
    const decodedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    const userId = decodedState.userId;

    if (!userId) {
      return NextResponse.redirect(`${settingsUrl}error&reason=invalid_state`);
    }

    // Exchange authorization code for encrypted tokens and email
    const { encryptedRefreshToken, googleEmail } = await exchangeCodeForTokens(code);

    // Save to database
    const storageAdapter = getGoogleDriveStorageAdapter();
    await storageAdapter.saveUserBackupRecord(userId, {
      googleEmail,
      encryptedRefreshToken: encryptedRefreshToken.encrypted,
      iv: encryptedRefreshToken.iv,
      tag: encryptedRefreshToken.tag,
      isEnabled: true,
      autoBackupFrequency: 'daily',
    });

    // Successfully connected; redirect user back to their settings view
    return NextResponse.redirect(`${settingsUrl}connected&email=${encodeURIComponent(googleEmail)}`);
  } catch (err: any) {
    console.error('Error in Google Drive OAuth callback:', err);
    return NextResponse.redirect(
      `${settingsUrl}error&reason=${encodeURIComponent(err.message || 'token_exchange_failed')}`
    );
  }
}

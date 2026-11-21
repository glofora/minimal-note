import { NextRequest, NextResponse } from 'next/server';
import { generateGoogleDriveAuthUrl, getCurrentUserId } from '@/lib/google-drive';

/**
 * GET /api/google-drive/connect
 * Initiates the Google OAuth 2.0 flow for personal Google Drive backups.
 * Requests offline access and prompt=consent to ensure a permanent refresh_token.
 */
export async function GET(req: NextRequest) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be logged in to connect Google Drive.' },
        { status: 401 }
      );
    }

    // Embed userId and a secure random nonce in state
    const statePayload = {
      userId,
      nonce: Math.random().toString(36).substring(2),
      timestamp: Date.now(),
    };
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

    const authUrl = generateGoogleDriveAuthUrl(state);

    // If client requested JSON (e.g. from a client component fetch)
    const wantsJson =
      req.nextUrl.searchParams.get('format') === 'json' ||
      req.headers.get('accept')?.includes('application/json');

    if (wantsJson) {
      return NextResponse.json({ url: authUrl });
    }

    // Direct browser navigation redirect
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('Error initiating Google Drive OAuth connection:', error);
    return NextResponse.json(
      { error: 'OAUTH_INITIATION_FAILED', message: error.message || 'Failed to start OAuth flow' },
      { status: 500 }
    );
  }
}

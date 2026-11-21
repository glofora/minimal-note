# WhatsApp-Style Personal Google Drive Backup for Next.js (App Router)

An opt-in, personal cloud backup and restore integration for Next.js App Router applications, modeled after WhatsApp's Android Google Drive backup architecture.

---

## 🏗️ Architecture & Security Principles

1. **Opt-In & Decoupled from Primary Authentication:**
   - Does **not** replace your app's primary auth (NextAuth, Supabase, Clerk, Firebase, or custom JWT).
   - Users remain logged in with their normal account and optionally connect their own personal Google Drive solely for backup storage.
2. **Hidden Application Data Folder (`appDataFolder`):**
   - Uses the dedicated `https://www.googleapis.com/auth/drive.appdata` scope.
   - Backups are stored in Google Drive's hidden `appDataFolder` under a single overwriteable file (`app-backup.json`).
   - The app **cannot** view, list, or edit the user's personal Google Drive files, photos, or documents.
   - Users cannot accidentally edit or trash the file in their main Drive UI, but can view storage usage under **Google Drive > Settings > Manage Apps**.
3. **Encrypted at Rest:**
   - Google `refresh_token`s are encrypted at rest in the database using **AES-256-GCM** with authenticated checksum tags via Node.js `crypto`.
4. **Existing Offline Backup Preserved:**
   - Standalone integration; your existing local/offline backup (JSON download/upload) remains 100% active.

---

## ⚙️ Google Cloud Console Setup (Step-by-Step)

### Step 1: Create or Select a Google Cloud Project
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown in the top bar and click **New Project** (e.g. `My Next.js App`).

### Step 2: Enable the Google Drive API
1. In the left navigation, go to **APIs & Services > Library**.
2. Search for **Google Drive API**.
3. Select it and click **Enable**.

### Step 3: Configure the OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** (or **Internal** if using Google Workspace).
3. Fill in the required application details:
   - **App name**: (e.g., *Minimal Note Backup*)
   - **User support email**: Your support email.
   - **Developer contact information**: Your email.
4. Click **Save and Continue** to reach the **Scopes** page.
5. Click **Add or Remove Scopes** and add:
   - `.../auth/drive.appdata` (See, create, and delete its own configuration data in your Google Drive)
   - `.../auth/userinfo.email` (See your primary Google Account email address)
6. Click **Update** > **Save and Continue**.
7. Under **Test users**, add the email address you will use for testing during development.
8. Click **Save and Continue**.

### Step 4: Create OAuth 2.0 Client Credentials
1. Go to **APIs & Services > Credentials**.
2. Click **+ Create Credentials** > **OAuth client ID**.
3. Set **Application type** to **Web application**.
4. Set **Name**: `Next.js App Web Client`.
5. Under **Authorized redirect URIs**, add:
   - Local: `http://localhost:3000/api/google-drive/callback`
   - Production: `https://yourdomain.com/api/google-drive/callback`
6. Click **Create**.
7. Copy the **Client ID** and **Client Secret**.

---

## 🔐 Environment Variables (`.env.local`)

Copy `.env.example` into your `.env.local` and populate the keys:

```env
# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-drive/callback

# 32-byte AES-256-GCM encryption key for refresh tokens at rest
# Generate one using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
TOKEN_ENCRYPTION_KEY=your-64-character-hex-encryption-key-here

# Next.js App Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📁 File Structure & Deliverables

| File | Path | Description |
| :--- | :--- | :--- |
| **Encryption Utility** | `src/lib/encryption.ts` | AES-256-GCM encryption/decryption with auth tag verification. |
| **Google Drive Core** | `src/lib/google-drive.ts` | OAuth2 client factory, Drive API operations & token revocation. |
| **Storage Adapter** | `src/lib/db/google-drive-model.ts` | Pluggable interface + Prisma & SQL schema snippets. |
| **OAuth Connect Route** | `src/app/api/google-drive/connect/route.ts` | Initiates Google OAuth consent flow with `offline` + `consent`. |
| **OAuth Callback Route** | `src/app/api/google-drive/callback/route.ts` | Exchanges auth code for encrypted tokens and saves to DB. |
| **Sync Route (Info/Restore/Save)** | `src/app/api/google-drive/sync/route.ts` | `GET ?mode=info`, `GET ?mode=restore`, and `POST` (upload/update). |
| **Disconnect Route** | `src/app/api/google-drive/disconnect/route.ts` | Revokes token via Google's endpoint and clears DB record. |
| **UI Component** | `src/components/GoogleDriveBackupSettings.tsx` | React client component with Tailwind CSS & confirmation dialogs. |

---

## 🔌 Plugging in Your Database (Prisma, Drizzle, Supabase)

By default, an in-memory storage adapter is provided for local testing. To persist to your database in production:

### 1. Prisma Example

Add the model to `prisma/schema.prisma`:
```prisma
model GoogleDriveBackup {
  id                    String    @id @default(cuid())
  userId                String    @unique
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  googleEmail           String
  encryptedRefreshToken String    @db.Text
  iv                    String
  tag                   String
  isEnabled             Boolean   @default(true)
  autoBackupFrequency   String    @default("daily")
  lastBackupAt          DateTime?
  lastBackupSize        Int?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}
```

Register your adapter in your server initialization code:
```ts
import { setGoogleDriveStorageAdapter, IGoogleDriveStorageAdapter } from '@/lib/db/google-drive-model';
import { prisma } from '@/lib/prisma';

class PrismaGoogleDriveAdapter implements IGoogleDriveStorageAdapter {
  async getUserBackupRecord(userId: string) {
    const r = await prisma.googleDriveBackup.findUnique({ where: { userId } });
    if (!r) return null;
    return {
      ...r,
      lastBackupAt: r.lastBackupAt?.toISOString() || null,
      autoBackupFrequency: r.autoBackupFrequency as any,
    };
  }

  async saveUserBackupRecord(userId: string, data: any) {
    return prisma.googleDriveBackup.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async deleteUserBackupRecord(userId: string) {
    await prisma.googleDriveBackup.deleteMany({ where: { userId } });
  }
}

setGoogleDriveStorageAdapter(new PrismaGoogleDriveAdapter());
```

---

## 💻 Rendering the UI Component

Mount `GoogleDriveBackupSettings` in any settings page or modal:

```tsx
import { GoogleDriveBackupSettings } from '@/components/GoogleDriveBackupSettings';

export default function SettingsPage() {
  return (
    <div className="container py-8">
      {/* Standalone Google Drive Personal Backup Card */}
      <GoogleDriveBackupSettings
        exportUserData={async () => {
          // Return your app's serialized state or data
          return { data: 'my-custom-app-state' };
        }}
        importUserData={async (data) => {
          // Hydrate restored data back into your app
          console.log('Restored data:', data);
        }}
      />
    </div>
  );
}
```

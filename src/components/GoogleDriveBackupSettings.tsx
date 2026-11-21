'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Lock,
  ExternalLink,
  ChevronRight,
  X,
  AlertTriangle,
} from 'lucide-react';
import { db, bulkPersistNotes } from '@/lib/storage';
import { useNotesStore } from '@/store/useNotesStore';

export type AutoBackupFrequency = 'off' | 'daily' | 'weekly';

export interface GoogleDriveStatus {
  isConnected: boolean;
  googleEmail: string | null;
  lastBackupAt: string | null;
  lastBackupSize: number | null;
  autoBackupFrequency: AutoBackupFrequency;
  isEnabled: boolean;
  exists?: boolean;
}

export interface GoogleDriveBackupSettingsProps {
  /**
   * Optional custom function to serialize user data.
   * Defaults to exporting all local IndexedDB notes & preferences.
   */
  exportUserData?: () => Promise<any>;

  /**
   * Optional custom function to hydrate restored user data.
   * Defaults to restoring notes into local IndexedDB and updating store.
   */
  importUserData?: (data: any) => Promise<void>;

  /**
   * Optional callback when user closes the settings view.
   */
  onClose?: () => void;
}

/**
 * Default exporter: extracts all notes and user preferences from Dexie IndexedDB.
 */
export async function defaultExportUserData(): Promise<any> {
  const notes = await db.notes.toArray();
  const preferences = useNotesStore.getState().preferences;
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    notes,
    preferences,
  };
}

/**
 * Default importer: restores notes into IndexedDB and re-hydrates Zustand store.
 */
export async function defaultImportUserData(data: any): Promise<void> {
  if (!data || !Array.isArray(data.notes)) {
    throw new Error('Invalid backup format: missing notes array');
  }
  await useNotesStore.getState().importBackup(data.notes, true);
  if (data.preferences) {
    await useNotesStore.getState().updatePreferences(data.preferences);
  }
}

/**
 * Format bytes into human-readable string (e.g. "142 KB" or "1.2 MB").
 */
function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format ISO timestamp into clean readable date and time.
 */
function formatTimestamp(isoString: string | null | undefined): string {
  if (!isoString) return 'Never';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Never';
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Never';
  }
}

export const GoogleDriveBackupSettings: React.FC<GoogleDriveBackupSettingsProps> = ({
  exportUserData = defaultExportUserData,
  importUserData = defaultImportUserData,
  onClose,
}) => {
  const [status, setStatus] = useState<GoogleDriveStatus>({
    isConnected: false,
    googleEmail: null,
    lastBackupAt: null,
    lastBackupSize: null,
    autoBackupFrequency: 'daily',
    isEnabled: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Confirmation Modals
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // Status message / toast
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  const clearFeedback = () => setFeedback(null);

  // Fetch current Google Drive backup status and metadata from API
  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/google-drive/sync?mode=info', {
        headers: { Accept: 'application/json' },
      });

      if (res.status === 401) {
        // Token was revoked or disconnected
        setStatus({
          isConnected: false,
          googleEmail: null,
          lastBackupAt: null,
          lastBackupSize: null,
          autoBackupFrequency: 'off',
          isEnabled: false,
        });
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.warn('Could not fetch Google Drive status (API might not be mounted in dev):', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Check URL parameters for OAuth return status
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const gdStatus = urlParams.get('googleDrive');
      if (gdStatus === 'connected') {
        const email = urlParams.get('email');
        setFeedback({
          type: 'success',
          message: email
            ? `Google Drive connected successfully to ${email}!`
            : 'Google Drive connected successfully!',
        });
        // Clean up URL without reload
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        fetchStatus();
      } else if (gdStatus === 'error') {
        const reason = urlParams.get('reason') || 'Authorization was canceled or failed';
        setFeedback({
          type: 'error',
          message: `Connection failed: ${reason}`,
        });
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [fetchStatus]);

  // Initiate OAuth connection flow
  const handleConnect = async () => {
    clearFeedback();
    try {
      // Direct browser navigation to start OAuth flow
      window.location.href = '/api/google-drive/connect';
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to initiate Google Drive connection.',
      });
    }
  };

  // Disconnect and revoke token
  const handleDisconnect = async () => {
    clearFeedback();
    setIsDisconnecting(true);
    try {
      const res = await fetch('/api/google-drive/disconnect', { method: 'POST' });
      if (res.ok) {
        setStatus({
          isConnected: false,
          googleEmail: null,
          lastBackupAt: null,
          lastBackupSize: null,
          autoBackupFrequency: 'off',
          isEnabled: false,
        });
        setShowDisconnectModal(false);
        setFeedback({
          type: 'success',
          message: 'Google Drive disconnected. Your cloud backup file remains securely in Drive.',
        });
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Failed to disconnect');
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not disconnect Google Drive.',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Perform immediate backup
  const handleBackupNow = async () => {
    clearFeedback();
    setIsBackingUp(true);
    try {
      const dataPayload = await exportUserData();

      const res = await fetch('/api/google-drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataPayload }),
      });

      if (res.status === 401) {
        const err = await res.json();
        if (err.error === 'DRIVE_DISCONNECTED') {
          setStatus((prev) => ({ ...prev, isConnected: false }));
          throw new Error('Google Drive access was revoked from your Google Account. Please reconnect.');
        }
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Backup failed');
      }

      const result = await res.json();
      setStatus((prev) => ({
        ...prev,
        lastBackupAt: result.lastBackupAt,
        lastBackupSize: result.sizeBytes,
        exists: true,
      }));

      setFeedback({
        type: 'success',
        message: `Backup complete! (${formatBytes(result.sizeBytes)} saved to hidden app folder)`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to create backup.',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // Execute restore after user confirmation
  const handleConfirmRestore = async () => {
    clearFeedback();
    setIsRestoring(true);
    try {
      const res = await fetch('/api/google-drive/sync?mode=restore');

      if (res.status === 401) {
        setStatus((prev) => ({ ...prev, isConnected: false }));
        throw new Error('Google Drive access was revoked. Please reconnect.');
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to download backup');
      }

      const result = await res.json();
      if (!result.data) {
        throw new Error('No data received from backup');
      }

      await importUserData(result.data);
      setShowRestoreModal(false);

      setFeedback({
        type: 'success',
        message: 'Data successfully restored from your personal Google Drive backup!',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to restore backup.',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Update auto-backup frequency preference
  const handleFrequencyChange = async (freq: AutoBackupFrequency) => {
    try {
      setStatus((prev) => ({ ...prev, autoBackupFrequency: freq }));
      await fetch('/api/google-drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatePreferencesOnly: true,
          autoBackupFrequency: freq,
        }),
      });
    } catch (err) {
      console.warn('Failed to update backup frequency:', err);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-card text-card-foreground border border-border/80 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Official Google Drive icon styling */}
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-xs">
            <svg viewBox="0 0 87.3 78" className="w-6 h-6">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                Google Drive Backup
              </h2>
              {status.isConnected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Linked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border/60">
                  Opt-In
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              WhatsApp-style personal cloud backup inside hidden app folder.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Toast / Banner Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-medium flex items-center justify-between gap-3 border animate-in fade-in duration-150 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : feedback.type === 'error'
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="truncate">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={clearFeedback}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Checking Google Drive connection...</span>
        </div>
      ) : !status.isConnected ? (
        /* ========================================================================
           STATE 1: UNLINKED / DISABLED STATE
           ======================================================================== */
        <div className="space-y-5">
          {/* Privacy Callout */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>100% Private Personal Cloud Storage</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Backups are stored inside your personal Google Drive in a dedicated, hidden
              <code className="mx-1 px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] text-foreground font-semibold">
                appDataFolder
              </code>
              space.
            </p>
            <ul className="text-[11px] text-muted-foreground/90 space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>The app <strong>cannot</strong> read, edit, or access your personal files or photos.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Backups are hidden from your main Drive list, preventing accidental deletion.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Manage or delete storage anytime in your Google Account Settings.</span>
              </li>
            </ul>
          </div>

          {/* Connect CTA Button */}
          <button
            type="button"
            onClick={handleConnect}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:opacity-95 active:scale-98 transition-all cursor-pointer"
          >
            <Cloud className="w-4 h-4" />
            <span>Enable &amp; Connect Google Drive</span>
          </button>
        </div>
      ) : (
        /* ========================================================================
           STATE 2: LINKED / ENABLED STATE
           ======================================================================== */
        <div className="space-y-5">
          {/* Linked Account Card */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {status.googleEmail ? status.googleEmail.charAt(0).toUpperCase() : 'G'}
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Linked Google Account
                </span>
                <span className="block text-xs sm:text-sm font-bold text-foreground truncate">
                  {status.googleEmail || 'Connected Account'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDisconnectModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer shrink-0"
            >
              Disconnect
            </button>
          </div>

          {/* Stats Grid: Last Backup & Backup Size */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/60 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Last Backup
              </span>
              <span className="text-xs sm:text-sm font-bold text-foreground block truncate">
                {formatTimestamp(status.lastBackupAt)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/60 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Backup Size
              </span>
              <span className="text-xs sm:text-sm font-bold text-foreground block">
                {formatBytes(status.lastBackupSize)}
              </span>
            </div>
          </div>

          {/* Auto-Backup Frequency Selector */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/30 border border-border/70">
            <div>
              <span className="block text-xs font-bold text-foreground">Auto-Backup Schedule</span>
              <span className="block text-[11px] text-muted-foreground">
                Automatic synchronization frequency
              </span>
            </div>

            <select
              value={status.autoBackupFrequency}
              onChange={(e) => handleFrequencyChange(e.target.value as AutoBackupFrequency)}
              className="bg-card text-foreground border border-border rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="off">Manual Only</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          {/* Primary Action Buttons: Back Up Now & Restore */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              disabled={isBackingUp || isRestoring}
              onClick={handleBackupNow}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:opacity-95 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Backing up...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  <span>Back Up Now</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isBackingUp || isRestoring || (!status.exists && !status.lastBackupAt)}
              onClick={() => setShowRestoreModal(true)}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs border border-border transition-all active:scale-98 disabled:opacity-40 cursor-pointer"
            >
              {isRestoring ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Restoring...</span>
                </>
              ) : (
                <>
                  <CloudDownload className="w-4 h-4 text-primary" />
                  <span>Restore from Drive</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================
          CONFIRMATION MODAL: RESTORE WARNING
          ======================================================================== */}
      {showRestoreModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm p-6 bg-card border border-border rounded-3xl shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Restore Backup?</h3>
                <p className="text-xs text-muted-foreground">
                  Snapshot from {formatTimestamp(status.lastBackupAt)}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This will overwrite your current local application data with the backup payload saved in your
              personal Google Drive.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={handleConfirmRestore}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:opacity-95 active:scale-95 transition-all shadow-md shadow-amber-500/25 flex items-center gap-1.5 cursor-pointer"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Restoring...</span>
                  </>
                ) : (
                  <span>Overwrite &amp; Restore</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          CONFIRMATION MODAL: DISCONNECT
          ======================================================================== */}
      {showDisconnectModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm p-6 bg-card border border-border rounded-3xl shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Disconnect Google Drive?</h3>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {status.googleEmail}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Automatic backups will stop and access will be revoked. Your existing backup file in Google Drive will
              <strong> not</strong> be deleted.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDisconnecting}
                onClick={() => setShowDisconnectModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDisconnecting}
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 text-white hover:opacity-95 active:scale-95 transition-all shadow-md shadow-rose-500/25 flex items-center gap-1.5 cursor-pointer"
              >
                {isDisconnecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Disconnecting...</span>
                  </>
                ) : (
                  <span>Disconnect</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

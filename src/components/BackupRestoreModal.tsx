import React, { useRef, useState } from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import type { BackupExportFile, NoteItem } from '@/types/note';
import { Download, Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { notes, preferences, importBackup } = useNotesStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportBackup = () => {
    const backup: BackupExportFile = {
      app: 'minimal-note',
      version: 1,
      exportedAt: new Date().toISOString(),
      notesCount: notes.length,
      notes,
      preferences,
    };

    const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm');
    const filename = `minimal_note_backup_${dateStr}.json`;

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        let importedNotes: NoteItem[] = [];

        if (Array.isArray(parsed)) {
          importedNotes = parsed;
        } else if (parsed && Array.isArray(parsed.notes)) {
          importedNotes = parsed.notes;
        } else {
          throw new Error('Unrecognized backup format');
        }

        if (importedNotes.length === 0) {
          setImportStatus('Backup file contained 0 notes.');
          return;
        }

        await importBackup(importedNotes, false);
        setImportStatus(`Successfully restored ${importedNotes.length} notes!`);
      } catch (err) {
        setImportError(
          'Failed to import backup file. Ensure it is a valid JSON backup file.'
        );
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Backup & Restore</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Keep your thoughts safe. Export your notes to an offline JSON backup file or restore previously saved data anytime without internet connectivity.
        </p>

        {importStatus && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        {importError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Export Button */}
          <button
            onClick={handleExportBackup}
            className="w-full flex items-center justify-between p-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-muted/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <Download className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-sm font-semibold text-foreground block">
                  Export Backup
                </span>
                <span className="text-xs text-muted-foreground">
                  Save {notes.length} notes to a local JSON file
                </span>
              </div>
            </div>
          </button>

          {/* Import Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between p-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-muted/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-sm font-semibold text-foreground block">
                  Restore from File
                </span>
                <span className="text-xs text-muted-foreground">
                  Select a previously exported .json file
                </span>
              </div>
            </div>
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import { Navbar } from '@/components/Navbar';
import { NotesList } from '@/components/NotesList';
import { NoteEditorModal } from '@/components/NoteEditorModal';
import { ReminderModal } from '@/components/ReminderModal';
import { BackupRestoreModal } from '@/components/BackupRestoreModal';
import { SettingsModal } from '@/components/SettingsModal';
import { AboutModal } from '@/components/AboutModal';
import { UndoToast } from '@/components/UndoToast';

export const App: React.FC = () => {
  const { initialize, checkDueReminders } = useNotesStore();

  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  useEffect(() => {
    // Initialize storage and theme
    initialize().finally(() => {
      // Dismiss the splash screen smoothly once the app is loaded
      const splash = document.getElementById('app-splash');
      if (splash) {
        splash.classList.add('splash-hidden');
        setTimeout(() => splash.remove(), 450);
      }
    });

    // Ask notification permission on start (non-blocking)
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    // Set reminder check interval (checks every 15 seconds)
    const interval = setInterval(() => {
      checkDueReminders();
    }, 15000);

    return () => clearInterval(interval);
  }, [initialize, checkDueReminders]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      <NotesList />

      {/* Modals & Dialogs */}
      <NoteEditorModal />
      <ReminderModal />
      <BackupRestoreModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Floating Undo Snackbar */}
      <UndoToast />
    </div>
  );
};

export default App;

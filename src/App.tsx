import React, { useEffect, useState } from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import { Navbar } from '@/components/Navbar';
import { NotesList } from '@/components/NotesList';
import { NoteEditorModal } from '@/components/NoteEditorModal';
import { ReminderModal } from '@/components/ReminderModal';
import { BackupRestoreModal } from '@/components/BackupRestoreModal';
import { SettingsModal } from '@/components/SettingsModal';
import { AboutModal } from '@/components/AboutModal';
import { LanguageModal } from '@/components/LanguageModal';
import { PwaInstallBanner } from '@/components/PwaInstallBanner';
import { UndoToast } from '@/components/UndoToast';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { ImageLightboxModal } from '@/components/ImageLightboxModal';
import { NoteReminderModal } from '@/components/NoteReminderModal';
import { NoteColorModal } from '@/components/NoteColorModal';

export const App: React.FC = () => {
  const { initialize, checkDueReminders } = useNotesStore();

  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

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
        onOpenLanguage={() => setIsLanguageOpen(true)}
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
        onOpenLanguage={() => setIsLanguageOpen(true)}
      />
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
      <LanguageModal
        isOpen={isLanguageOpen}
        onClose={() => setIsLanguageOpen(false)}
      />

      {/* PWA Launch Installation Banner (Mobile & Desktop) */}
      <PwaInstallBanner />

      {/* Floating Undo Snackbar */}
      <UndoToast />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmModal />

      {/* Image Lightbox Modal (Always on top) */}
      <ImageLightboxModal />

      {/* Note-Specific Reminder & Color Settings Modals */}
      <NoteReminderModal />
      <NoteColorModal />
    </div>
  );
};

export default App;

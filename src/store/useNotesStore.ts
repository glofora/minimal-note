import { create } from 'zustand';
import type {
  NoteColor,
  NoteItem,
  NoteType,
  ChecklistItem,
  SnoozeDuration,
  UserPreferences,
} from '@/types/note';
import {
  loadStoredNotes,
  persistNote,
  removeNote,
  bulkPersistNotes,
  loadUserPreferences,
  saveUserPreferences,
} from '@/lib/storage';
import { generateUUID } from '@/lib/utils';
import { addMinutes } from 'date-fns';

interface NotesState {
  notes: NoteItem[];
  isLoading: boolean;
  searchQuery: string;
  filterColor: NoteColor | 'all';
  activeEditingNote: NoteItem | null;
  isEditorOpen: boolean;
  undoCache: { note: NoteItem; originalIndex: number } | null;
  preferences: UserPreferences;
  dueReminderNote: NoteItem | null;

  // Actions
  initialize: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilterColor: (color: NoteColor | 'all') => void;
  openCreateModal: (defaultColor?: NoteColor, noteType?: NoteType) => void;
  openEditModal: (note: NoteItem) => void;
  closeEditorModal: () => void;
  saveActiveNote: (partial: Partial<NoteItem>) => Promise<NoteItem>;
  deleteNote: (id: string) => Promise<void>;
  undoDeleteNote: () => Promise<void>;
  clearUndoCache: () => void;
  reorderNotes: (activeId: string, overId: string) => Promise<void>;
  toggleChecklistItem: (noteId: string, itemId: string) => Promise<void>;
  snoozeReminder: (noteId: string, durationMinutes: SnoozeDuration) => Promise<void>;
  dismissReminder: (noteId: string) => Promise<void>;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => Promise<void>;
  importBackup: (notes: NoteItem[], overwrite: boolean) => Promise<void>;
  checkDueReminders: () => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  isLoading: true,
  searchQuery: '',
  filterColor: 'all',
  activeEditingNote: null,
  isEditorOpen: false,
  undoCache: null,
  dueReminderNote: null,
  preferences: {
    theme: 'system',
    is24HourFormat: false,
    defaultColor: 'indigo',
    enableSound: true,
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const [storedNotes, storedPrefs] = await Promise.all([
        loadStoredNotes(),
        loadUserPreferences(),
      ]);

      // Normalize loaded notes for backward compatibility
      const normalizedNotes: NoteItem[] = storedNotes.map((n) => ({
        ...n,
        noteType: n.noteType || 'text',
        checklist: n.checklist || [],
        images: n.images || (n.imageDataUrl ? [n.imageDataUrl] : []),
        links: n.links || [],
      }));

      // Apply initial theme
      applyTheme(storedPrefs.theme);

      set({
        notes: normalizedNotes,
        preferences: storedPrefs,
        isLoading: false,
      });

      // Start periodic reminder checking
      get().checkDueReminders();
    } catch (err) {
      console.error('Store initialization failed:', err);
      set({ isLoading: false });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setFilterColor: (color: NoteColor | 'all') => {
    set({ filterColor: color });
  },

  openCreateModal: (defaultColor, noteType: NoteType = 'text') => {
    const state = get();
    const initialChecklist: ChecklistItem[] =
      noteType === 'checklist'
        ? [{ id: generateUUID(), text: '', isCompleted: false }]
        : [];

    const newNote: NoteItem = {
      id: generateUUID(),
      title: '',
      description: '',
      color: defaultColor || state.preferences.defaultColor,
      noteType,
      checklist: initialChecklist,
      images: [],
      links: [],
      hasReminder: false,
      reminderAt: null,
      imageDataUrl: null,
      isPinned: false,
      isCompleted: false,
      orderIndex: state.notes.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ activeEditingNote: newNote, isEditorOpen: true });
  },

  openEditModal: (note: NoteItem) => {
    set({
      activeEditingNote: {
        ...note,
        noteType: note.noteType || 'text',
        checklist: note.checklist || [],
        images: note.images || (note.imageDataUrl ? [note.imageDataUrl] : []),
        links: note.links || [],
      },
      isEditorOpen: true,
    });
  },

  closeEditorModal: () => {
    set({ isEditorOpen: false, activeEditingNote: null });
  },

  saveActiveNote: async (partial: Partial<NoteItem>) => {
    const { activeEditingNote, notes } = get();
    if (!activeEditingNote) {
      throw new Error('No active note to save');
    }

    const updatedNote: NoteItem = {
      ...activeEditingNote,
      ...partial,
      updatedAt: new Date().toISOString(),
    };

    // If completely blank, skip empty save
    const hasText = updatedNote.title.trim().length > 0 || updatedNote.description.trim().length > 0;
    const hasChecklist = (updatedNote.checklist || []).some((item) => item.text.trim().length > 0);
    const hasImages = (updatedNote.images || []).length > 0;

    if (!hasText && !hasChecklist && !hasImages) {
      set({ isEditorOpen: false, activeEditingNote: null });
      return updatedNote;
    }

    const existingIndex = notes.findIndex((n) => n.id === updatedNote.id);
    let newNotesList: NoteItem[];

    if (existingIndex >= 0) {
      newNotesList = [...notes];
      newNotesList[existingIndex] = updatedNote;
    } else {
      newNotesList = [updatedNote, ...notes];
      newNotesList = newNotesList.map((n, idx) => ({ ...n, orderIndex: idx }));
    }

    set({ notes: newNotesList, isEditorOpen: false, activeEditingNote: null });
    await persistNote(updatedNote);
    return updatedNote;
  },

  toggleChecklistItem: async (noteId: string, itemId: string) => {
    const { notes } = get();
    const note = notes.find((n) => n.id === noteId);
    if (!note || !note.checklist) return;

    const updatedChecklist = note.checklist.map((item) =>
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );

    const updatedNote: NoteItem = {
      ...note,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString(),
    };

    const newNotes = notes.map((n) => (n.id === noteId ? updatedNote : n));
    set({ notes: newNotes });
    await persistNote(updatedNote);
  },

  deleteNote: async (id: string) => {
    const { notes } = get();
    const targetIndex = notes.findIndex((n) => n.id === id);
    if (targetIndex === -1) return;

    const targetNote = notes[targetIndex];
    const newNotesList = notes.filter((n) => n.id !== id);

    set({
      notes: newNotesList,
      undoCache: { note: targetNote, originalIndex: targetIndex },
    });

    await removeNote(id);
  },

  undoDeleteNote: async () => {
    const { undoCache, notes } = get();
    if (!undoCache) return;

    const restoredList = [...notes];
    restoredList.splice(undoCache.originalIndex, 0, undoCache.note);

    set({
      notes: restoredList,
      undoCache: null,
    });

    await persistNote(undoCache.note);
  },

  clearUndoCache: () => {
    set({ undoCache: null });
  },

  reorderNotes: async (activeId: string, overId: string) => {
    const { notes } = get();
    const oldIndex = notes.findIndex((n) => n.id === activeId);
    const newIndex = notes.findIndex((n) => n.id === overId);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = [...notes];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const withOrder = reordered.map((item, idx) => ({ ...item, orderIndex: idx }));
    set({ notes: withOrder });
    await bulkPersistNotes(withOrder);
  },

  snoozeReminder: async (noteId: string, durationMinutes: SnoozeDuration) => {
    const { notes } = get();
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    const snoozedDate = addMinutes(new Date(), durationMinutes).toISOString();
    const updatedNote: NoteItem = {
      ...note,
      hasReminder: true,
      reminderAt: snoozedDate,
      updatedAt: new Date().toISOString(),
    };

    const newNotes = notes.map((n) => (n.id === noteId ? updatedNote : n));
    set({ notes: newNotes, dueReminderNote: null });
    await persistNote(updatedNote);
  },

  dismissReminder: async (noteId: string) => {
    const { notes } = get();
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    const updatedNote: NoteItem = {
      ...note,
      hasReminder: false,
      reminderAt: null,
      updatedAt: new Date().toISOString(),
    };

    const newNotes = notes.map((n) => (n.id === noteId ? updatedNote : n));
    set({ notes: newNotes, dueReminderNote: null });
    await persistNote(updatedNote);
  },

  updatePreferences: async (partial: Partial<UserPreferences>) => {
    const current = get().preferences;
    const updated = { ...current, ...partial };
    set({ preferences: updated });

    if (partial.theme) {
      applyTheme(partial.theme);
    }

    await saveUserPreferences(updated);
  },

  importBackup: async (importedNotes: NoteItem[], overwrite: boolean) => {
    const current = get().notes;
    let combined: NoteItem[];

    const normalized = importedNotes.map((n) => ({
      ...n,
      noteType: n.noteType || 'text',
      checklist: n.checklist || [],
      images: n.images || (n.imageDataUrl ? [n.imageDataUrl] : []),
      links: n.links || [],
    }));

    if (overwrite) {
      combined = normalized.map((n, idx) => ({ ...n, orderIndex: idx }));
    } else {
      const existingIds = new Set(current.map((n) => n.id));
      const newItems = normalized.filter((n) => !existingIds.has(n.id));
      combined = [...current, ...newItems].map((n, idx) => ({ ...n, orderIndex: idx }));
    }

    set({ notes: combined });
    await bulkPersistNotes(combined);
  },

  checkDueReminders: () => {
    const { notes, dueReminderNote } = get();
    if (dueReminderNote) return;

    const now = new Date().getTime();
    const due = notes.find((n) => {
      if (!n.hasReminder || !n.reminderAt) return false;
      const targetTime = new Date(n.reminderAt).getTime();
      return targetTime <= now;
    });

    if (due) {
      set({ dueReminderNote: due });
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(due.title || 'Note Reminder', {
            body: due.description || 'You have a scheduled reminder.',
            icon: '/vite.svg',
          });
        } catch (e) {
          console.warn('Notification failed:', e);
        }
      }
    }
  },
}));

function applyTheme(theme: UserPreferences['theme']) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (theme === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', systemDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

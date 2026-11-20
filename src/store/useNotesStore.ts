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
  noteToDelete: { id: string; title: string } | null;
  noteForReminderModal: NoteItem | null;
  noteForColorModal: NoteItem | null;
  previewImage: string | null;
  previewGallery: { images: string[]; activeIndex: number } | null;
  preferences: UserPreferences;
  dueReminderNote: NoteItem | null;

  // Actions
  initialize: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilterColor: (color: NoteColor | 'all') => void;
  openCreateModal: (defaultColor?: NoteColor, noteType?: NoteType) => void;
  openEditModal: (note: NoteItem) => void;
  closeEditorModal: () => void;
  openNoteReminderModal: (note: NoteItem) => void;
  closeNoteReminderModal: () => void;
  openNoteColorModal: (note: NoteItem) => void;
  closeNoteColorModal: () => void;
  updateNoteReminder: (noteId: string, reminderAt: string | null) => Promise<void>;
  updateNoteColor: (noteId: string, color: NoteColor) => Promise<void>;
  openImagePreview: (imageUrl: string) => void;
  closeImagePreview: () => void;
  openImageGallery: (images: string[], initialIndex?: number) => void;
  closeImageGallery: () => void;
  nextGalleryImage: () => void;
  prevGalleryImage: () => void;
  saveActiveNote: (partial: Partial<NoteItem>) => Promise<NoteItem>;
  deleteNote: (id: string) => Promise<void>;
  requestDeleteNote: (id: string, title?: string) => void;
  cancelDeleteNote: () => void;
  confirmDeleteNote: () => Promise<void>;
  togglePinNote: (id: string) => Promise<void>;
  undoDeleteNote: () => Promise<void>;
  clearUndoCache: () => void;
  reorderNotes: (activeId: string, overId: string) => Promise<void>;
  moveNoteToTop: (id: string) => Promise<void>;
  moveNoteToBottom: (id: string) => Promise<void>;
  moveNoteUp: (id: string) => Promise<void>;
  moveNoteDown: (id: string) => Promise<void>;
  toggleChecklistItem: (noteId: string, itemId: string) => Promise<void>;
  updateChecklistOrder: (noteId: string, items: ChecklistItem[]) => Promise<void>;
  snoozeReminder: (noteId: string, durationMinutes: SnoozeDuration) => Promise<void>;
  dismissReminder: (noteId: string) => Promise<void>;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => Promise<void>;
  toggleViewMode: () => Promise<void>;
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
  noteToDelete: null,
  noteForReminderModal: null,
  noteForColorModal: null,
  previewImage: null,
  previewGallery: null,
  dueReminderNote: null,
  preferences: {
    theme: 'system',
    is24HourFormat: false,
    defaultColor: 'indigo',
    enableSound: true,
    viewMode: (typeof localStorage !== 'undefined' && (localStorage.getItem('minimal_note_view_mode') as 'list' | 'tile')) || 'list',
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
        isPinned: Boolean(n.isPinned),
        noteType: n.noteType || 'text',
        checklist: n.checklist || [],
        images: n.images || (n.imageDataUrl ? [n.imageDataUrl] : []),
        links: n.links || [],
      }));

      // Apply initial theme
      applyTheme(storedPrefs.theme);

      // Check localStorage for preferred viewMode
      const savedViewMode = (typeof localStorage !== 'undefined' && (localStorage.getItem('minimal_note_view_mode') as 'list' | 'tile')) || storedPrefs.viewMode || 'list';

      set({
        notes: normalizedNotes,
        preferences: { ...storedPrefs, viewMode: savedViewMode },
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
        isPinned: Boolean(note.isPinned),
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

  openNoteReminderModal: (note: NoteItem) => {
    set({ noteForReminderModal: note });
  },

  closeNoteReminderModal: () => {
    set({ noteForReminderModal: null });
  },

  openNoteColorModal: (note: NoteItem) => {
    set({ noteForColorModal: note });
  },

  closeNoteColorModal: () => {
    set({ noteForColorModal: null });
  },

  updateNoteReminder: async (noteId: string, reminderAt: string | null) => {
    const { notes, activeEditingNote } = get();
    const note = notes.find((n) => n.id === noteId) || (activeEditingNote?.id === noteId ? activeEditingNote : null);
    if (!note) return;

    const hasReminder = Boolean(reminderAt);
    const updatedNote: NoteItem = {
      ...note,
      hasReminder,
      reminderAt,
      updatedAt: new Date().toISOString(),
    };

    const newNotes = notes.map((n) => (n.id === noteId ? updatedNote : n));
    set({
      notes: newNotes,
      noteForReminderModal: null,
      activeEditingNote: activeEditingNote?.id === noteId ? updatedNote : activeEditingNote,
    });
    await persistNote(updatedNote);
  },

  updateNoteColor: async (noteId: string, color: NoteColor) => {
    const { notes, activeEditingNote } = get();
    const note = notes.find((n) => n.id === noteId) || (activeEditingNote?.id === noteId ? activeEditingNote : null);
    if (!note) return;

    const updatedNote: NoteItem = {
      ...note,
      color,
      updatedAt: new Date().toISOString(),
    };

    const newNotes = notes.map((n) => (n.id === noteId ? updatedNote : n));
    set({
      notes: newNotes,
      noteForColorModal: null,
      activeEditingNote: activeEditingNote?.id === noteId ? updatedNote : activeEditingNote,
    });
    await persistNote(updatedNote);
  },

  openImagePreview: (imageUrl: string) => {
    set({
      previewImage: imageUrl,
      previewGallery: { images: [imageUrl], activeIndex: 0 },
    });
  },

  closeImagePreview: () => {
    set({ previewImage: null, previewGallery: null });
  },

  openImageGallery: (images: string[], initialIndex = 0) => {
    if (!images || images.length === 0) return;
    const clampedIndex = Math.max(0, Math.min(initialIndex, images.length - 1));
    set({
      previewImage: images[clampedIndex],
      previewGallery: { images, activeIndex: clampedIndex },
    });
  },

  closeImageGallery: () => {
    set({ previewImage: null, previewGallery: null });
  },

  nextGalleryImage: () => {
    const { previewGallery } = get();
    if (!previewGallery || previewGallery.images.length <= 1) return;
    const nextIndex = (previewGallery.activeIndex + 1) % previewGallery.images.length;
    set({
      previewImage: previewGallery.images[nextIndex],
      previewGallery: { ...previewGallery, activeIndex: nextIndex },
    });
  },

  prevGalleryImage: () => {
    const { previewGallery } = get();
    if (!previewGallery || previewGallery.images.length <= 1) return;
    const prevIndex = (previewGallery.activeIndex - 1 + previewGallery.images.length) % previewGallery.images.length;
    set({
      previewImage: previewGallery.images[prevIndex],
      previewGallery: { ...previewGallery, activeIndex: prevIndex },
    });
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

  updateChecklistOrder: async (noteId: string, items: ChecklistItem[]) => {
    const { notes, activeEditingNote } = get();
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    const updatedNote: NoteItem = {
      ...note,
      checklist: items,
      updatedAt: new Date().toISOString(),
    };

    const newNotes = notes.map((n) => (n.id === noteId ? updatedNote : n));
    set({
      notes: newNotes,
      activeEditingNote:
        activeEditingNote?.id === noteId
          ? { ...activeEditingNote, checklist: items }
          : activeEditingNote,
    });
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

  requestDeleteNote: (id: string, title?: string) => {
    const { notes } = get();
    const note = notes.find((n) => n.id === id);
    const resolvedTitle = title !== undefined ? title : note?.title || '';
    set({ noteToDelete: { id, title: resolvedTitle } });
  },

  cancelDeleteNote: () => {
    set({ noteToDelete: null });
  },

  confirmDeleteNote: async () => {
    const { noteToDelete, deleteNote, activeEditingNote, closeEditorModal } = get();
    if (!noteToDelete) return;
    const targetId = noteToDelete.id;
    set({ noteToDelete: null });

    if (activeEditingNote?.id === targetId) {
      closeEditorModal();
    }

    await deleteNote(targetId);
  },

  togglePinNote: async (id: string) => {
    const { notes, activeEditingNote } = get();
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const isPinned = !note.isPinned;
    const updatedNote: NoteItem = {
      ...note,
      isPinned,
      updatedAt: new Date().toISOString(),
    };

    const newNotes = notes.map((n) => (n.id === id ? updatedNote : n));
    set({
      notes: newNotes,
      activeEditingNote:
        activeEditingNote?.id === id
          ? { ...activeEditingNote, isPinned }
          : activeEditingNote,
    });
    await persistNote(updatedNote);
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

  moveNoteToTop: async (id: string) => {
    const { notes } = get();
    const currentIndex = notes.findIndex((n) => n.id === id);
    if (currentIndex <= 0) return;

    const reordered = [...notes];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.unshift(moved);

    const withOrder = reordered.map((item, idx) => ({ ...item, orderIndex: idx }));
    set({ notes: withOrder });
    await bulkPersistNotes(withOrder);
  },

  moveNoteToBottom: async (id: string) => {
    const { notes } = get();
    const currentIndex = notes.findIndex((n) => n.id === id);
    if (currentIndex === -1 || currentIndex === notes.length - 1) return;

    const reordered = [...notes];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.push(moved);

    const withOrder = reordered.map((item, idx) => ({ ...item, orderIndex: idx }));
    set({ notes: withOrder });
    await bulkPersistNotes(withOrder);
  },

  moveNoteUp: async (id: string) => {
    const { notes } = get();
    const currentIndex = notes.findIndex((n) => n.id === id);
    if (currentIndex <= 0) return;

    const reordered = [...notes];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(currentIndex - 1, 0, moved);

    const withOrder = reordered.map((item, idx) => ({ ...item, orderIndex: idx }));
    set({ notes: withOrder });
    await bulkPersistNotes(withOrder);
  },

  moveNoteDown: async (id: string) => {
    const { notes } = get();
    const currentIndex = notes.findIndex((n) => n.id === id);
    if (currentIndex === -1 || currentIndex >= notes.length - 1) return;

    const reordered = [...notes];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(currentIndex + 1, 0, moved);

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

  toggleViewMode: async () => {
    const current = get().preferences.viewMode || 'list';
    const next = current === 'list' ? 'tile' : 'list';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('minimal_note_view_mode', next);
    }
    await get().updatePreferences({ viewMode: next });
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

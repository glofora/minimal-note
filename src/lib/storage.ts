import Dexie, { type Table } from 'dexie';
import type { NoteItem, UserPreferences } from '@/types/note';

export class MinimalNoteDatabase extends Dexie {
  notes!: Table<NoteItem, string>;
  preferences!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('MinimalNoteDB');
    this.version(1).stores({
      notes: 'id, orderIndex, color, hasReminder, reminderAt, createdAt, updatedAt',
      preferences: 'key',
    });
  }
}

export const db = new MinimalNoteDatabase();

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  is24HourFormat: false,
  defaultColor: 'indigo',
  enableSound: true,
};

/**
 * Clean storage abstraction layer for offline operations
 */
export async function loadStoredNotes(): Promise<NoteItem[]> {
  try {
    const items = await db.notes.orderBy('orderIndex').toArray();
    return items;
  } catch (err) {
    console.error('Failed to load notes from Dexie IndexedDB:', err);
    return [];
  }
}

export async function persistNote(note: NoteItem): Promise<void> {
  await db.notes.put(note);
}

export async function removeNote(id: string): Promise<void> {
  await db.notes.delete(id);
}

export async function bulkPersistNotes(notes: NoteItem[]): Promise<void> {
  await db.transaction('rw', db.notes, async () => {
    await db.notes.clear();
    await db.notes.bulkPut(notes);
  });
}

export async function loadUserPreferences(): Promise<UserPreferences> {
  try {
    const stored = await db.preferences.get('user_preferences');
    if (stored && typeof stored.value === 'object') {
      return { ...DEFAULT_PREFERENCES, ...(stored.value as Partial<UserPreferences>) };
    }
  } catch (err) {
    console.warn('Preferences load error, using defaults:', err);
  }
  return DEFAULT_PREFERENCES;
}

export async function saveUserPreferences(prefs: UserPreferences): Promise<void> {
  try {
    await db.preferences.put({ key: 'user_preferences', value: prefs });
  } catch (err) {
    console.error('Failed saving user preferences:', err);
  }
}

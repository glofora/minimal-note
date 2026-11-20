/**
 * Clean-Room Data Models & Types for Minimal Note
 * All models, interfaces and identifiers are original clean-room implementations.
 */

export type NoteColor =
  | 'indigo'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'purple'
  | 'teal'
  | 'orange'
  | 'slate';

export interface NoteColorConfig {
  id: NoteColor;
  label: string;
  dotClass: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  textLight: string;
  textDark: string;
  badgeClass: string;
}

export const NOTE_COLORS: Record<NoteColor, NoteColorConfig> = {
  indigo: {
    id: 'indigo',
    label: 'Indigo',
    dotClass: 'bg-indigo-500',
    bgLight: 'bg-indigo-50/70',
    bgDark: 'dark:bg-indigo-950/20',
    borderLight: 'border-indigo-200',
    borderDark: 'dark:border-indigo-800/40',
    textLight: 'text-indigo-700',
    textDark: 'dark:text-indigo-300',
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  },
  blue: {
    id: 'blue',
    label: 'Blue',
    dotClass: 'bg-blue-500',
    bgLight: 'bg-blue-50/70',
    bgDark: 'dark:bg-blue-950/20',
    borderLight: 'border-blue-200',
    borderDark: 'dark:border-blue-800/40',
    textLight: 'text-blue-700',
    textDark: 'dark:text-blue-300',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  },
  emerald: {
    id: 'emerald',
    label: 'Emerald',
    dotClass: 'bg-emerald-500',
    bgLight: 'bg-emerald-50/70',
    bgDark: 'dark:bg-emerald-950/20',
    borderLight: 'border-emerald-200',
    borderDark: 'dark:border-emerald-800/40',
    textLight: 'text-emerald-700',
    textDark: 'dark:text-emerald-300',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  amber: {
    id: 'amber',
    label: 'Amber',
    dotClass: 'bg-amber-500',
    bgLight: 'bg-amber-50/70',
    bgDark: 'dark:bg-amber-950/20',
    borderLight: 'border-amber-200',
    borderDark: 'dark:border-amber-800/40',
    textLight: 'text-amber-800',
    textDark: 'dark:text-amber-300',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  },
  rose: {
    id: 'rose',
    label: 'Rose',
    dotClass: 'bg-rose-500',
    bgLight: 'bg-rose-50/70',
    bgDark: 'dark:bg-rose-950/20',
    borderLight: 'border-rose-200',
    borderDark: 'dark:border-rose-800/40',
    textLight: 'text-rose-700',
    textDark: 'dark:text-rose-300',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  },
  purple: {
    id: 'purple',
    label: 'Purple',
    dotClass: 'bg-purple-500',
    bgLight: 'bg-purple-50/70',
    bgDark: 'dark:bg-purple-950/20',
    borderLight: 'border-purple-200',
    borderDark: 'dark:border-purple-800/40',
    textLight: 'text-purple-700',
    textDark: 'dark:text-purple-300',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  },
  teal: {
    id: 'teal',
    label: 'Teal',
    dotClass: 'bg-teal-500',
    bgLight: 'bg-teal-50/70',
    bgDark: 'dark:bg-teal-950/20',
    borderLight: 'border-teal-200',
    borderDark: 'dark:border-teal-800/40',
    textLight: 'text-teal-700',
    textDark: 'dark:text-teal-300',
    badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  },
  orange: {
    id: 'orange',
    label: 'Orange',
    dotClass: 'bg-orange-500',
    bgLight: 'bg-orange-50/70',
    bgDark: 'dark:bg-orange-950/20',
    borderLight: 'border-orange-200',
    borderDark: 'dark:border-orange-800/40',
    textLight: 'text-orange-800',
    textDark: 'dark:text-orange-300',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  },
  slate: {
    id: 'slate',
    label: 'Slate',
    dotClass: 'bg-slate-500',
    bgLight: 'bg-slate-50/70',
    bgDark: 'dark:bg-slate-900/20',
    borderLight: 'border-slate-200',
    borderDark: 'dark:border-slate-800/40',
    textLight: 'text-slate-700',
    textDark: 'dark:text-slate-300',
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  },
};

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export type NoteType = 'text' | 'checklist';

export interface NoteItem {
  id: string; // Unique identifier (UUID v4)
  title: string;
  description: string;
  color: NoteColor;
  noteType: NoteType;
  checklist: ChecklistItem[];
  images: string[]; // Multiple compressed Base64 images
  imageDataUrl?: string | null; // Backward compatibility
  links: string[]; // Extracted or attached web URLs
  hasReminder: boolean;
  reminderAt: string | null; // ISO 8601 string
  isPinned?: boolean;
  isCompleted?: boolean;
  orderIndex: number;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
}

export type SnoozeDuration = 10 | 30 | 60; // minutes

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserPreferences {
  theme: ThemeMode;
  is24HourFormat: boolean;
  defaultColor: NoteColor;
  enableSound: boolean;
}

export interface BackupExportFile {
  app: 'minimal-note';
  version: 1;
  exportedAt: string;
  notesCount: number;
  notes: NoteItem[];
  preferences: UserPreferences;
}

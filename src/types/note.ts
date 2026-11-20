/**
 * Clean-Room Data Models & Types for Minimal Note
 * All models, interfaces and identifiers are original clean-room implementations.
 */

export type NoteColor =
  | 'default'
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
  default: {
    id: 'default',
    label: 'No Tag',
    dotClass: 'bg-zinc-400 dark:bg-zinc-500 border border-zinc-500/40',
    bgLight: 'bg-card hover:bg-card/90',
    bgDark: 'dark:bg-card dark:hover:bg-card/90',
    borderLight: 'border-border/80',
    borderDark: 'dark:border-border/80',
    textLight: 'text-foreground',
    textDark: 'dark:text-foreground',
    badgeClass: 'bg-muted text-muted-foreground',
  },
  indigo: {
    id: 'indigo',
    label: 'Indigo',
    dotClass: 'bg-indigo-500',
    bgLight: 'bg-indigo-50/85 hover:bg-indigo-100/70',
    bgDark: 'dark:bg-indigo-950/45 dark:hover:bg-indigo-950/60',
    borderLight: 'border-indigo-200/90',
    borderDark: 'dark:border-indigo-700/60',
    textLight: 'text-indigo-700',
    textDark: 'dark:text-indigo-300',
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  },
  blue: {
    id: 'blue',
    label: 'Blue',
    dotClass: 'bg-blue-500',
    bgLight: 'bg-blue-50/85 hover:bg-blue-100/70',
    bgDark: 'dark:bg-blue-950/45 dark:hover:bg-blue-950/60',
    borderLight: 'border-blue-200/90',
    borderDark: 'dark:border-blue-700/60',
    textLight: 'text-blue-700',
    textDark: 'dark:text-blue-300',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  },
  emerald: {
    id: 'emerald',
    label: 'Emerald',
    dotClass: 'bg-emerald-500',
    bgLight: 'bg-emerald-50/85 hover:bg-emerald-100/70',
    bgDark: 'dark:bg-emerald-950/45 dark:hover:bg-emerald-950/60',
    borderLight: 'border-emerald-200/90',
    borderDark: 'dark:border-emerald-700/60',
    textLight: 'text-emerald-700',
    textDark: 'dark:text-emerald-300',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  amber: {
    id: 'amber',
    label: 'Amber',
    dotClass: 'bg-amber-500',
    bgLight: 'bg-amber-50/85 hover:bg-amber-100/70',
    bgDark: 'dark:bg-amber-950/45 dark:hover:bg-amber-950/60',
    borderLight: 'border-amber-200/90',
    borderDark: 'dark:border-amber-700/60',
    textLight: 'text-amber-800',
    textDark: 'dark:text-amber-300',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  },
  rose: {
    id: 'rose',
    label: 'Rose',
    dotClass: 'bg-rose-500',
    bgLight: 'bg-rose-50/85 hover:bg-rose-100/70',
    bgDark: 'dark:bg-rose-950/45 dark:hover:bg-rose-950/60',
    borderLight: 'border-rose-200/90',
    borderDark: 'dark:border-rose-700/60',
    textLight: 'text-rose-700',
    textDark: 'dark:text-rose-300',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  },
  purple: {
    id: 'purple',
    label: 'Purple',
    dotClass: 'bg-purple-500',
    bgLight: 'bg-purple-50/85 hover:bg-purple-100/70',
    bgDark: 'dark:bg-purple-950/45 dark:hover:bg-purple-950/60',
    borderLight: 'border-purple-200/90',
    borderDark: 'dark:border-purple-700/60',
    textLight: 'text-purple-700',
    textDark: 'dark:text-purple-300',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  },
  teal: {
    id: 'teal',
    label: 'Teal',
    dotClass: 'bg-teal-500',
    bgLight: 'bg-teal-50/85 hover:bg-teal-100/70',
    bgDark: 'dark:bg-teal-950/45 dark:hover:bg-teal-950/60',
    borderLight: 'border-teal-200/90',
    borderDark: 'dark:border-teal-700/60',
    textLight: 'text-teal-700',
    textDark: 'dark:text-teal-300',
    badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  },
  orange: {
    id: 'orange',
    label: 'Orange',
    dotClass: 'bg-orange-500',
    bgLight: 'bg-orange-50/85 hover:bg-orange-100/70',
    bgDark: 'dark:bg-orange-950/45 dark:hover:bg-orange-950/60',
    borderLight: 'border-orange-200/90',
    borderDark: 'dark:border-orange-700/60',
    textLight: 'text-orange-800',
    textDark: 'dark:text-orange-300',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  },
  slate: {
    id: 'slate',
    label: 'Slate',
    dotClass: 'bg-slate-500',
    bgLight: 'bg-slate-100/90 hover:bg-slate-200/70',
    bgDark: 'dark:bg-slate-900/70 dark:hover:bg-slate-900/90',
    borderLight: 'border-slate-300/90',
    borderDark: 'dark:border-slate-700/60',
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

import type { SupportedLanguage } from '@/lib/i18n';

export type SnoozeDuration = 10 | 30 | 60; // minutes

export type ThemeMode = 'light' | 'dark' | 'system';
export type ViewMode = 'list' | 'tile';
export type { SupportedLanguage };

export interface UserPreferences {
  theme: ThemeMode;
  is24HourFormat: boolean;
  defaultColor: NoteColor;
  enableSound: boolean;
  language?: SupportedLanguage;
  viewMode?: ViewMode;
}

export interface BackupExportFile {
  app: 'minimal-note';
  version: 1;
  exportedAt: string;
  notesCount: number;
  notes: NoteItem[];
  preferences: UserPreferences;
}

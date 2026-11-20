import React from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import { usePwaStore } from '@/lib/pwa';
import { NOTE_COLORS, type NoteColor } from '@/types/note';
import {
  Search,
  Moon,
  Sun,
  Settings,
  Download,
  Info,
  X,
  Plus,
  CheckSquare,
  Smartphone,
} from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  onOpenAbout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onOpenBackup,
  onOpenAbout,
}) => {
  const {
    searchQuery,
    setSearchQuery,
    filterColor,
    setFilterColor,
    preferences,
    updatePreferences,
    openCreateModal,
  } = useNotesStore();

  const { isInstallable, triggerInstall } = usePwaStore();

  const toggleTheme = () => {
    const nextTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    updatePreferences({ theme: nextTheme });
  };

  const colorsList: NoteColor[] = [
    'indigo',
    'blue',
    'emerald',
    'amber',
    'rose',
    'purple',
    'teal',
    'orange',
    'slate',
  ];

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-background/85 border-b border-border transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/30">
              <span className="font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground leading-none">
                Minimal Note
              </h1>
              <span className="text-xs text-muted-foreground font-medium">Clean & Focused</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Install PWA Button (appears when browser supports install) */}
            {isInstallable && (
              <button
                onClick={triggerInstall}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors"
                title="Install Minimal Note to Device"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install App</span>
              </button>
            )}

            {/* Quick New Checklist (Google Keep style) */}
            <button
              onClick={() => openCreateModal(undefined, 'checklist')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/80 hover:bg-muted text-foreground text-xs font-semibold transition-colors"
              title="New Checklist"
            >
              <CheckSquare className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">New List</span>
            </button>

            {/* Quick New Note */}
            <button
              onClick={() => openCreateModal(undefined, 'text')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow hover:opacity-95 transition-opacity"
              title="New Note"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Note</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title={preferences.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {preferences.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={onOpenBackup}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Backup & Restore"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenAbout}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="About"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search notes, checklists, links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-muted/60 hover:bg-muted/90 focus:bg-background border border-transparent focus:border-border rounded-xl text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Color Filter Tabs */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setFilterColor('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filterColor === 'all'
                ? 'bg-foreground text-background shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            All Notes
          </button>
          {colorsList.map((colorKey) => {
            const config = NOTE_COLORS[colorKey];
            const isSelected = filterColor === colorKey;
            return (
              <button
                key={colorKey}
                onClick={() => setFilterColor(isSelected ? 'all' : colorKey)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'ring-2 ring-primary ring-offset-1 ring-offset-background bg-muted text-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import { usePwaStore } from '@/lib/pwa';
import { NOTE_COLORS, type NoteColor } from '@/types/note';
import { getTranslation, SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { SideNav } from './SideNav';
import { GithubStarButton } from './GithubStarButton';
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
  Menu,
  Globe,
} from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  onOpenAbout: () => void;
  onOpenLanguage: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onOpenBackup,
  onOpenAbout,
  onOpenLanguage,
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
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const currentLang = preferences.language || 'en';
  const t = getTranslation(currentLang);

  const activeLangInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

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
    <>
      <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-background/90 border-b border-border transition-colors">
        <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Left: Hamburger (Mobile) + Logo & Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Hamburger Button (Mobile Only) */}
              <button
                onClick={() => setIsSideNavOpen(true)}
                className="p-1.5 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 sm:hidden transition-colors"
                aria-label="Open navigation menu"
                title="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Logo Badge */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/30 shrink-0">
                <span className="font-bold text-base sm:text-lg">M</span>
              </div>

              {/* App Title & Tagline */}
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground leading-none truncate">
                  {t.appName}
                </h1>
                <span className="hidden sm:inline-block text-xs text-muted-foreground font-medium mt-0.5">
                  {t.tagline}
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Language Selector Modal Trigger (Web Top Header) */}
              <button
                onClick={onOpenLanguage}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/50 hover:bg-muted text-foreground text-xs font-semibold transition-colors border border-border/60 hover:border-border"
                title={t.selectLanguage}
                aria-label={t.selectLanguage}
              >
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs">{activeLangInfo.flag}</span>
                <span className="font-mono text-[11px] uppercase">{activeLangInfo.code}</span>
              </button>

              {/* GitHub Star Link with Live Count */}
              <GithubStarButton variant="navbar" />

              {/* Desktop Only: PWA Install Button */}
              {isInstallable && (
                <button
                  onClick={triggerInstall}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors"
                  title={t.installApp}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{t.installApp}</span>
                </button>
              )}

              {/* Quick New Checklist */}
              <button
                onClick={() => openCreateModal(undefined, 'checklist')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/80 hover:bg-muted text-foreground text-xs font-semibold transition-colors"
                title={t.newList}
              >
                <CheckSquare className="w-4 h-4 text-primary" />
                <span className="hidden md:inline">{t.newList}</span>
              </button>

              {/* Quick New Note */}
              <button
                onClick={() => openCreateModal(undefined, 'text')}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow hover:opacity-95 transition-opacity"
                title={t.newNote}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden xs:inline">{t.noteShort}</span>
              </button>

              {/* Desktop Only Utility Icons */}
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  title={preferences.theme === 'dark' ? t.lightMode : t.darkMode}
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
                  title={t.backupRestore}
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={onOpenSettings}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  title={t.preferencesTitle}
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={onOpenAbout}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  title={t.aboutTitle}
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-2.5 sm:mt-3 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder={t.searchPlaceholder}
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
          <div className="mt-2 sm:mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setFilterColor('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filterColor === 'all'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {t.allNotes}
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

      {/* Mobile Side Navigation Drawer */}
      <SideNav
        isOpen={isSideNavOpen}
        onClose={() => setIsSideNavOpen(false)}
        onOpenSettings={onOpenSettings}
        onOpenBackup={onOpenBackup}
        onOpenAbout={onOpenAbout}
        onOpenLanguage={onOpenLanguage}
      />
    </>
  );
};

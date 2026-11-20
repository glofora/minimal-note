import React from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import { usePwaStore } from '@/lib/pwa';
import { getTranslation, SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { GithubStarButton } from './GithubStarButton';
import {
  X,
  Moon,
  Sun,
  Settings,
  Download,
  Info,
  CheckSquare,
  StickyNote,
  Smartphone,
  ExternalLink,
  Heart,
  ShieldCheck,
  Globe,
  ChevronRight,
} from 'lucide-react';

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  onOpenAbout: () => void;
  onOpenLanguage: () => void;
}

export const SideNav: React.FC<SideNavProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenBackup,
  onOpenAbout,
  onOpenLanguage,
}) => {
  const { preferences, updatePreferences, openCreateModal } = useNotesStore();
  const { isInstallable, triggerInstall } = usePwaStore();
  const currentLang = preferences.language || 'en';
  const t = getTranslation(currentLang);

  const activeLangInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  if (!isOpen) return null;

  const toggleTheme = () => {
    const nextTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    updatePreferences({ theme: nextTheme });
  };

  const handleCreate = (type: 'text' | 'checklist') => {
    onClose();
    openCreateModal(undefined, type);
  };

  return (
    <div className="fixed inset-0 z-50 flex sm:hidden animate-in fade-in duration-200">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <aside
        className="relative w-76 max-w-[85vw] h-full bg-card border-r border-border shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-250 ease-out"
        role="dialog"
        aria-label="Navigation Menu"
      >
        {/* Top Header */}
        <div className="p-4 border-b border-border/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="/icon.svg"
                alt="Minimal Note"
                className="w-9 h-9 rounded-xl shadow-xs"
              />
              <div>
                <h2 className="text-base font-bold tracking-tight text-foreground leading-tight">
                  {t.appName}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {t.tagline}
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    {t.offlineReady}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={t.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* GitHub Star Banner with Live Count */}
          <GithubStarButton variant="drawer" className="mt-3.5" />
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {/* Quick Create Section */}
          <div className="space-y-1">
            <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {t.createNew}
            </span>
            <button
              onClick={() => handleCreate('text')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <StickyNote className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="block leading-tight font-semibold">{t.textNote}</span>
                <span className="text-[11px] text-muted-foreground">{t.freeformDesc}</span>
              </div>
            </button>
            <button
              onClick={() => handleCreate('checklist')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="block leading-tight font-semibold">{t.checklist}</span>
                <span className="text-[11px] text-muted-foreground">{t.checklistDesc}</span>
              </div>
            </button>
          </div>

          {/* Install PWA Banner (if available) */}
          {isInstallable && (
            <div className="space-y-1">
              <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                PWA Application
              </span>
              <button
                onClick={() => {
                  onClose();
                  triggerInstall();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-left transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="block text-xs font-bold leading-tight">{t.installApp}</span>
                  <span className="text-[10px] opacity-80">{t.installAppDesc}</span>
                </div>
              </button>
            </div>
          )}

          {/* Preferences & Tools */}
          <div className="space-y-1">
            <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {t.settingsAndTools}
            </span>

            {/* Language Selector Modal Trigger (Clean Single Button) */}
            <button
              onClick={() => {
                onClose();
                onOpenLanguage();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-semibold leading-tight">{t.language}</span>
                  <span className="text-[11px] text-muted-foreground truncate block">
                    {activeLangInfo.nativeName} ({activeLangInfo.name})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <span className="text-xs px-1.5 py-0.5 rounded-md bg-muted border border-border/60 font-mono text-[10px]">
                  {activeLangInfo.flag} {activeLangInfo.code.toUpperCase()}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Dark / Light Mode Switch */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-foreground">
                  {preferences.theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-500" />
                  )}
                </div>
                <span className="font-semibold text-xs">
                  {preferences.theme === 'dark' ? t.lightMode : t.darkMode}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground uppercase font-mono px-2 py-0.5 rounded-md bg-muted">
                {preferences.theme}
              </span>
            </button>

            {/* Backup & Restore */}
            <button
              onClick={() => {
                onClose();
                onOpenBackup();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-foreground">
                <Download className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="block text-xs font-semibold leading-tight">{t.backupRestore}</span>
                <span className="text-[11px] text-muted-foreground">{t.backupDesc}</span>
              </div>
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-foreground">
                <Settings className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="block text-xs font-semibold leading-tight">{t.preferencesTitle}</span>
                <span className="text-[11px] text-muted-foreground">{t.preferencesDesc}</span>
              </div>
            </button>

            {/* About Modal */}
            <button
              onClick={() => {
                onClose();
                onOpenAbout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-foreground">
                <Info className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="block text-xs font-semibold leading-tight">{t.aboutTitle}</span>
                <span className="text-[11px] text-muted-foreground">{t.aboutDesc}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-border/80 bg-muted/20">
          <a
            href="https://github.com/glofora/minimal-note"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span>Minimal Note by</span>
              <span className="font-semibold text-foreground underline decoration-dotted">
                Glofora
              </span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
          <div className="mt-1 text-[10px] text-muted-foreground/60 flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
            <span>for privacy &amp; simplicity</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

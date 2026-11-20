import React from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import { NOTE_COLORS, type NoteColor, type ThemeMode } from '@/types/note';
import { getTranslation, SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { X, Moon, Sun, Monitor, Clock, Palette, Globe, ChevronRight } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLanguage?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenLanguage,
}) => {
  const { preferences, updatePreferences } = useNotesStore();
  const currentLang = preferences.language || 'en';
  const t = getTranslation(currentLang);

  const activeLangInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{t.preferencesTitle}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={t.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language Selection Row */}
        {onOpenLanguage && (
          <div className="flex items-center justify-between py-2 border-b border-border/70">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-primary" />
                {t.language}
              </span>
              <span className="text-xs text-muted-foreground block">
                {activeLangInfo.nativeName} ({activeLangInfo.name})
              </span>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenLanguage();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold border border-border transition-colors group"
            >
              <span className="text-sm">{activeLangInfo.flag}</span>
              <span className="uppercase font-mono text-[11px]">{activeLangInfo.code}</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* Theme Settings */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Moon className="w-3.5 h-3.5" />
            {t.appearance}
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'light', label: t.lightMode, icon: Sun },
                { id: 'dark', label: t.darkMode, icon: Moon },
                { id: 'system', label: t.systemMode, icon: Monitor },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              const isSelected = preferences.theme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => updatePreferences({ theme: opt.id as ThemeMode })}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium gap-1.5 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20'
                      : 'border-border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clock Format */}
        <div className="flex items-center justify-between py-2 border-t border-border/70">
          <div className="space-y-0.5">
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              {t.timeFormat24}
            </span>
            <span className="text-xs text-muted-foreground block">
              {t.timeFormat24Desc}
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.is24HourFormat}
              onChange={(e) => updatePreferences({ is24HourFormat: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>

        {/* Default Color */}
        <div className="space-y-2.5 pt-2 border-t border-border/70">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            Default Note Color
          </span>
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {(Object.keys(NOTE_COLORS) as NoteColor[]).map((cKey) => {
              const conf = NOTE_COLORS[cKey];
              const isSelected = preferences.defaultColor === cKey;
              return (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => updatePreferences({ defaultColor: cKey })}
                  className={`relative w-7 h-7 rounded-full ${conf.dotClass} transition-transform hover:scale-110 shrink-0 ${
                    isSelected ? 'ring-3 ring-foreground/40 scale-105' : 'opacity-85'
                  }`}
                  title={conf.label}
                />
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

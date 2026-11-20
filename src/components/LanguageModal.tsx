import React, { useState, useMemo } from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import {
  SUPPORTED_LANGUAGES,
  getTranslation,
  type SupportedLanguage,
} from '@/lib/i18n';
import { Globe, X, Search, Check } from 'lucide-react';
import { FlagIcon } from './FlagIcon';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose }) => {
  const { preferences, updatePreferences } = useNotesStore();
  const currentLang = preferences.language || 'en';
  const t = getTranslation(currentLang);
  const [search, setSearch] = useState('');

  const filteredLanguages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SUPPORTED_LANGUAGES;
    return SUPPORTED_LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [search]);

  if (!isOpen) return null;

  const handleSelect = (code: SupportedLanguage) => {
    updatePreferences({ language: code });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">
                {t.selectLanguage}
              </h2>
              <span className="text-[11px] text-muted-foreground">
                16 Global Languages Available
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={t.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3.5 border-b border-border/70 bg-muted/20">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchLanguagePlaceholder}
              autoFocus
              className="w-full pl-9 pr-8 py-2 bg-background border border-border rounded-xl text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Languages Grid */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4">
          {filteredLanguages.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground">
              {t.noLanguagesFound}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredLanguages.map((lang) => {
                const isSelected = currentLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang.code)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20 shadow-xs'
                        : 'border-border bg-muted/30 hover:bg-muted/80 text-foreground hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-6 rounded-md overflow-hidden shrink-0 shadow-xs border border-border/70 flex items-center justify-center bg-muted/40">
                        <FlagIcon code={lang.code} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold leading-tight truncate">
                          {lang.nativeName}
                        </span>
                        <span className="block text-[10px] text-muted-foreground truncate">
                          {lang.name}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 ml-2 shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import { NOTE_COLORS, type NoteColor } from '@/types/note';
import { getTranslation, getColorName } from '@/lib/i18n';
import { SideNav } from './SideNav';
import {
  Search,
  X,
  Plus,
  CheckSquare,
  Menu,
  LayoutGrid,
  List,
  Filter,
  Check,
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
    toggleViewMode,
    openCreateModal,
  } = useNotesStore();

  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const currentLang = preferences.language || 'en';
  const t = getTranslation(currentLang);

  const colorsList: NoteColor[] = [
    'default',
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

  const activeColorConfig = filterColor !== 'all' ? NOTE_COLORS[filterColor] : null;

  return (
    <>
      <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-background/95 border-b border-border transition-colors">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3">
          {/* ============================================================ */}
          {/* DESKTOP HEADER ROW: Clean, single-row layout without clutter */}
          {/* ============================================================ */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            {/* Left: Hamburger Menu (☰) + Logo & App Title */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsSideNavOpen(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
                aria-label="Open navigation menu"
                title="Open menu (Settings, Language, Backup, Theme, etc.)"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => setIsSideNavOpen(true)}>
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20 shrink-0">
                  <span className="font-bold text-base">M</span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-bold tracking-tight text-foreground leading-tight">
                    {t.appName}
                  </h1>
                </div>
              </div>
            </div>

            {/* Center: Integrated Search Bar + Active Filter Chip */}
            <div className="flex-1 max-w-md mx-2">
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 bg-muted/60 hover:bg-muted/80 focus:bg-background border border-transparent focus:border-border rounded-xl text-xs placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Filter Button + View Mode Toggle + Primary CTAs */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Active Color Filter Chip (Click to clear) */}
              {activeColorConfig && (
                <button
                  type="button"
                  onClick={() => setFilterColor('all')}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-muted text-foreground text-xs font-semibold border border-primary/30 hover:bg-muted/80 transition-all cursor-pointer shadow-2xs"
                  title="Click to clear filter"
                >
                  <span className={`w-2 h-2 rounded-full ${activeColorConfig.dotClass}`} />
                  <span>{getColorName(activeColorConfig.id, currentLang)}</span>
                  <X className="w-3 h-3 text-muted-foreground hover:text-foreground ml-0.5" />
                </button>
              )}

              {/* Color Tag Filter Button */}
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                className={`relative h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                  filterColor !== 'all'
                    ? 'bg-primary/10 text-primary border-primary/40 font-bold'
                    : 'bg-muted/60 hover:bg-muted text-foreground border-border/50'
                }`}
                title={t.filterByColor}
                aria-label={t.filterByColor}
              >
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t.filter}</span>
                {filterColor !== 'all' && (
                  <span className={`w-2 h-2 rounded-full ${activeColorConfig?.dotClass || 'bg-primary'}`} />
                )}
              </button>

              {/* View Mode Toggle Button: Tile vs List (Visible on tablet/desktop) */}
              <button
                type="button"
                onClick={toggleViewMode}
                className="hidden md:flex h-8 px-2.5 rounded-lg bg-muted/60 hover:bg-muted text-foreground items-center gap-1.5 text-xs font-semibold border border-border/50 transition-all cursor-pointer shadow-2xs active:scale-95"
                title={preferences.viewMode === 'tile' ? 'Switch to List view' : 'Switch to Tile view'}
                aria-label={preferences.viewMode === 'tile' ? 'Switch to List view' : 'Switch to Tile view'}
              >
                {preferences.viewMode === 'tile' ? (
                  <>
                    <List className="w-3.5 h-3.5 text-primary" />
                    <span className="hidden md:inline font-medium">List</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                    <span className="hidden md:inline font-medium">Tiles</span>
                  </>
                )}
              </button>

              {/* Primary CTA: New Checklist */}
              <button
                type="button"
                onClick={() => openCreateModal(undefined, 'checklist')}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-muted/80 hover:bg-muted active:scale-95 text-foreground text-xs font-semibold transition-all border border-border/60 cursor-pointer shadow-2xs"
                title={t.newList}
              >
                <CheckSquare className="w-3.5 h-3.5 text-primary" />
                <span className="hidden lg:inline">{t.newList}</span>
              </button>

              {/* Primary CTA: New Note */}
              <button
                type="button"
                onClick={() => openCreateModal(undefined, 'text')}
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                title={t.newNote}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t.noteShort}</span>
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* MOBILE HEADER: Clean 2-row layout without scrollbars        */}
          {/* ============================================================ */}
          <div className="flex sm:hidden flex-col space-y-2">
            {/* Mobile Row 1: Brand & CTAs */}
            <div className="flex items-center justify-between gap-2 min-h-[40px]">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setIsSideNavOpen(true)}
                  className="w-9 h-9 -ml-1 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted transition-colors cursor-pointer"
                  aria-label="Open navigation menu"
                  title="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20 shrink-0">
                  <span className="font-bold text-sm">M</span>
                </div>

                <h1 className="text-base font-bold tracking-tight text-foreground leading-tight truncate">
                  {t.appName}
                </h1>
              </div>

              {/* Mobile Right CTAs */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => openCreateModal(undefined, 'checklist')}
                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-muted text-foreground text-xs font-semibold border border-border/60 transition-all active:scale-95 cursor-pointer"
                  title={t.newList}
                >
                  <CheckSquare className="w-3.5 h-3.5 text-primary" />
                  <span>List</span>
                </button>

                <button
                  type="button"
                  onClick={() => openCreateModal(undefined, 'text')}
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm shadow-primary/25 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                  title={t.newNote}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Note</span>
                </button>
              </div>
            </div>

            {/* Mobile Row 2: Search Input + Filter Button (Matching Web Design, No View Toggle) */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 bg-muted/60 hover:bg-muted/80 focus:bg-background border border-transparent focus:border-border rounded-xl text-xs placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Mobile Color Filter Button (Pill-shaped matching web style) */}
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                className={`relative h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold border shrink-0 transition-all cursor-pointer shadow-2xs ${
                  filterColor !== 'all'
                    ? 'bg-primary/10 text-primary border-primary/40 font-bold'
                    : 'bg-muted/60 hover:bg-muted text-foreground border-border/50'
                }`}
                title={t.filterByColor}
                aria-label={t.filterByColor}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{t.filter}</span>
                {filterColor !== 'all' && (
                  <span className={`w-2 h-2 rounded-full ${activeColorConfig?.dotClass || 'bg-primary'}`} />
                )}
              </button>
            </div>

            {/* Mobile Active Filter Bar (shown only when a filter is applied) */}
            {activeColorConfig && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-muted-foreground">{t.filteredBy}</span>
                <button
                  type="button"
                  onClick={() => setFilterColor('all')}
                  className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md bg-muted text-foreground text-[11px] font-semibold border border-primary/30 cursor-pointer"
                  title="Clear color filter"
                >
                  <span className={`w-2 h-2 rounded-full ${activeColorConfig.dotClass}`} />
                  <span>{getColorName(activeColorConfig.id, currentLang)}</span>
                  <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* COLOR TAG FILTER MODAL DIALOG (Consistent Desktop & Mobile)   */}
      {/* ============================================================ */}
      {isFilterModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 select-none"
          onClick={() => setIsFilterModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm p-5 sm:p-6 bg-card border border-border rounded-3xl shadow-2xl animate-in zoom-in-95 duration-150 space-y-4"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{t.filterByColor}</h3>
                  <p className="text-xs text-muted-foreground">{t.selectColorTag}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Options */}
            <div className="space-y-2 pt-1">
              {/* All Notes Option */}
              <button
                type="button"
                onClick={() => {
                  setFilterColor('all');
                  setIsFilterModalOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer text-left ${
                  filterColor === 'all'
                    ? 'border-primary ring-2 ring-primary/20 bg-muted/80 font-bold'
                    : 'border-border/70 hover:bg-muted/40 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full border border-foreground/30 bg-foreground/20" />
                  <span className="text-xs text-foreground">{t.allNotes}</span>
                </div>
                {filterColor === 'all' && <Check className="w-4 h-4 text-primary" />}
              </button>

              {/* 9 Color Swatches */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {colorsList.map((cKey) => {
                  const conf = NOTE_COLORS[cKey];
                  const isSelected = filterColor === cKey;
                  return (
                    <button
                      key={cKey}
                      type="button"
                      onClick={() => {
                        setFilterColor(cKey);
                        setIsFilterModalOpen(false);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-muted/80 font-bold'
                          : 'border-border/70 hover:bg-muted/40'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${conf.dotClass} flex items-center justify-center shrink-0 shadow-xs`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                      </span>
                      <span className="text-xs text-foreground truncate">{getColorName(cKey, currentLang)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              {filterColor !== 'all' ? (
                <button
                  type="button"
                  onClick={() => {
                    setFilterColor('all');
                    setIsFilterModalOpen(false);
                  }}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  {t.clearFilter}
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 cursor-pointer"
              >
                {t.done}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SIDE NAVIGATION DRAWER (Consistent Desktop & Mobile)         */}
      {/* ============================================================ */}
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

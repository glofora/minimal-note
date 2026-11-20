import React from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import { NOTE_COLORS, type NoteColor } from '@/types/note';
import { getTranslation, getColorName } from '@/lib/i18n';
import { Palette, Check, X } from 'lucide-react';

export const NoteColorModal: React.FC = () => {
  const {
    noteForColorModal,
    closeNoteColorModal,
    updateNoteColor,
    preferences,
  } = useNotesStore();

  const t = getTranslation(preferences.language);

  if (!noteForColorModal) return null;

  const currentColor = noteForColorModal.color || 'indigo';

  const handleSelectColor = (color: NoteColor) => {
    updateNoteColor(noteForColorModal.id, color);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="color-modal-title"
      className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={closeNoteColorModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm p-5 sm:p-6 bg-card border border-border rounded-3xl shadow-2xl animate-in zoom-in-95 duration-150 space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 id="color-modal-title" className="text-base font-bold text-foreground">
                {t.colorAndTag}
              </h3>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {noteForColorModal.title || 'Untitled Note'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeNoteColorModal}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 9 Color Swatches */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            {t.selectColorTag}
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(NOTE_COLORS) as NoteColor[]).map((cKey) => {
              const conf = NOTE_COLORS[cKey];
              const isSelected = currentColor === cKey;
              return (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => handleSelectColor(cKey)}
                  className={`flex items-center gap-2.5 p-2 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 bg-muted/70 font-semibold'
                      : 'border-border/70 hover:bg-muted/40'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full ${conf.dotClass} flex items-center justify-center shrink-0 shadow-xs`}>
                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </span>
                  <span className="text-xs text-foreground truncate">
                    {getColorName(cKey, preferences.language)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Done Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={closeNoteColorModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 cursor-pointer"
          >
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import { getTranslation } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, X, Trash2 } from 'lucide-react';

export const UndoToast: React.FC = () => {
  const { undoCache, undoDeleteNote, clearUndoCache, preferences } = useNotesStore();
  const t = getTranslation(preferences.language);

  React.useEffect(() => {
    if (!undoCache) return;
    const timer = setTimeout(() => {
      clearUndoCache();
    }, 6000);
    return () => clearTimeout(timer);
  }, [undoCache, clearUndoCache]);

  return (
    <AnimatePresence>
      {undoCache && (
        <div className="fixed bottom-24 md:bottom-8 inset-x-0 z-[999] flex justify-center pointer-events-none px-4">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="w-full max-w-md pointer-events-auto"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-zinc-900/95 dark:bg-zinc-100/95 text-zinc-100 dark:text-zinc-900 backdrop-blur-md rounded-2xl shadow-xl border border-zinc-700/60 dark:border-zinc-300/80">
              {/* Left: Message & Trash Icon */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold truncate">
                  {undoCache.note.title
                    ? `Deleted "${undoCache.note.title.slice(0, 24)}${
                        undoCache.note.title.length > 24 ? '...' : ''
                      }"`
                    : 'Note deleted'}
                </span>
              </div>

              {/* Right: UNDO Button & Dismiss */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    undoDeleteNote();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/30 cursor-pointer"
                  aria-label="Undo note deletion"
                >
                  <Undo2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{t.undo}</span>
                </button>

                <button
                  type="button"
                  onClick={clearUndoCache}
                  className="p-1.5 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-400 hover:text-zinc-100 dark:hover:text-zinc-900 transition-colors cursor-pointer"
                  aria-label="Dismiss toast"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

import React from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, X } from 'lucide-react';

export const UndoToast: React.FC = () => {
  const { undoCache, undoDeleteNote, clearUndoCache } = useNotesStore();

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
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-sm w-[90%] sm:w-auto"
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 rounded-2xl shadow-xl shadow-black/20 border border-zinc-800 dark:border-zinc-200">
            <span className="text-sm font-medium truncate">Note deleted</span>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={undoDeleteNote}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-xs"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>UNDO</span>
              </button>

              <button
                onClick={clearUndoCache}
                className="p-1 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-400 dark:text-zinc-500 hover:text-zinc-100 dark:hover:text-zinc-900 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

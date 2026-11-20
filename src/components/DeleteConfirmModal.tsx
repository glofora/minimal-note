import React, { useEffect } from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import { Trash2, AlertTriangle } from 'lucide-react';

export const DeleteConfirmModal: React.FC = () => {
  const { noteToDelete, cancelDeleteNote, confirmDeleteNote } = useNotesStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!noteToDelete) return;
      if (e.key === 'Escape') {
        cancelDeleteNote();
      } else if (e.key === 'Enter') {
        confirmDeleteNote();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [noteToDelete, cancelDeleteNote, confirmDeleteNote]);

  if (!noteToDelete) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={cancelDeleteNote}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm p-6 bg-card border border-border rounded-3xl shadow-2xl animate-in zoom-in-95 duration-150 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 id="delete-dialog-title" className="text-base font-bold text-foreground">
              Delete note?
            </h3>
            <p className="text-xs text-muted-foreground">
              This action can be undone immediately.
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {noteToDelete.title ? (
            <>
              Are you sure you want to delete <span className="font-semibold text-foreground">"{noteToDelete.title}"</span>?
            </>
          ) : (
            'Are you sure you want to delete this untitled note?'
          )}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={cancelDeleteNote}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDeleteNote}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-destructive text-destructive-foreground hover:opacity-95 active:scale-95 transition-all shadow-md shadow-destructive/25 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

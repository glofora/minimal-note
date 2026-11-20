import React from 'react';
import { X, Sparkles, Heart } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-center">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="w-16 h-16 rounded-3xl bg-primary text-primary-foreground mx-auto flex items-center justify-center shadow-lg shadow-primary/30">
          <Sparkles className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground">Minimal Note</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Version 1.0.0 (Clean-Room Edition)</p>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed px-4">
          A distraction-free, privacy-preserving note taking and task management application featuring client-side OCR text extraction, scheduled reminders, and offline IndexedDB persistence.
        </p>

        <div className="p-3 bg-muted/40 rounded-2xl border border-border/70 text-xs text-muted-foreground space-y-1">
          <div className="font-semibold text-foreground">Clean-Room Architecture</div>
          <div>Built from clean specifications with React 19, TypeScript, Tailwind CSS, Dexie.js, and Tesseract.js.</div>
        </div>

        <div className="text-[11px] text-muted-foreground/80 flex items-center justify-center gap-1">
          <span>Crafted with</span>
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          <span>for focused minds</span>
        </div>
      </div>
    </div>
  );
};

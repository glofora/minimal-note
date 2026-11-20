import React from 'react';
import { X, Sparkles, Heart } from 'lucide-react';
import { GithubStarButton } from './GithubStarButton';
import { useNotesStore } from '@/store/useNotesStore';
import { getTranslation } from '@/lib/i18n';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { preferences } = useNotesStore();
  const t = getTranslation(preferences.language);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-center">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close dialog"
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

        <p className="text-xs text-muted-foreground leading-relaxed px-2">
          {t.appDescription}
        </p>

        {/* GitHub Star Card */}
        <div className="p-3.5 bg-muted/40 rounded-2xl border border-border/70 text-left space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">{t.openSource}</span>
            <GithubStarButton variant="modal" />
          </div>
          <div className="text-[11px] text-muted-foreground">
            Feel free to report issues, contribute, or star <code className="font-mono text-foreground font-semibold">glofora/minimal-note</code>.
          </div>
        </div>

        <div className="p-3 bg-muted/40 rounded-2xl border border-border/70 text-xs text-muted-foreground space-y-1">
          <div className="font-semibold text-foreground">Clean-Room Architecture</div>
          <div>Built with React 19, TypeScript, Tailwind CSS, Dexie.js (IndexedDB), and Tesseract.js (OCR).</div>
        </div>

        <div className="text-[11px] text-muted-foreground/80 flex items-center justify-center gap-1 pt-1">
          <span>Crafted with</span>
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          <span>by Glofora for focused minds</span>
        </div>
      </div>
    </div>
  );
};

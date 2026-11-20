import React, { useState } from 'react';
import { usePwaStore } from '@/lib/pwa';
import { useNotesStore } from '@/store/useNotesStore';
import { getTranslation } from '@/lib/i18n';
import {
  Download,
  X,
  Smartphone,
  Zap,
  WifiOff,
  ShieldCheck,
  Share,
  PlusSquare,
  CheckCircle2,
} from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const { isPromptOpen, isInstallable, isInstalled, isIos, closePrompt, triggerInstall } =
    usePwaStore();
  const { preferences } = useNotesStore();
  const t = getTranslation(preferences.language);
  const [showIosGuide, setShowIosGuide] = useState(false);

  // Never show if already installed or prompt is closed
  if (!isPromptOpen || isInstalled) return null;

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (isInstallable) {
      const success = await triggerInstall();
      if (!success) {
        // If browser prompt failed or not triggered, show manual guidance
        closePrompt();
      }
    } else {
      setShowIosGuide(true);
    }
  };

  return (
    <aside
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-labelledby="pwa-install-title"
    >
      <div
        className="w-full sm:max-w-md bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-250 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with App Logo & Close Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/icon.svg"
                alt="Minimal Note"
                className="w-12 h-12 rounded-2xl shadow-md shadow-primary/20 shrink-0"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-card">
                <CheckCircle2 className="w-3 h-3 stroke-[3]" />
              </div>
            </div>

            <div>
              <h2
                id="pwa-install-title"
                className="text-base sm:text-lg font-bold text-foreground leading-tight"
              >
                {t.installApp} Minimal Note
              </h2>
              <span className="text-xs text-muted-foreground font-medium">
                PWA Application &bull; {t.offlineReady}
              </span>
            </div>
          </div>

          <button
            onClick={closePrompt}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits Badges */}
        <div className="grid grid-cols-3 gap-2 py-1">
          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-muted/40 border border-border/70 text-center gap-1">
            <WifiOff className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-bold text-foreground leading-tight">100% Offline</span>
            <span className="text-[9px] text-muted-foreground">Zero network needed</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-muted/40 border border-border/70 text-center gap-1">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-bold text-foreground leading-tight">Instant Launch</span>
            <span className="text-[9px] text-muted-foreground">From home screen</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-muted/40 border border-border/70 text-center gap-1">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-bold text-foreground leading-tight">Private & Local</span>
            <span className="text-[9px] text-muted-foreground">IndexedDB storage</span>
          </div>
        </div>

        {/* iOS Step-by-Step Instructions (if on iPhone/iPad) */}
        {showIosGuide && (
          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/25 space-y-2 animate-in fade-in duration-150">
            <div className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" />
              <span>How to install on iOS Safari:</span>
            </div>
            <ol className="text-xs text-foreground/90 space-y-1.5 list-decimal list-inside pl-1">
              <li className="flex items-center gap-2">
                <span>1. Tap the</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-card border border-border font-semibold text-[11px]">
                  <Share className="w-3 h-3 text-primary" /> Share
                </span>
                <span>button in Safari toolbar</span>
              </li>
              <li className="flex items-center gap-2">
                <span>2. Scroll down &amp; tap</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-card border border-border font-semibold text-[11px]">
                  <PlusSquare className="w-3 h-3 text-primary" /> Add to Home Screen
                </span>
              </li>
            </ol>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            onClick={closePrompt}
            className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            Not Now
          </button>

          <button
            onClick={handleInstallClick}
            className="flex-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold shadow-md shadow-primary/25 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Install App Now</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

import { create } from 'zustand';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function isIosSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua);
  const isWebKit = /WebKit/.test(ua);
  const isSafari = isWebKit && !/CriOS|FxiOS|OPiOS|mercury/i.test(ua);
  return isIos && isSafari;
}

interface PwaState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstallable: boolean;
  isInstalled: boolean;
  isPromptOpen: boolean;
  isIos: boolean;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  openPrompt: () => void;
  closePrompt: () => void;
  triggerInstall: () => Promise<boolean>;
}

const DISMISS_KEY = 'minimal_note_pwa_dismissed';
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 3; // 3 days cooldown after dismissing

export const usePwaStore = create<PwaState>((set, get) => ({
  deferredPrompt: null,
  isInstallable: false,
  isInstalled: typeof window !== 'undefined' ? isRunningStandalone() : false,
  isPromptOpen: false,
  isIos: typeof window !== 'undefined' ? isIosSafari() : false,

  setDeferredPrompt: (prompt) => {
    const isStandalone = isRunningStandalone();
    const isInstallable = !!prompt && !isStandalone;

    set({
      deferredPrompt: prompt,
      isInstallable,
    });

    // Auto-prompt after launch if not dismissed recently
    if (isInstallable) {
      try {
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (!dismissedAt || Date.now() - parseInt(dismissedAt, 10) > DISMISS_COOLDOWN_MS) {
          // Trigger after 1.5s so initial load renders smoothly first
          setTimeout(() => {
            if (!isRunningStandalone()) {
              set({ isPromptOpen: true });
            }
          }, 1500);
        }
      } catch {
        // Fallback
      }
    }
  },

  openPrompt: () => {
    set({ isPromptOpen: true });
  },

  closePrompt: () => {
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      // Ignore
    }
    set({ isPromptOpen: false });
  },

  triggerInstall: async () => {
    const { deferredPrompt } = get();

    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        set({
          deferredPrompt: null,
          isInstallable: false,
          isInstalled: true,
          isPromptOpen: false,
        });
        return true;
      }
    } catch (err) {
      console.warn('PWA install prompt error:', err);
    }

    set({ isPromptOpen: false });
    return false;
  },
}));

/**
 * Register Service Worker and initialize PWA install detection
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined') return;

  // Check standalone immediately
  if (isRunningStandalone()) {
    usePwaStore.setState({ isInstalled: true, isInstallable: false, isPromptOpen: false });
    return;
  }

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Minimal Note PWA SW registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('SW registration failed:', err);
        });
    });
  }

  // Handle Chromium / Android / Desktop install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    usePwaStore.getState().setDeferredPrompt(e as BeforeInstallPromptEvent);
  });

  // Track app installation completion
  window.addEventListener('appinstalled', () => {
    usePwaStore.getState().setDeferredPrompt(null);
    usePwaStore.setState({ isInstalled: true, isInstallable: false, isPromptOpen: false });
    console.log('Minimal Note installed as standalone app!');
  });

  // Check iOS Safari auto-prompt
  if (isIosSafari() && !isRunningStandalone()) {
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (!dismissedAt || Date.now() - parseInt(dismissedAt, 10) > DISMISS_COOLDOWN_MS) {
        setTimeout(() => {
          if (!isRunningStandalone()) {
            usePwaStore.setState({ isPromptOpen: true });
          }
        }, 2000);
      }
    } catch {
      // Ignore
    }
  }
}

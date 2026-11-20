import { create } from 'zustand';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstallable: boolean;
  isInstalled: boolean;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  triggerInstall: () => Promise<boolean>;
}

export const usePwaStore = create<PwaState>((set, get) => ({
  deferredPrompt: null,
  isInstallable: false,
  isInstalled: false,

  setDeferredPrompt: (prompt) => {
    set({ deferredPrompt: prompt, isInstallable: !!prompt });
  },

  triggerInstall: async () => {
    const { deferredPrompt } = get();
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      set({ deferredPrompt: null, isInstallable: false, isInstalled: true });
      return true;
    }
    return false;
  },
}));

/**
 * Register Service Worker cleanly
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Minimal Note PWA Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });
  });

  // Capture install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    usePwaStore.getState().setDeferredPrompt(e as BeforeInstallPromptEvent);
  });

  // Track app installation
  window.addEventListener('appinstalled', () => {
    usePwaStore.getState().setDeferredPrompt(null);
    usePwaStore.setState({ isInstalled: true, isInstallable: false });
    console.log('Minimal Note installed as standalone PWA app!');
  });
}

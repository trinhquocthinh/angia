interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

export interface InstallPrompt {
  available(): boolean;
  subscribe(listener: () => void): () => void;
  promptInstall(): Promise<InstallOutcome>;
}

// Chrome/Edge/Samsung Internet trên Android bắn `beforeinstallprompt` khi trang đủ điều kiện cài.
// Giữ sự kiện lại để nút "Cài AN GIA" mở hộp thoại hệ thống; iOS không có sự kiện này.
export function createInstallPrompt(target: EventTarget): InstallPrompt {
  let deferred: BeforeInstallPromptEvent | null = null;
  const listeners = new Set<() => void>();
  const set = (value: BeforeInstallPromptEvent | null) => {
    deferred = value;
    listeners.forEach((listener) => listener());
  };
  target.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    set(event as BeforeInstallPromptEvent);
  });
  target.addEventListener('appinstalled', () => set(null));
  return {
    available: () => deferred !== null,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async promptInstall() {
      const event = deferred;
      if (!event) return 'unavailable';
      // Mỗi sự kiện chỉ gọi prompt() được một lần.
      set(null);
      await event.prompt();
      return (await event.userChoice).outcome;
    },
  };
}

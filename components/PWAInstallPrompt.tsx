import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed/running as standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      console.log('beforeinstallprompt event fired');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For debugging: show button even without event (in development)
    if (!standalone && import.meta.env.DEV) {
      setTimeout(() => {
        console.log('Development mode: showing install button for testing');
        setShowInstallButton(true);
      }, 2000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback: show manual instructions
      alert('กรุณาคลิกที่ไอคอน "ติดตั้ง" ในแถบ address bar ของ Chrome/Edge\n\nหรือเปิดเมนู (⋮) → ติดตั้ง "Si Khai Waste Smart Dashboard"');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('Install prompt outcome:', outcome);

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  // Don't show if already installed or in standalone mode
  if (isStandalone) {
    console.log('App is running in standalone mode');
    return null;
  }

  if (!showInstallButton) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-2xl p-4 max-w-sm animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">ติดตั้งแอปบนเครื่อง</h3>
            <p className="text-sm text-white/90 mb-3">
              ใช้งานเหมือน Desktop App พร้อมการแจ้งเตือนและโหมด Offline
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                ติดตั้งเลย
              </button>
              <button
                onClick={() => setShowInstallButton(false)}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
              >
                ไว้ทีหลัง
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowInstallButton(false)}
            className="flex-shrink-0 text-white/80 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

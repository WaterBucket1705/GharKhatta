import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>PWA Standalone Active</span>
      </span>
    );
  }

  return (
    <>
      {isInstallable ? (
        <button
          type="button"
          onClick={install}
          className="px-3 py-1.5 min-h-[36px] rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install GharKhata App</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="px-3 py-1.5 min-h-[36px] rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
          <span>{isIOS ? 'Install on iPhone' : 'Install as iPhone / Mobile PWA'}</span>
        </button>
      )}

      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-pwa-guide-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-stone-200 p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <p className="text-xs font-semibold text-emerald-700">
                  Offline-Ready Mobile Web App
                </p>
                <h3
                  id="ios-pwa-guide-title"
                  className="text-lg font-bold text-stone-900 mt-0.5"
                >
                  Install GharKhata on iPhone / Mobile
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close Install Guide"
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-700 bg-[#FAF8F5] border border-stone-200 rounded-xl p-4">
              <p className="font-semibold text-stone-900">
                To add GharKhata to your iPhone Home Screen:
              </p>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>
                  Open GharKhata in <strong>iPhone Safari</strong> and tap the{' '}
                  <strong>Share</strong> button at the bottom of the screen.
                </li>
                <li>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong>Add</strong> in the top-right corner to launch GharKhata full-screen with instant offline <code className="font-mono-num">localStorage</code> sync.
                </li>
              </ol>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-stone-900 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWAInstall();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-16 lg:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Offline Mode — All khata updates are saved locally on your device.</span>
    </div>
  );
};

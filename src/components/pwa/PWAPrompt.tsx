// ============================================================
// PWAPrompt — Install banner + Notification prompt + iOS tip
//             + Offline indicator
// ============================================================
import { useState } from 'react';
import {
  Download,
  BellRing,
  BellOff,
  Wifi,
  WifiOff,
  X,
  Smartphone,
  Share,
  CheckCircle2,
} from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

// ── Offline status bar (always visible when offline) ─────────
export function OfflineBanner() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white text-xs font-bold shadow-md">
      <WifiOff className="w-3.5 h-3.5" />
      <span>You're offline — showing cached content</span>
    </div>
  );
}

// ── Small online/offline dot for layout bars ─────────────────
export function OnlineIndicator() {
  const { isOnline } = usePWA();

  return (
    <div
      className={`flex items-center gap-1.5 text-[10px] font-bold ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}
      title={isOnline ? 'Online' : 'Offline'}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
      {isOnline ? 'Online' : 'Offline'}
    </div>
  );
}

// ── Main PWA prompt component — mount once in App root ───────
export function PWAPrompt() {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    notificationPermission,
    promptInstall,
    requestPushPermission,
    showIOSInstallTip,
    dismissIOSTip,
  } = usePWA();

  const [notifDismissed, setNotifDismissed] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);

  return (
    <>
      {/* ── Offline Banner ── */}
      <OfflineBanner />

      {/* ── iOS Install Tip ── */}
      {showIOSInstallTip && !isInstalled && (
        <div className="fixed bottom-24 left-4 right-4 z-[200] animate-slide-up">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex gap-3 items-start">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm mb-0.5">Install DHIC Portal</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tap <strong className="text-white inline-flex items-center gap-1"><Share className="w-3 h-3" /> Share</strong> then{' '}
                <strong className="text-white">"Add to Home Screen"</strong> to install and enable notifications.
              </p>
            </div>
            <button onClick={dismissIOSTip} className="text-slate-400 hover:text-white shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Android/Desktop Install Banner ── */}
      {isInstallable && !isInstalled && !installDismissed && (
        <div className="fixed bottom-24 left-4 right-4 z-[200] animate-slide-up">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl flex gap-3 items-center">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-slate-800">Install DHIC Portal</p>
              <p className="text-xs text-slate-500">Add to home screen for quick access & notifications</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setInstallDismissed(true)}
                className="text-xs text-slate-500 hover:text-slate-700 font-semibold px-2"
              >
                Later
              </button>
              <button
                onClick={promptInstall}
                className="text-xs bg-emerald-600 text-white font-black px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Push Notification Prompt ── */}
      {notificationPermission === 'default' && !notifDismissed && (
        <div className="fixed bottom-24 left-4 right-4 z-[200] animate-slide-up">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl flex gap-3 items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-slate-800">Enable Notifications</p>
              <p className="text-xs text-slate-500">Stay updated with tasks, duties & announcements</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setNotifDismissed(true)}
                className="text-xs text-slate-500 hover:text-slate-700 font-semibold px-2"
              >
                Skip
              </button>
              <button
                onClick={requestPushPermission}
                className="text-xs bg-blue-600 text-white font-black px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notification enabled confirmation ── */}
      {notificationPermission === 'granted' && isInstalled && !notifDismissed && (
        <style>{`.pwa-notif-confirmed { display: none; }`}</style>
      )}
    </>
  );
}

// ── Notification toggle button (for settings/profile page) ──
export function NotificationToggle() {
  const { notificationPermission, requestPushPermission } = usePWA();

  const isGranted = notificationPermission === 'granted';
  const isDenied  = notificationPermission === 'denied';

  return (
    <button
      onClick={isGranted || isDenied ? undefined : requestPushPermission}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-all ${
        isGranted
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
          : isDenied
          ? 'bg-red-50 border-red-200 text-red-700 cursor-not-allowed'
          : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        isGranted ? 'bg-emerald-100' : isDenied ? 'bg-red-100' : 'bg-slate-100'
      }`}>
        {isGranted ? (
          <BellRing className="w-4 h-4 text-emerald-600" />
        ) : isDenied ? (
          <BellOff className="w-4 h-4 text-red-600" />
        ) : (
          <BellRing className="w-4 h-4 text-slate-500" />
        )}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-bold">Push Notifications</p>
        <p className="text-xs opacity-70">
          {isGranted ? 'Enabled — you will receive updates' :
           isDenied  ? 'Blocked in browser settings' :
                       'Tap to enable task & duty alerts'}
        </p>
      </div>
      {isGranted && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
    </button>
  );
}

// ── Install button (for settings page) ──────────────────────
export function InstallButton() {
  const { isInstallable, isInstalled, promptInstall } = usePWA();

  if (isInstalled) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        <div>
          <p className="text-sm font-bold text-emerald-700">App Installed</p>
          <p className="text-xs text-emerald-600">DHIC Portal is on your home screen</p>
        </div>
      </div>
    );
  }

  if (!isInstallable) return null;

  return (
    <button
      onClick={promptInstall}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
    >
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
        <Download className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-bold text-slate-800">Install App</p>
        <p className="text-xs text-slate-500">Add to home screen for best experience</p>
      </div>
    </button>
  );
}

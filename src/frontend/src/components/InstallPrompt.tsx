import { Download, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed before
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) return;

    // iOS detection
    const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Show iOS prompt after delay
    if (isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
        setIsInstalled(true);
      } else {
        setInstalling(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:w-80"
      style={{ animation: "slide-up 0.4s ease-out forwards" }}
    >
      <div className="rounded-2xl border border-purple-500/30 bg-gray-900/95 p-4 shadow-2xl shadow-purple-500/20 backdrop-blur-lg">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 pr-4">
            <h3 className="font-semibold text-white">App Install Karo</h3>
            <p className="mt-0.5 text-xs text-gray-400">
              ANKITA JOSHI ko apne phone pe install karo — free hai!
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="mt-3 rounded-lg bg-gray-800/50 p-3 text-xs text-gray-300">
            <p className="font-medium text-white">iOS pe install karo:</p>
            <ol className="mt-1 space-y-0.5 text-gray-400">
              <li>1. Safari browser mein kholo</li>
              <li>2. Share button tap karo</li>
              <li>3. "Add to Home Screen" select karo</li>
            </ol>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleInstall}
            disabled={installing}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {installing ? "Installing..." : "Phone pe Install Karo"}
          </button>
        )}
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

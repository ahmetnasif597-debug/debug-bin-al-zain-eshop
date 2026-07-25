import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    // إذا التطبيق مثبّت مسبقاً، لا تُظهر شيئاً أبداً
    if (isStandalone()) return;

    if (isIos()) {
      // آيفون: لا يوجد حدث beforeinstallprompt، نعرض البانر مباشرة
      setVisible(true);
      return;
    }

    // أندرويد/كروم: ننتظر حدث beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (isIos()) {
      setShowIosInstructions(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    setShowIosInstructions(false);
    // لا نحفظ أي شيء في localStorage — يظهر من جديد بكل زيارة كما طُلب
  };

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] px-4 py-3 flex items-center justify-between gap-3 shadow-md"
      style={{ backgroundColor: "#3b1f0e" }}
    >
      {!showIosInstructions ? (
        <>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img src="/images/logo-transparent.png" alt="بن الزين" className="w-9 h-9 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "#e8d5b0" }}>
                ثبّت تطبيق بن الزين
              </p>
              <p className="text-xs truncate" style={{ color: "#c9b896" }}>
                للوصول السريع من شاشتك الرئيسية
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              className="gap-1.5 font-bold"
              style={{ backgroundColor: "#e8d5b0", color: "#3b1f0e" }}
              onClick={handleInstallClick}
            >
              <Download className="w-4 h-4" />
              تثبيت
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" style={{ color: "#e8d5b0" }} />
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between gap-3 w-full">
          <p className="text-sm font-medium flex-1" style={{ color: "#e8d5b0" }}>
            اضغط <Share className="w-4 h-4 inline mx-1" /> ثم "إضافة إلى الشاشة الرئيسية"
          </p>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" style={{ color: "#e8d5b0" }} />
          </button>
        </div>
      )}
    </div>
  );
}

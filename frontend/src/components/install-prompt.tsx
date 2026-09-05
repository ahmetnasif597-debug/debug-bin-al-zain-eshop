import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      const installEvent = event as BeforeInstallPromptEvent;

      setInstallEvent(installEvent);
      setVisible(true);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;

    await installEvent.prompt();

    const { outcome } = await installEvent.userChoice;

    if (outcome === "accepted") {
      setInstallEvent(null);
      setVisible(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
  };

  if (!visible || !installEvent) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
      <div className="rounded-2xl border bg-background p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold">
              ثبّت متجر الزين
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              أضف المتجر إلى جهازك للوصول إليه بسرعة مثل التطبيق.
            </p>

            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleInstall}
              >
                تثبيت التطبيق
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleClose}
              >
                لاحقًا
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Store, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type StoreStatus = "open" | "pickup_only" | "closed";

const STATUS_OPTIONS: { value: StoreStatus; label: string; description: string; icon: typeof Store; color: string }[] = [
  {
    value: "open",
    label: "المحل مفتوح (توصيل واستلام)",
    description: "جميع الخدمات متاحة للعملاء",
    icon: Store,
    color: "text-green-700 border-green-400 bg-green-50",
  },
  {
    value: "pickup_only",
    label: "استلام من المحل فقط",
    description: "التوصيل غير متاح مؤقتاً — الاستلام من فرع شارع الفرقان",
    icon: Truck,
    color: "text-amber-700 border-amber-400 bg-amber-50",
  },
  {
    value: "closed",
    label: "المتجر مغلق حالياً",
    description: "سيتم تعطيل الطلبات تماماً حتى يعود المتجر للعمل",
    icon: XCircle,
    color: "text-red-700 border-red-400 bg-red-50",
  },
];

export default function AdminSettings() {
  const { toast } = useToast();
  const [status, setStatus] = useState<StoreStatus>("open");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/store-status")
      .then(r => r.json())
      .then(d => { setStatus(d.status ?? "open"); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/store-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "تم حفظ حالة المتجر بنجاح" });
    } catch {
      toast({ title: "فشل حفظ الإعدادات", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-3xl font-black text-foreground">إعدادات المتجر</h1>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-black text-foreground mb-1">حالة المتجر الحالية</h2>
          <p className="text-sm text-muted-foreground">اختر الحالة التي تنعكس فوراً على واجهة العملاء</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {STATUS_OPTIONS.map(option => {
              const Icon = option.icon;
              const isSelected = status === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setStatus(option.value)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-right transition-all duration-150 ${
                    isSelected
                      ? option.color + " border-current shadow-sm"
                      : "border-border bg-background hover:bg-muted/40 text-foreground"
                  }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? "bg-current/10" : "bg-muted"}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? "" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-between gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected ? "border-current" : "border-muted-foreground/40"}`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                      </div>
                      <span className="font-bold text-base flex-1 text-right">{option.label}</span>
                    </div>
                    <p className={`text-sm mt-1 mr-8 ${isSelected ? "opacity-80" : "text-muted-foreground"}`}>
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="pt-2 border-t border-border flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="min-w-[140px] font-bold"
          >
            {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useStoreStatus } from "@/context/store-status-context";
import { AlertTriangle, XCircle } from "lucide-react";

export function StoreStatusBanner() {
  const { status } = useStoreStatus();

  if (status === "open") return null;

  if (status === "pickup_only") {
    return (
      <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-800 py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>عذراً، التوصيل غير متوفر حالياً — متاح الاستلام من فرع شارع الفرقان</span>
      </div>
    );
  }

  if (status === "closed") {
    return (
      <div className="w-full bg-red-50 border-b border-red-200 text-red-800 py-2.5 px-4 text-center text-sm font-semibold flex items-center justify-center gap-2">
        <XCircle className="w-4 h-4 flex-shrink-0" />
        <span>المتجر مغلق حالياً، نتشرف باستقبال طلباتكم في أوقات العمل</span>
      </div>
    );
  }

  return null;
}

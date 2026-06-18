import { useStoreStatus } from "@/hooks/use-store-status";

export function StoreBanner() {
  const { data: status } = useStoreStatus();

  if (!status || status === "open") return null;

  const isPickupOnly = status === "pickup_only";

  return (
    <div
      className={`w-full py-3 px-4 text-center text-sm font-bold tracking-wide z-50 ${
        isPickupOnly
          ? "bg-[#b8860b]/10 border-b border-[#b8860b]/25 text-[#7a5c00]"
          : "bg-[#4a1c1c]/10 border-b border-[#4a1c1c]/25 text-[#6b1f1f]"
      }`}
      style={{ fontFamily: "'Tajawal', 'Cairo', sans-serif" }}
    >
      <div className="flex items-center justify-center gap-2 max-w-3xl mx-auto">
        <span className="text-base leading-none">{isPickupOnly ? "🟡" : "🔴"}</span>
        <span>
          {isPickupOnly
            ? "التوصيل غير متوفر حالياً، متاح الاستلام من المحل فقط"
            : "المتجر مغلق حالياً، نعتذر عن استقبال الطلبات الآن"}
        </span>
      </div>
    </div>
  );
}

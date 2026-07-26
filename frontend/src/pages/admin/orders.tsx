import { useState } from "react";
import { useLocation } from "wouter";
import { UserCircle2, Package, ChevronDown, ChevronUp, CheckCircle2, Clock, XCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetAuthMe, useGetMyOrders } from "@/lib/api-client";

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: "قيد الانتظار",
    color: "text-amber-600 bg-amber-50 border-amber-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  confirmed: {
    label: "جاري التوصيل",
    color: "text-blue-600 bg-blue-50 border-blue-200",
    icon: <Truck className="w-3.5 h-3.5" />,
  },
  completed: {
    label: "مكتمل",
    color: "text-green-600 bg-green-50 border-green-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: "ملغى",
    color: "text-red-600 bg-red-50 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-SY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatWeight(w: number | null | undefined) {
  if (!w) return null;
  return w >= 1000 ? `${w / 1000} كيلو` : `${w} غ`;
}

function OrderCard({ order }: { order: { id: number; status: string; createdAt: string; totalPrice: number; items: { productId: number; nameAr: string; price: number; quantity: number; selectedWeight?: number | null; lineTotal?: number | null }[]; notes?: string | null } }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_MAP[order.status] ?? STATUS_MAP.pending;

  return (
    <div className="bg-background border border-border rounded-2xl overflow-hidden transition-shadow hover:shadow-md">
      <button
        className="w-full p-5 flex items-center justify-between gap-4 text-right"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-black text-foreground text-base">طلب #{order.id}</p>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${status.color}`}>
            {status.icon}
            {status.label}
          </span>
          <span className="font-black text-primary text-base whitespace-nowrap">
            {order.totalPrice.toLocaleString("ar-SY")} <span className="text-xs font-normal text-muted-foreground">ل.س</span>
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-3">
          <h4 className="text-sm font-bold text-muted-foreground mb-3">المنتجات المطلوبة</h4>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center text-xs font-bold text-primary">
                    {item.quantity}×
                  </span>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{item.nameAr}</p>
                    {item.selectedWeight && (
                      <p className="text-xs text-muted-foreground mt-0.5">الوزن: {formatWeight(item.selectedWeight)}</p>
                    )}
                  </div>
                </div>
                <span className="font-bold text-sm text-primary">
                  {(item.lineTotal ?? item.price * item.quantity).toLocaleString("ar-SY")} ل.س
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border font-black text-base">
            <span className="text-muted-foreground">المجموع الكلي</span>
            <span className="text-primary">{order.totalPrice.toLocaleString("ar-SY")} ل.س</span>
          </div>
          {order.notes && (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl px-4 py-2 mt-2">
              <span className="font-bold">ملاحظات:</span> {order.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [, setLocation] = useLocation();
  const { data: customer, isLoading: loadingCustomer, isError: authError } = useGetAuthMe();
  const { data: orders, isLoading: loadingOrders } = useGetMyOrders();

  if (loadingCustomer && !authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!customer || authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
        <UserCircle2 className="w-20 h-20 text-primary/30" />
        <div>
          <h2 className="text-2xl font-black text-foreground mb-2">يجب تسجيل الدخول</h2>
          <p className="text-muted-foreground font-medium">سجّل دخولك لعرض سجل طلباتك</p>
        </div>
        <Button size="lg" className="font-bold px-10" onClick={() => setLocation("/login")}>
          تسجيل الدخول
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen max-w-4xl">
      <h1 className="text-3xl font-black text-foreground mb-8">طلباتي</h1>

      {loadingOrders ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">جارٍ تحميل الطلبات...</p>
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="bg-card rounded-3xl border border-border shadow-md p-12 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-black text-foreground mb-3">ما طلبتي شي بعد!</h3>
          <p className="text-muted-foreground font-medium mb-8 max-w-sm mx-auto">
            اكتشف منتجاتنا المميزة من بن وقهوة ومكسرات وأكثر
          </p>
          <Button size="lg" className="font-bold px-10" onClick={() => setLocation("/products")}>
            تصفح المنتجات
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-foreground">سجل طلباتك</h2>
            <span className="text-sm text-muted-foreground font-medium">{orders.length} طلب</span>
          </div>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

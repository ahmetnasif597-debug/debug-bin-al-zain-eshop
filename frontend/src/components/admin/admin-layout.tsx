import { Link, useLocation } from "wouter";
import { useAdmin } from "@/context/admin-context";
import { LayoutDashboard, Package, Tags, ShoppingBag, Users, LogOut, Menu, X, Bell, Settings } from "lucide-react";
import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAdminOrderAlerts } from "@/hooks/use-admin-order-alerts";

const NAV_ITEMS = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/products", label: "المنتجات", icon: Package },
  { href: "/admin/categories", label: "الفئات", icon: Tags },
  { href: "/admin/orders", label: "الطلبات", icon: ShoppingBag, alertKey: "orders" },
  { href: "/admin/customers", label: "العملاء", icon: Users },
  { href: "/admin/notifications", label: "الإشعارات", icon: Bell },
  { href: "/admin/settings", label: "إعدادات المتجر", icon: Settings },
];

function playAlertSound() {
  try {
    const ctx = new AudioContext();
    const times = [0, 0.18, 0.36];
    times.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + t + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + t + 0.14);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.15);
    });
  } catch {
    // AudioContext not available, skip
  }
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { logout, isAdmin } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const { toast } = useToast();
  const toastShownRef = useRef(false);

  const handleNewOrders = useCallback(
    (alert: { count: number; orders: { id: number; customerName: string | null }[] }) => {
      playAlertSound();
      setNewOrderCount((prev) => prev + alert.count);
      const name = alert.orders[0]?.customerName ?? "عميل";
      const extra = alert.count > 1 ? ` (+${alert.count - 1} آخرين)` : "";
      toast({
        title: `🛒 طلب جديد من ${name}${extra}`,
        description: "اضغط هنا لعرض الطلبات",
        duration: 8000,
        action: (
          <button
            onClick={() => navigate("/admin/orders")}
            className="text-primary font-bold underline text-sm"
          >
            عرض
          </button>
        ),
      } as any);
    },
    [toast, navigate]
  );

  useAdminOrderAlerts({
    enabled: isAdmin,
    onNewOrders: handleNewOrders,
    intervalMs: 15000,
  });

  const clearBadge = (href: string) => {
    if (href === "/admin/orders") setNewOrderCount(0);
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-[#5C3317] text-white p-4">
        <div className="font-black text-xl">بن الزين</div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-64 bg-[#5C3317] text-white shadow-xl transition-transform duration-300 md:static md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "translate-x-full"}
      `}>
        <div className="p-6 hidden md:block">
          <div className="font-black text-3xl text-center mb-2">بن الزين</div>
          <div className="text-center text-white/70 text-sm font-medium">لوحة الإدارة</div>
        </div>

        <nav className="mt-8 flex flex-col gap-2 px-4">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            const hasBadge = item.alertKey === "orders" && newOrderCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? "bg-white/20 font-bold" : "hover:bg-white/10 font-medium"
                }`}
                onClick={() => {
                  setSidebarOpen(false);
                  clearBadge(item.href);
                }}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {hasBadge && (
                    <span className="absolute -top-2 -left-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 animate-bounce">
                      {newOrderCount > 9 ? "9+" : newOrderCount}
                    </span>
                  )}
                </div>
                <span className="flex-1">{item.label}</span>
                {hasBadge && (
                  <span className="bg-red-500 text-white text-[10px] font-black rounded-full px-2 py-0.5">
                    {newOrderCount > 9 ? "9+" : newOrderCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-8 w-full px-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-white hover:bg-white/10 hover:text-white"
            onClick={() => logout()}
          >
            <LogOut className="w-5 h-5" />
            خروج
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

import { useGetAdminStats, useListOrders } from "@/lib/api-client";
import { Package, Tags, ShoppingBag, AlertTriangle, Clock, Bell, TrendingUp, ArrowUpRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

const STATUS_MAP = {
  pending: { label: "معلق", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  confirmed: { label: "جاري التوصيل", dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  completed: { label: "مكتمل", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  cancelled: { label: "ملغي", dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
};

function useNewOrderNotification() {
  const lastChecked = useRef<string>(new Date().toISOString());
  const [newOrders, setNewOrders] = useState<any[]>([]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/orders/new-since?since=${lastChecked.current}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.count > 0) {
          setNewOrders(data.orders);
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("🛒 طلب جديد - بن الزين", {
              body: `وصل ${data.count} طلب جديد!`,
              icon: "/favicon.ico",
            });
          }
          lastChecked.current = new Date().toISOString();
        }
      } catch {}
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return newOrders;
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  isLoading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  isLoading: boolean;
}) {
  if (isLoading) return <Skeleton className="h-[116px] rounded-2xl" />;
  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow p-5 flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold text-muted-foreground mb-2">{label}</p>
        <p className="text-3xl font-black text-foreground tabular-nums">{value.toLocaleString("ar-SY")}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: loadingStats } = useGetAdminStats();
  const { data: recentOrders, isLoading: loadingOrders } = useListOrders();
  const newOrders = useNewOrderNotification();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">نظرة عامة</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">ملخص أداء المتجر اليوم</p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
          style={{ backgroundColor: "#3b1f0e", color: "#e8d5b0" }}
        >
          <TrendingUp className="w-4 h-4" />
          بن الزين
        </div>
      </div>

      {/* إشعار طلب جديد */}
      {newOrders.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 animate-pulse">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-black text-emerald-900 text-sm">وصل {newOrders.length} طلب جديد! 🛒</p>
            <p className="text-emerald-700 text-xs font-medium mt-0.5">راجع صفحة الطلبات للتفاصيل</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-1 flex-shrink-0"
          >
            عرض
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="إجمالي المنتجات"
          value={stats?.totalProducts || 0}
          icon={Package}
          iconBg="bg-[#3b1f0e]/10"
          iconColor="text-[#3b1f0e]"
          isLoading={loadingStats}
        />
        <StatCard
          label="إجمالي الفئات"
          value={stats?.totalCategories || 0}
          icon={Tags}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          isLoading={loadingStats}
        />
        <StatCard
          label="طلبات معلقة"
          value={stats?.pendingOrders || 0}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          isLoading={loadingStats}
        />
        <StatCard
          label="نفاد المخزون"
          value={stats?.outOfStockProducts || 0}
          icon={AlertTriangle}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          isLoading={loadingStats}
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-black text-foreground">أحدث الطلبات</h2>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-[#3b1f0e] hover:underline flex items-center gap-1"
          >
            عرض الكل
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingOrders ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="text-right text-xs font-bold text-muted-foreground">رقم الطلب</TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground">التاريخ</TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground">المجموع</TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders?.slice(0, 5).map((order) => {
                const status = STATUS_MAP[order.status as keyof typeof STATUS_MAP];
                return (
                  <TableRow key={order.id} className="border-border/60 hover:bg-muted/30">
                    <TableCell className="font-bold text-sm">#{order.id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), "yyyy/MM/dd")}
                    </TableCell>
                    <TableCell className="font-bold text-sm text-[#3b1f0e]">
                      {order.totalPrice.toLocaleString("ar-SY")} ل.س
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${status?.bg} ${status?.text} ${status?.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status?.dot}`} />
                        {status?.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!recentOrders || recentOrders.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-sm">
                    لا توجد طلبات حديثة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

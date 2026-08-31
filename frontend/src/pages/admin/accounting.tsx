import { useAccountingDashboard } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Wallet, Users, Truck, Package, Receipt, Banknote } from "lucide-react";

function StatCard({ label, value, icon: Icon, color, isLoading, suffix = " ل.س" }: any) {
  if (isLoading) return <Skeleton className="h-[100px] rounded-2xl" />;
  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold text-muted-foreground mb-1">{label}</p>
        <p className={`text-2xl font-black tabular-nums ${color}`}>{value.toLocaleString("ar-SY")}{suffix}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-opacity-10 ${color.replace("text-", "bg-")}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  );
}

export default function AccountingPage() {
  const { data, isLoading } = useAccountingDashboard();

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">لوحة المحاسبة</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">ملخص مالي شامل</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="النقدية" value={data?.totalCash ?? 0} icon={Banknote} color="text-emerald-600" isLoading={isLoading} />
        <StatCard label="المبيعات" value={data?.totalSales ?? 0} icon={TrendingUp} color="text-blue-600" isLoading={isLoading} />
        <StatCard label="المشتريات" value={data?.totalPurchases ?? 0} icon={Truck} color="text-amber-600" isLoading={isLoading} />
        <StatCard label="المصروفات" value={data?.totalExpenses ?? 0} icon={Receipt} color="text-red-600" isLoading={isLoading} />
        <StatCard label="الأرباح الإجمالية" value={data?.grossProfit ?? 0} icon={Wallet} color="text-purple-600" isLoading={isLoading} />
        <StatCard label="صافي الربح" value={data?.netProfit ?? 0} icon={TrendingUp} color="text-emerald-700" isLoading={isLoading} />
        <StatCard label="ديون العملاء" value={data?.customersDebt ?? 0} icon={Users} color="text-orange-600" isLoading={isLoading} />
        <StatCard label="ديون الموردين" value={data?.suppliersDebt ?? 0} icon={Truck} color="text-rose-600" isLoading={isLoading} />
        <StatCard label="قيمة المخزون" value={data?.inventoryValue ?? 0} icon={Package} color="text-teal-600" isLoading={isLoading} />
      </div>
    </div>
  );
}

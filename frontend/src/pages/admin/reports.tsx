import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, TrendingUp, Package, ShoppingBag } from "lucide-react";

function monthOptions() {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("ar", { month: "long", year: "numeric" });
    opts.push({ value, label });
  }
  return opts;
}

interface DailyRow {
  id: number;
  date: string;
  totalSales: number;
  orderCount: number;
}

interface ProductBreakdown {
  productId: number;
  nameAr: string;
  quantity: number;
  revenue: number;
}

interface MonthlyReport {
  month: string;
  totalSales: number;
  orderCount: number;
  days: { date: string; totalSales: number; orderCount: number }[];
  topProducts: ProductBreakdown[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function AdminReports() {
  const months = monthOptions();
  const [selectedMonth, setSelectedMonth] = useState(months[0].value);
  const [isRunning, setIsRunning] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: dailyRows, isLoading: dailyLoading } = useQuery({
    queryKey: ["/api/admin/reports/daily"],
    queryFn: () => fetchJson<DailyRow[]>("/api/admin/reports/daily"),
  });

  const { data: monthly, isLoading: monthlyLoading } = useQuery({
    queryKey: ["/api/admin/reports/monthly", selectedMonth],
    queryFn: () => fetchJson<MonthlyReport>(`/api/admin/reports/monthly?month=${selectedMonth}`),
  });

  const handleRunToday = async () => {
    setIsRunning(true);
    try {
      const res = await fetch("/api/admin/reports/rollup-today", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ title: "تعذر تحديث التقرير", description: err?.error, variant: "destructive" });
        return;
      }
      toast({ title: "تم تحديث ملخص اليوم" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports/monthly"] });
    } catch {
      toast({ title: "تعذر الاتصال بالسيرفر", variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black text-foreground">التقارير</h1>
        <Button onClick={handleRunToday} disabled={isRunning} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isRunning ? "animate-spin" : ""}`} />
          تحديث ملخص اليوم الآن
        </Button>
      </div>

      {/* التقرير الشهري */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-black">التقرير الشهري</h2>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {monthlyLoading ? (
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
        ) : monthly ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-primary/5 rounded-xl p-4 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-primary flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground font-bold">إجمالي المبيعات</div>
                  <div className="text-2xl font-black text-primary">
                    {monthly.totalSales.toLocaleString("ar-SY")} ل.س
                  </div>
                </div>
              </div>
              <div className="bg-primary/5 rounded-xl p-4 flex items-center gap-3">
                <ShoppingBag className="w-8 h-8 text-primary flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground font-bold">عدد الطلبات</div>
                  <div className="text-2xl font-black text-primary">{monthly.orderCount}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" /> أكثر المنتجات مبيعًا هذا الشهر
              </h3>
              {monthly.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد بيانات مبيعات لهذا الشهر بعد.</p>
              ) : (
                <div className="space-y-2">
                  {monthly.topProducts.slice(0, 10).map((p) => (
                    <div key={p.productId} className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                      <span className="font-bold">{p.nameAr}</span>
                      <span className="text-sm text-muted-foreground">
                        {p.quantity} قطعة — {p.revenue.toLocaleString("ar-SY")} ل.س
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* الأرشيف اليومي */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 pb-0">
          <h2 className="text-xl font-black mb-4">الأرشيف اليومي</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">عدد الطلبات</TableHead>
              <TableHead className="text-right">إجمالي المبيعات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dailyLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : !dailyRows || dailyRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  لا يوجد أرشيف بعد — اضغط "تحديث ملخص اليوم الآن" لبدء التسجيل.
                </TableCell>
              </TableRow>
            ) : (
              dailyRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-bold">{row.date}</TableCell>
                  <TableCell>{row.orderCount}</TableCell>
                  <TableCell className="font-bold text-primary">
                    {row.totalSales.toLocaleString("ar-SY")} ل.س
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import { useCashBalance, useCashTransactions, usePayments } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Banknote, ArrowDownLeft, ArrowUpRight, CreditCard } from "lucide-react";

function fmtDate(d: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-SY", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function fmtDateTime(d: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("ar-SY", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function CashPage() {
  const { data: balance, isLoading: balLoading } = useCashBalance();
  const { data: transactions, isLoading: txLoading } = useCashTransactions();
  const { data: payments, isLoading: payLoading } = usePayments();

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#713a24] text-white">
          <Banknote className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-black text-foreground">الصندوق / النقدية</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {balLoading ? <Skeleton className="h-[100px] rounded-2xl" /> : (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5">
            <p className="text-sm font-semibold text-muted-foreground">رصيد الصندوق</p>
            <p className="text-3xl font-black text-emerald-600 tabular-nums mt-1">{balance?.balance.toLocaleString("ar-SY")} ل.س</p>
          </div>
        )}
        {balLoading ? <Skeleton className="h-[100px] rounded-2xl" /> : (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5">
            <p className="text-sm font-semibold text-muted-foreground">إجمالي الوارد</p>
            <p className="text-3xl font-black text-blue-600 tabular-nums mt-1">{balance?.totalIn.toLocaleString("ar-SY")} ل.س</p>
          </div>
        )}
        {balLoading ? <Skeleton className="h-[100px] rounded-2xl" /> : (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5">
            <p className="text-sm font-semibold text-muted-foreground">إجمالي الصادر</p>
            <p className="text-3xl font-black text-red-600 tabular-nums mt-1">{balance?.totalOut.toLocaleString("ar-SY")} ل.س</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60 font-bold">حركة الصندوق</div>
        {txLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="text-right text-xs font-bold">النوع</TableHead>
                <TableHead className="text-right text-xs font-bold">المبلغ</TableHead>
                <TableHead className="text-right text-xs font-bold">البيان</TableHead>
                <TableHead className="text-right text-xs font-bold">المرجع</TableHead>
                <TableHead className="text-right text-xs font-bold">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    لا توجد حركات صندوق
                  </TableCell>
                </TableRow>
              )}
              {transactions?.map((t: any) => (
                <TableRow key={t.id} className="border-border/60 hover:bg-muted/30">
                  <TableCell>
                    {t.transactionType === "in" ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <ArrowDownLeft className="w-4 h-4" /> وارد
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 font-semibold">
                        <ArrowUpRight className="w-4 h-4" /> صادر
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums font-semibold">
                    {Number(t.amount).toLocaleString("ar-SY")} ل.س
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.description || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{t.reference || "—"}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {fmtDate(t.transactionDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60 font-bold flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> المدفوعات
        </div>
        {payLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="text-right text-xs font-bold">المبلغ</TableHead>
                <TableHead className="text-right text-xs font-bold">الطريقة</TableHead>
                <TableHead className="text-right text-xs font-bold">البيان</TableHead>
                <TableHead className="text-right text-xs font-bold">رقم الطلب</TableHead>
                <TableHead className="text-right text-xs font-bold">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    لا توجد مدفوعات
                  </TableCell>
                </TableRow>
              )}
              {payments?.map((p: any) => (
                <TableRow key={p.id} className="border-border/60 hover:bg-muted/30">
                  <TableCell className="tabular-nums font-semibold text-emerald-600">
                    {Number(p.amount).toLocaleString("ar-SY")} ل.س
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.method || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.description || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.orderId || "—"}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {fmtDateTime(p.paidAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

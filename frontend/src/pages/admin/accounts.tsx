import { useAccounts } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  asset: "أصول", liability: "خصوم", equity: "حقوق ملكية", revenue: "إيرادات", expense: "مصروفات",
};

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#713a24] text-white">
          <BookOpen className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-black text-foreground">شجرة الحسابات</h1>
      </div>
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="text-right text-xs font-bold">الكود</TableHead>
                <TableHead className="text-right text-xs font-bold">اسم الحساب</TableHead>
                <TableHead className="text-right text-xs font-bold">النوع</TableHead>
                <TableHead className="text-right text-xs font-bold">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts?.map((acc: any) => (
                <TableRow key={acc.id} className="border-border/60 hover:bg-muted/30">
                  <TableCell className="font-mono text-sm font-bold">{acc.code}</TableCell>
                  <TableCell className="text-sm font-bold">{acc.name}</TableCell>
                  <TableCell className="text-sm">{TYPE_LABELS[acc.accountType] || acc.accountType}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${acc.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                      {acc.isActive ? "نشط" : "معطل"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {(!accounts || accounts.length === 0) && (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-sm">لا توجد حسابات</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

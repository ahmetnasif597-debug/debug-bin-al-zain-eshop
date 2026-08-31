import { useState } from "react";
import { useJournalEntries, useJournalEntry } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import { format } from "date-fns";

export default function JournalEntriesPage() {
  const { data: entries, isLoading } = useJournalEntries();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: detail, isLoading: detailLoading } = useJournalEntry(selectedId ?? 0);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#713a24] text-white">
          <FileText className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-black text-foreground">القيود اليومية</h1>
      </div>
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="text-right text-xs font-bold">رقم القيد</TableHead>
                <TableHead className="text-right text-xs font-bold">التاريخ</TableHead>
                <TableHead className="text-right text-xs font-bold">البيان</TableHead>
                <TableHead className="text-right text-xs font-bold">النوع</TableHead>
                <TableHead className="text-right text-xs font-bold">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries?.map((entry: any) => (
                <TableRow key={entry.id} className="border-border/60 hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedId(entry.id)}>
                  <TableCell className="font-mono text-sm font-bold">{entry.entryNumber}</TableCell>
                  <TableCell className="text-sm">{format(new Date(entry.entryDate), "yyyy/MM/dd HH:mm")}</TableCell>
                  <TableCell className="text-sm">{entry.description}</TableCell>
                  <TableCell className="text-sm">{entry.sourceType}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${entry.status === "posted" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {entry.status === "posted" ? "مرحل" : "مسودة"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {(!entries || entries.length === 0) && (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">لا توجد قيود</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader><DialogTitle>تفاصيل القيد {detail?.entryNumber}</DialogTitle></DialogHeader>
          {detailLoading ? <Skeleton className="h-32 w-full" /> : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{detail?.description}</p>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead className="text-right">الحساب</TableHead><TableHead className="text-right">مدين</TableHead><TableHead className="text-right">دائن</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail?.lines?.map((line: any) => (
                      <TableRow key={line.id}>
                        <TableCell className="text-sm">{line.accountName} ({line.accountCode})</TableCell>
                        <TableCell className="text-sm font-mono">{line.debit > 0 ? line.debit.toLocaleString("ar-SY") : "—"}</TableCell>
                        <TableCell className="text-sm font-mono">{line.credit > 0 ? line.credit.toLocaleString("ar-SY") : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

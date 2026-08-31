import { useState } from "react";
import { useExpenses, useCreateExpense, useDeleteExpense } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Receipt, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function ExpensesPage() {
  const { toast } = useToast();
  const { data: expenses, isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: "", description: "", amount: "", paymentMethod: "cash", notes: "" });

  const handleSubmit = () => {
    if (!form.category || !form.amount) { toast({ title: "بيانات ناقصة", variant: "destructive" }); return; }
    createExpense.mutate({ category: form.category, description: form.description, amount: Number(form.amount), paymentMethod: form.paymentMethod, notes: form.notes }, {
      onSuccess: () => { toast({ title: "تم التسجيل" }); setShowAdd(false); setForm({ category: "", description: "", amount: "", paymentMethod: "cash", notes: "" }); },
      onError: (err: any) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#713a24] text-white">
            <Receipt className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-black text-foreground">المصروفات</h1>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-[#713a24] hover:bg-[#60301e]">
          <Plus className="w-4 h-4 ml-2" /> مصروف جديد
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="text-right text-xs font-bold">النوع</TableHead>
                <TableHead className="text-right text-xs font-bold">البيان</TableHead>
                <TableHead className="text-right text-xs font-bold">المبلغ</TableHead>
                <TableHead className="text-right text-xs font-bold">التاريخ</TableHead>
                <TableHead className="text-right text-xs font-bold">طريقة الدفع</TableHead>
                <TableHead className="text-right text-xs font-bold">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses?.map((e: any) => (
                <TableRow key={e.id} className="border-border/60 hover:bg-muted/30">
                  <TableCell className="text-sm font-bold">{e.category}</TableCell>
                  <TableCell className="text-sm">{e.description}</TableCell>
                  <TableCell className="text-sm font-bold text-red-600">{e.amount.toLocaleString("ar-SY")} ل.س</TableCell>
                  <TableCell className="text-sm">{format(new Date(e.expenseDate), "yyyy/MM/dd")}</TableCell>
                  <TableCell className="text-sm">{e.paymentMethod}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteExpense.mutate(e.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
                </TableRow>
              ))}
              {(!expenses || expenses.length === 0) && (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">لا توجد مصروفات</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>مصروف جديد</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="النوع *" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input placeholder="البيان" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input type="number" placeholder="المبلغ *" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Input placeholder="طريقة الدفع" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} />
            <Input placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <Button onClick={handleSubmit} className="w-full bg-[#713a24] hover:bg-[#60301e]" disabled={createExpense.isPending}>حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

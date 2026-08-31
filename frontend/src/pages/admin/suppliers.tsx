import { useState } from "react";
import { useSuppliers, useSupplierStatement, useCreateSupplier, useDeleteSupplier } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Plus, Trash2, Eye } from "lucide-react";

export default function SuppliersPage() {
  const { toast } = useToast();
  const { data: suppliers, isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const [showAdd, setShowAdd] = useState(false);
  const [showStatement, setShowStatement] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", email: "", notes: "" });

  const { data: statement } = useSupplierStatement(showStatement ?? 0);

  const handleSubmit = () => {
    if (!form.name) { toast({ title: "اسم المورد مطلوب", variant: "destructive" }); return; }
    createSupplier.mutate(form, {
      onSuccess: () => { toast({ title: "تم الإضافة" }); setShowAdd(false); setForm({ name: "", phone: "", address: "", email: "", notes: "" }); },
      onError: (err: any) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#713a24] text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-black text-foreground">الموردين</h1>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-[#713a24] hover:bg-[#60301e]">
          <Plus className="w-4 h-4 ml-2" /> مورد جديد
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="text-right text-xs font-bold">الاسم</TableHead>
                <TableHead className="text-right text-xs font-bold">الهاتف</TableHead>
                <TableHead className="text-right text-xs font-bold">إجمالي المشتريات</TableHead>
                <TableHead className="text-right text-xs font-bold">المدفوع</TableHead>
                <TableHead className="text-right text-xs font-bold">الرصيد</TableHead>
                <TableHead className="text-right text-xs font-bold">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers?.map((s: any) => (
                <TableRow key={s.id} className="border-border/60 hover:bg-muted/30">
                  <TableCell className="text-sm font-bold">{s.name}</TableCell>
                  <TableCell className="text-sm font-mono">{s.phone}</TableCell>
                  <TableCell className="text-sm">{s.totalPurchases.toLocaleString("ar-SY")}</TableCell>
                  <TableCell className="text-sm text-emerald-600">{s.totalPaid.toLocaleString("ar-SY")}</TableCell>
                  <TableCell className={`text-sm font-bold ${s.balance > 0 ? "text-red-600" : "text-emerald-600"}`}>{s.balance.toLocaleString("ar-SY")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setShowStatement(s.id)}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteSupplier.mutate(s.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!suppliers || suppliers.length === 0) && (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">لا يوجد موردين</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>مورد جديد</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="الاسم *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="العنوان" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input placeholder="البريد" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <Button onClick={handleSubmit} className="w-full bg-[#713a24] hover:bg-[#60301e]" disabled={createSupplier.isPending}>حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showStatement} onOpenChange={() => setShowStatement(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader><DialogTitle>كشف حساب: {statement?.supplier?.name}</DialogTitle></DialogHeader>
          {statement && (
            <div className="space-y-3">
              <div className="flex gap-4 text-sm">
                <span className="font-bold">الرصيد: <span className={statement.supplier.balance > 0 ? "text-red-600" : "text-emerald-600"}>{statement.supplier.balance.toLocaleString("ar-SY")}</span></span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow><TableHead className="text-right">التاريخ</TableHead><TableHead className="text-right">البيان</TableHead><TableHead className="text-right">مدين</TableHead><TableHead className="text-right">دائن</TableHead><TableHead className="text-right">الرصيد</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {statement.transactions?.map((t: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{new Date(t.date).toLocaleDateString("ar-SY")}</TableCell>
                      <TableCell className="text-sm">{t.description}</TableCell>
                      <TableCell className="text-sm font-mono">{t.debit > 0 ? t.debit.toLocaleString("ar-SY") : "—"}</TableCell>
                      <TableCell className="text-sm font-mono">{t.credit > 0 ? t.credit.toLocaleString("ar-SY") : "—"}</TableCell>
                      <TableCell className="text-sm font-bold">{t.balance.toLocaleString("ar-SY")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

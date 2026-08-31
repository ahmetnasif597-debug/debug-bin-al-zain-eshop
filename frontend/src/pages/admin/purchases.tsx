import { useState } from "react";
import { usePurchases, usePurchase, useCreatePurchase, useDeletePurchase, useSuppliers, useAdminProducts } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Plus, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";

export default function PurchasesPage() {
  const { toast } = useToast();
  const { data: purchases, isLoading } = usePurchases();
  const { data: suppliers } = useSuppliers();
  const { data: products } = useAdminProducts();
  const createPurchase = useCreatePurchase();
  const deletePurchase = useDeletePurchase();

  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<number | null>(null);
  const [items, setItems] = useState<any[]>([{ productId: "", quantity: 1, unitPrice: 0, unitsPerPurchaseUnit: 1 }]);
  const [form, setForm] = useState({ invoiceNumber: "", supplierId: "", discount: 0, paidAmount: 0, paymentMethod: "cash", notes: "" });

  const { data: detail } = usePurchase(showDetail ?? 0);

  const addItem = () => setItems([...items, { productId: "", quantity: 1, unitPrice: 0, unitsPerPurchaseUnit: 1 }]);
  const updateItem = (i: number, field: string, value: any) => {
    const next = [...items];
    next[i][field] = value;
    setItems(next);
  };
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const handleSubmit = () => {
    if (!form.invoiceNumber || !form.supplierId || items.length === 0 || items.some((it) => !it.productId)) {
      toast({ title: "بيانات ناقصة", description: "أكمل جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    createPurchase.mutate({
      invoiceNumber: form.invoiceNumber,
      supplierId: Number(form.supplierId),
      items: items.map((it) => ({ productId: Number(it.productId), quantity: Number(it.quantity), unitPrice: Number(it.unitPrice), unitsPerPurchaseUnit: Number(it.unitsPerPurchaseUnit), unit: "piece" })),
      discount: Number(form.discount),
      paidAmount: Number(form.paidAmount),
      paymentMethod: form.paymentMethod,
      notes: form.notes,
    }, {
      onSuccess: () => { toast({ title: "تم إضافة الفاتورة" }); setShowAdd(false); setItems([{ productId: "", quantity: 1, unitPrice: 0, unitsPerPurchaseUnit: 1 }]); setForm({ invoiceNumber: "", supplierId: "", discount: 0, paidAmount: 0, paymentMethod: "cash", notes: "" }); },
      onError: (err: any) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#713a24] text-white">
            <Truck className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-black text-foreground">المشتريات</h1>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-[#713a24] hover:bg-[#60301e]">
          <Plus className="w-4 h-4 ml-2" /> فاتورة جديدة
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="text-right text-xs font-bold">رقم الفاتورة</TableHead>
                <TableHead className="text-right text-xs font-bold">المورد</TableHead>
                <TableHead className="text-right text-xs font-bold">التاريخ</TableHead>
                <TableHead className="text-right text-xs font-bold">الإجمالي</TableHead>
                <TableHead className="text-right text-xs font-bold">المدفوع</TableHead>
                <TableHead className="text-right text-xs font-bold">المتبقي</TableHead>
                <TableHead className="text-right text-xs font-bold">الحالة</TableHead>
                <TableHead className="text-right text-xs font-bold">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases?.map((p: any) => (
                <TableRow key={p.id} className="border-border/60 hover:bg-muted/30">
                  <TableCell className="font-mono text-sm font-bold">{p.invoiceNumber}</TableCell>
                  <TableCell className="text-sm">{p.supplierName}</TableCell>
                  <TableCell className="text-sm">{format(new Date(p.invoiceDate), "yyyy/MM/dd")}</TableCell>
                  <TableCell className="text-sm font-bold">{p.totalAmount.toLocaleString("ar-SY")}</TableCell>
                  <TableCell className="text-sm text-emerald-600">{p.paidAmount.toLocaleString("ar-SY")}</TableCell>
                  <TableCell className="text-sm text-red-600">{p.remainingAmount.toLocaleString("ar-SY")}</TableCell>
                  <TableCell><span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">{p.status}</span></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setShowDetail(p.id)}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deletePurchase.mutate(p.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!purchases || purchases.length === 0) && (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">لا توجد فواتير</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>فاتورة شراء جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold">رقم الفاتورة</label><Input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} /></div>
              <div><label className="text-xs font-bold">المورد</label>
                <Select value={form.supplierId} onValueChange={(v) => setForm({ ...form, supplierId: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر المورد" /></SelectTrigger>
                  <SelectContent>{suppliers?.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><label className="text-xs font-bold">المنتجات</label><Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3" /> إضافة</Button></div>
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-xl">
                  <div className="col-span-4">
                    <Select value={String(item.productId)} onValueChange={(v) => updateItem(idx, "productId", v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="المنتج" /></SelectTrigger>
                      <SelectContent>{products?.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.nameAr}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><Input type="number" placeholder="الكمية" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} className="h-9" /></div>
                  <div className="col-span-2"><Input type="number" placeholder="السعر" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", e.target.value)} className="h-9" /></div>
                  <div className="col-span-2"><Input type="number" placeholder="قطع/طرد" value={item.unitsPerPurchaseUnit} onChange={(e) => updateItem(idx, "unitsPerPurchaseUnit", e.target.value)} className="h-9" /></div>
                  <div className="col-span-2"><Button variant="ghost" size="sm" className="text-red-600" onClick={() => removeItem(idx)}><Trash2 className="w-4 h-4" /></Button></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-bold">الخصم</label><Input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} /></div>
              <div><label className="text-xs font-bold">المدفوع</label><Input type="number" value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: Number(e.target.value) })} /></div>
              <div><label className="text-xs font-bold">طريقة الدفع</label>
                <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="cash">نقدي</SelectItem><SelectItem value="debt">آجل</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-xs font-bold">ملاحظات</label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button onClick={handleSubmit} className="w-full bg-[#713a24] hover:bg-[#60301e]" disabled={createPurchase.isPending}>
              {createPurchase.isPending ? "جاري الحفظ..." : "حفظ الفاتورة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-xl" dir="rtl">
          <DialogHeader><DialogTitle>تفاصيل الفاتورة {detail?.invoiceNumber}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <p><strong>المورد:</strong> {detail.supplier?.name}</p>
              <p><strong>الإجمالي:</strong> {detail.totalAmount.toLocaleString("ar-SY")} ل.س</p>
              <p><strong>المدفوع:</strong> {detail.paidAmount.toLocaleString("ar-SY")} ل.س</p>
              <p><strong>المتبقي:</strong> {detail.remainingAmount.toLocaleString("ar-SY")} ل.س</p>
              <Table>
                <TableHeader><TableRow><TableHead className="text-right">المنتج</TableHead><TableHead className="text-right">الكمية</TableHead><TableHead className="text-right">السعر</TableHead><TableHead className="text-right">الإجمالي</TableHead></TableRow></TableHeader>
                <TableBody>{detail.items?.map((it: any) => (
                  <TableRow key={it.id}><TableCell>{it.productName}</TableCell><TableCell>{it.quantity}</TableCell><TableCell>{it.unitPrice}</TableCell><TableCell>{it.totalPrice}</TableCell></TableRow>
                ))}</TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

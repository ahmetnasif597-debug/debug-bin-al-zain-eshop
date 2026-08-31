import { useInventory, useInventoryMovements } from "@/lib/api-client/accounting-hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Warehouse, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function InventoryPage() {
  const { data: products, isLoading: prodLoading } = useInventory();
  const { data: movements, isLoading: movLoading } = useInventoryMovements();

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#713a24] text-white">
          <Warehouse className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-black text-foreground">المخزون</h1>
      </div>

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60 font-bold flex items-center gap-2">
          <Warehouse className="w-4 h-4" /> المنتجات الحالية
        </div>
        {prodLoading ? <div className="p-6 space-y-3"><Skeleton className="h-12 w-full" /></div> : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="text-right text-xs font-bold">المنتج</TableHead>
                <TableHead className="text-right text-xs font-bold">SKU</TableHead>
                <TableHead className="text-right text-xs font-bold">الكمية</TableHead>
                <TableHead className="text-right text-xs font-bold">الحد الأدنى</TableHead>
                <TableHead className="text-right text-xs font-bold">سعر التكلفة</TableHead>
                <TableHead className="text-right text-xs font-bold">قيمة المخزون</TableHead>
                <TableHead className="text-right text-xs font-bold">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((p: any) => (
                <TableRow key={p.id} className="border-border/60 hover:bg-muted/30">
                  <TableCell className="text-sm font-bold">{p.nameAr}</TableCell>
                  <TableCell className="text-sm font-mono">{p.sku || "—"}</TableCell>
                  <TableCell className="text-sm">{p.stockQuantity.toLocaleString("ar-SY")}</TableCell>
                  <TableCell className="text-sm">{p.minimumStock.toLocaleString("ar-SY")}</TableCell>
                  <TableCell className="text-sm">{p.purchasePrice ? p.purchasePrice.toLocaleString("ar-SY") : "—"}</TableCell>
                  <TableCell className="text-sm font-bold">{p.inventoryValue.toLocaleString("ar-SY")}</TableCell>
                  <TableCell>
                    {p.stockQuantity <= p.minimumStock ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> منخفض
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">متوفر</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!products || products.length === 0) && (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">لا توجد منتجات</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60 font-bold">حركة المخزون</div>
        {movLoading ? <div className="p-6 space-y-3"><Skeleton className="h-12 w-full" /></div> : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="text-right text-xs font-bold">المنتج</TableHead>
                <TableHead className="text-right text-xs font-bold">النوع</TableHead>
                <TableHead className="text-right text-xs font-bold">الكمية</TableHead>
                <TableHead className="text-right text-xs font-bold">قبل</TableHead>
                <TableHead className="text-right text-xs font-bold">بعد</TableHead>
                <TableHead className="text-right text-xs font-bold">السبب</TableHead>
                <TableHead className="text-right text-xs font-bold">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements?.map((m: any) => (
                <TableRow key={m.id} className="border-border/60 hover:bg-muted/30">
                  <TableCell className="text-sm">{m.productName}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${m.movementType === "in" ? "bg-emerald-50 text-emerald-700" : m.movementType === "out" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                      {m.movementType === "in" ? "دخول" : m.movementType === "out" ? "خروج" : "تسوية"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-bold">{m.quantity.toLocaleString("ar-SY")} {m.unit}</TableCell>
                  <TableCell className="text-sm">{m.quantityBefore?.toLocaleString("ar-SY") || "—"}</TableCell>
                  <TableCell className="text-sm">{m.quantityAfter?.toLocaleString("ar-SY") || "—"}</TableCell>
                  <TableCell className="text-sm">{m.reason}</TableCell>
                  <TableCell className="text-sm">{format(new Date(m.createdAt), "yyyy/MM/dd HH:mm")}</TableCell>
                </TableRow>
              ))}
              {(!movements || movements.length === 0) && (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">لا توجد حركات</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

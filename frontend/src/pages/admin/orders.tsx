import React, { useState } from "react";
import { 
  useListOrders, 
  useUpdateOrderStatus,
  getListOrdersQueryKey,
  getGetAdminStatsQueryKey
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ChevronDown, ChevronUp, Phone, User } from "lucide-react";

const STATUS_MAP = {
  pending: { label: "معلق", color: "bg-yellow-500 hover:bg-yellow-600 text-white" },
  confirmed: { label: "مؤكد", color: "bg-blue-500 hover:bg-blue-600 text-white" },
  completed: { label: "مكتمل", color: "bg-green-500 hover:bg-green-600 text-white" },
  cancelled: { label: "ملغي", color: "bg-red-500 hover:bg-red-600 text-white" },
};

export default function AdminOrders() {
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const { data: orders, isLoading } = useListOrders(
    filter !== "all" ? { status: filter as "pending" | "confirmed" | "completed" | "cancelled" } : undefined
  );
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const updateStatusMutation = useUpdateOrderStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        toast({ title: "تم تحديث حالة الطلب" });
      }
    }
  });

  const handleStatusChange = (orderId: number, status: string) => {
    updateStatusMutation.mutate({ id: orderId, data: { status: status as "pending" | "confirmed" | "completed" | "cancelled" } });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-foreground">إدارة الطلبات</h1>

      <Tabs defaultValue="all" onValueChange={setFilter}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="pending">معلق</TabsTrigger>
          <TabsTrigger value="confirmed">مؤكد</TabsTrigger>
          <TabsTrigger value="completed">مكتمل</TabsTrigger>
          <TabsTrigger value="cancelled">ملغي</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead className="text-right">رقم الطلب</TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">العميل</TableHead>
              <TableHead className="text-right">المجموع</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">تحديث الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  لا توجد طلبات
                </TableCell>
              </TableRow>
            ) : orders?.map(order => (
              <React.Fragment key={order.id}>
                <TableRow
                  className={`cursor-pointer ${expandedId === order.id ? 'bg-muted/50' : ''}`}
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                >
                  <TableCell>
                    {expandedId === order.id
                      ? <ChevronUp className="w-5 h-5" />
                      : <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    }
                  </TableCell>
                  <TableCell className="font-bold">#{order.id}</TableCell>
                  <TableCell>{format(new Date(order.createdAt), 'yyyy/MM/dd HH:mm')}</TableCell>
                  <TableCell>{order.customerName ?? "—"}</TableCell>
                  <TableCell className="font-bold text-primary">
                    {order.totalPrice.toLocaleString('ar-SY')} ل.س
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_MAP[order.status as keyof typeof STATUS_MAP]?.color}>
                      {STATUS_MAP[order.status as keyof typeof STATUS_MAP]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Select 
                      value={order.status} 
                      onValueChange={v => handleStatusChange(order.id, v)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">معلق</SelectItem>
                        <SelectItem value="confirmed">مؤكد</SelectItem>
                        <SelectItem value="completed">مكتمل</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
                {expandedId === order.id && (
                  <TableRow className="bg-muted/20">
                    <TableCell colSpan={7} className="p-0">
                      <div className="p-6 grid md:grid-cols-2 gap-8 border-b border-border">
                        <div>
                          <h4 className="font-bold mb-4 flex items-center gap-2 text-primary">
                            <User className="w-4 h-4" /> معلومات العميل
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-3">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>{order.customerName ?? "غير محدد"}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span dir="ltr">{order.customerPhone ?? "غير محدد"}</span>
                            </div>
                            {order.notes && (
                              <div className="mt-4 p-3 bg-white/50 rounded-md border text-muted-foreground">
                                <strong>ملاحظات:</strong> {order.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold mb-4">تفاصيل الطلب</h4>
                          <div className="space-y-2">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-card p-3 rounded border border-border">
                                <div className="flex flex-col">
                                  <span className="font-bold">{item.nameAr}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {item.quantity} ×{" "}
                                    {item.selectedWeight
                                      ? `${item.selectedWeight >= 1000 ? item.selectedWeight / 1000 + " كيلو" : item.selectedWeight + " غ"}`
                                      : item.price.toLocaleString('ar-SY') + " ل.س"
                                    }
                                  </span>
                                </div>
                                <span className="font-bold">
                                  {(item.lineTotal ?? 0).toLocaleString('ar-SY')} ل.س
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-3 border-t border-border flex justify-between font-bold text-primary">
                            <span>المجموع</span>
                            <span>{order.totalPrice.toLocaleString('ar-SY')} ل.س</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

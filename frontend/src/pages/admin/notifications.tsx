import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Flame, BadgePercent, AlertTriangle, Trash2, Send, Users, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  useListAdminNotifications,
  useCreateNotification,
  useDeleteNotification,
  useListCustomers,
  getListAdminNotificationsQueryKey,
} from "@/lib/api-client";
import { format } from "date-fns";

const TYPE_OPTIONS = [
  { value: "offer", label: "عرض 🔥", icon: <Flame className="w-4 h-4 text-orange-500" />, badge: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "discount", label: "خصم 💰", icon: <BadgePercent className="w-4 h-4 text-green-600" />, badge: "bg-green-100 text-green-700 border-green-200" },
  { value: "warning", label: "تنبيه ⚠️", icon: <AlertTriangle className="w-4 h-4 text-amber-600" />, badge: "bg-amber-100 text-amber-700 border-amber-200" },
];

const TYPE_MAP: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  offer: { label: "عرض 🔥", badge: "bg-orange-100 text-orange-700 border-orange-200", icon: <Flame className="w-3.5 h-3.5" /> },
  discount: { label: "خصم 💰", badge: "bg-green-100 text-green-700 border-green-200", icon: <BadgePercent className="w-3.5 h-3.5" /> },
  warning: { label: "تنبيه ⚠️", badge: "bg-amber-100 text-amber-700 border-amber-200", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

export default function AdminNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [type, setType] = useState("offer");
  const [target, setTarget] = useState<"broadcast" | "targeted">("broadcast");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const { data: notifications, isLoading } = useListAdminNotifications();
  const { data: customers } = useListCustomers();
  const createMutation = useCreateNotification();
  const deleteMutation = useDeleteNotification();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast({ title: "العنوان والمحتوى مطلوبان", variant: "destructive" });
      return;
    }
    if (target === "targeted" && !selectedCustomerId) {
      toast({ title: "يرجى اختيار عميل", variant: "destructive" });
      return;
    }
    createMutation.mutate(
      {
        data: {
          type: type as "offer" | "discount" | "warning",
          title: title.trim(),
          body: body.trim(),
          customerId: target === "targeted" ? selectedCustomerId : null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminNotificationsQueryKey() });
          setTitle("");
          setBody("");
          setSelectedCustomerId(null);
          toast({ title: "✅ تم إرسال الإشعار بنجاح" });
        },
        onError: () => toast({ title: "حدث خطأ أثناء الإرسال", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminNotificationsQueryKey() });
          toast({ title: "تم حذف الإشعار" });
        },
      }
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground">مركز الإشعارات</h1>
          <p className="text-muted-foreground text-sm font-medium mt-0.5">أرسل إشعارات للعملاء المسجلين</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Compose Panel */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sticky top-6">
            <h2 className="text-lg font-black text-foreground mb-5">إنشاء إشعار جديد</h2>
            <form onSubmit={handleSend} className="space-y-5">

              {/* Type */}
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">نوع الإشعار</label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setType(opt.value)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all ${
                        type === opt.value
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target */}
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">المستهدف</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setTarget("broadcast"); setSelectedCustomerId(null); }}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                      target === "broadcast"
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    جميع العملاء
                  </button>
                  <button
                    type="button"
                    onClick={() => setTarget("targeted")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                      target === "targeted"
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    عميل محدد
                  </button>
                </div>
              </div>

              {/* Customer selector */}
              {target === "targeted" && (
                <div>
                  <label className="text-sm font-bold text-foreground mb-2 block">اختر العميل</label>
                  <select
                    value={selectedCustomerId ?? ""}
                    onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">— اختر عميلاً —</option>
                    {customers?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">عنوان الإشعار</label>
                <Input
                  placeholder="مثال: خصم 20% على القهوة العربية"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 rounded-xl"
                  maxLength={100}
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">نص الإشعار</label>
                <textarea
                  placeholder="اكتب تفاصيل الإشعار هنا..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-medium text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1 text-left font-mono">{body.length}/500</p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-bold gap-2 text-base"
                disabled={createMutation.isPending}
              >
                <Send className="w-4 h-4" />
                {createMutation.isPending ? "جارٍ الإرسال..." : "إرسال الإشعار"}
              </Button>
            </form>
          </div>
        </div>

        {/* Notifications List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-foreground">الإشعارات المُرسَلة</h2>
            {notifications && (
              <span className="text-sm text-muted-foreground font-medium">{notifications.length} إشعار</span>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-medium">جارٍ التحميل...</p>
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="font-bold text-foreground mb-1">لا توجد إشعارات مُرسَلة</p>
              <p className="text-sm text-muted-foreground font-medium">أنشئ إشعارك الأول من الجانب الأيسر</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => {
                const cfg = TYPE_MAP[n.type] ?? TYPE_MAP.warning;
                return (
                  <div
                    key={n.id}
                    className="bg-card rounded-2xl border border-border p-5 flex items-start gap-4 hover:shadow-sm transition-shadow"
                  >
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${cfg.badge}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        {n.customerId ? (
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {n.customerName ?? `عميل #${n.customerId}`}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            جميع العملاء
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground font-medium mr-auto">
                          {format(new Date(n.createdAt), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                      <p className="font-black text-foreground text-sm">{n.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{n.body}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(n.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex-shrink-0"
                      title="حذف الإشعار"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

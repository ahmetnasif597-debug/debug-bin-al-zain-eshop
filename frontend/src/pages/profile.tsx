import { useState } from "react";
import { useLocation } from "wouter";
import { UserCircle2, Package, Settings, LogOut, ChevronDown, ChevronUp, CheckCircle2, Clock, XCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  useGetAuthMe,
  useUpdateProfile,
  useGetMyOrders,
  useLogoutCustomer,
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { getGetAuthMeQueryKey, getGetMyOrdersQueryKey } from "@/lib/api-client";

type Tab = "profile" | "orders";

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: "قيد الانتظار",
    color: "text-amber-600 bg-amber-50 border-amber-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  confirmed: {
    label: "مؤكد",
    color: "text-blue-600 bg-blue-50 border-blue-200",
    icon: <Truck className="w-3.5 h-3.5" />,
  },
  completed: {
    label: "مكتمل",
    color: "text-green-600 bg-green-50 border-green-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: "ملغى",
    color: "text-red-600 bg-red-50 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-SY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatWeight(w: number | null | undefined) {
  if (!w) return null;
  return w >= 1000 ? `${w / 1000} كيلو` : `${w} غ`;
}

function OrderCard({ order }: { order: { id: number; status: string; createdAt: string; totalPrice: number; items: { productId: number; nameAr: string; price: number; quantity: number; selectedWeight?: number | null; lineTotal?: number | null }[]; notes?: string | null } }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_MAP[order.status] ?? STATUS_MAP.pending;

  return (
    <div className="bg-background border border-border rounded-2xl overflow-hidden transition-shadow hover:shadow-md">
      <button
        className="w-full p-5 flex items-center justify-between gap-4 text-right"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-black text-foreground text-base">طلب #{order.id}</p>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${status.color}`}>
            {status.icon}
            {status.label}
          </span>
          <span className="font-black text-primary text-base whitespace-nowrap">
            {order.totalPrice.toLocaleString("ar-SY")} <span className="text-xs font-normal text-muted-foreground">ل.س</span>
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-3">
          <h4 className="text-sm font-bold text-muted-foreground mb-3">المنتجات المطلوبة</h4>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center text-xs font-bold text-primary">
                    {item.quantity}×
                  </span>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{item.nameAr}</p>
                    {item.selectedWeight && (
                      <p className="text-xs text-muted-foreground mt-0.5">الوزن: {formatWeight(item.selectedWeight)}</p>
                    )}
                  </div>
                </div>
                <span className="font-bold text-sm text-primary">
                  {(item.lineTotal ?? item.price * item.quantity).toLocaleString("ar-SY")} ل.س
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border font-black text-base">
            <span className="text-muted-foreground">المجموع الكلي</span>
            <span className="text-primary">{order.totalPrice.toLocaleString("ar-SY")} ل.س</span>
          </div>
          {order.notes && (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl px-4 py-2 mt-2">
              <span className="font-bold">ملاحظات:</span> {order.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customer, isLoading: loadingCustomer, isError: authError } = useGetAuthMe();
  const { data: orders, isLoading: loadingOrders } = useGetMyOrders();
  const updateProfile = useUpdateProfile();
  const logoutMutation = useLogoutCustomer();

  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (loadingCustomer && !authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!customer || authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
        <UserCircle2 className="w-20 h-20 text-primary/30" />
        <div>
          <h2 className="text-2xl font-black text-foreground mb-2">يجب تسجيل الدخول</h2>
          <p className="text-muted-foreground font-medium">سجّل دخولك لعرض ملفك الشخصي وسجل طلباتك</p>
        </div>
        <Button size="lg" className="font-bold px-10" onClick={() => setLocation("/login")}>
          تسجيل الدخول
        </Button>
      </div>
    );
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAuthMeQueryKey() });
        setLocation("/");
        toast({ title: "تم تسجيل الخروج بنجاح" });
      },
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast({ title: "كلمتا المرور غير متطابقتين", variant: "destructive" });
      return;
    }
    const payload: { fullName?: string | null; phone?: string | null; currentPassword?: string | null; newPassword?: string | null } = {};
    if (editName.trim()) payload.fullName = editName.trim();
    if (editPhone.trim()) payload.phone = editPhone.trim();
    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }
    if (!payload.fullName && !payload.phone && !payload.newPassword) {
      toast({ title: "لم تقم بأي تغيير", variant: "destructive" });
      return;
    }
    updateProfile.mutate(
      { data: payload },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAuthMeQueryKey() });
          setEditName("");
          setEditPhone("");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          toast({ title: "✅ تم تحديث الملف الشخصي بنجاح" });
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "حدث خطأ، يرجى المحاولة مجدداً";
          toast({ title: msg, variant: "destructive" });
        },
      }
    );
  };

  const joinDate = (customer as { createdAt?: string }).createdAt ? formatDate((customer as { createdAt: string }).createdAt) : "—";

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen max-w-4xl">

      {/* Profile Header Card */}
      <div className="bg-card rounded-3xl border border-border shadow-md p-6 md:p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-40 h-40 bg-primary/5 rounded-br-full pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center flex-shrink-0 shadow-inner">
            <UserCircle2 className="w-14 h-14 text-primary" />
          </div>
          <div className="text-center sm:text-right flex-1">
            <h1 className="text-3xl font-black text-foreground mb-1">{customer.fullName}</h1>
            <p className="text-muted-foreground font-medium font-sans" dir="ltr">{customer.email}</p>
            <p className="text-muted-foreground text-sm font-medium mt-1">📞 {customer.phone}</p>
            <p className="text-muted-foreground text-xs mt-2">عضو منذ {joinDate}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 font-bold text-muted-foreground hover:text-destructive hover:border-destructive/50 flex-shrink-0"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Button>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-border">
          <div className="text-center p-4 bg-background rounded-2xl border border-border">
            <p className="text-3xl font-black text-primary">{orders?.length ?? "—"}</p>
            <p className="text-sm text-muted-foreground font-medium mt-1">إجمالي الطلبات</p>
          </div>
          <div className="text-center p-4 bg-background rounded-2xl border border-border">
            <p className="text-3xl font-black text-primary">
              {orders ? orders.filter((o) => o.status === "completed").length : "—"}
            </p>
            <p className="text-sm text-muted-foreground font-medium mt-1">طلبات مكتملة</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-muted/50 p-1.5 rounded-2xl border border-border">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
            activeTab === "profile"
              ? "bg-card shadow text-foreground border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="w-4 h-4" />
          تعديل الملف الشخصي
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
            activeTab === "orders"
              ? "bg-card shadow text-foreground border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="w-4 h-4" />
          شو أخذت من الموقع
          {orders && orders.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
              {orders.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <div className="bg-card rounded-3xl border border-border shadow-md p-6 md:p-8">
          <h2 className="text-xl font-black text-foreground mb-6">تعديل البيانات الشخصية</h2>
          <form onSubmit={handleSaveProfile} className="space-y-8">

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">
                المعلومات الأساسية
              </h3>
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">الاسم الكامل</label>
                <Input
                  placeholder={customer.fullName}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-12 rounded-xl font-medium"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">رقم الهاتف</label>
                <Input
                  placeholder={customer.phone}
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="h-12 rounded-xl font-medium font-sans"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password Change */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">
                تغيير كلمة المرور
              </h3>
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">كلمة المرور الحالية</label>
                <Input
                  type="password"
                  placeholder="أدخل كلمة المرور الحالية"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-12 rounded-xl font-medium"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">كلمة المرور الجديدة</label>
                <Input
                  type="password"
                  placeholder="6 أحرف على الأقل"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-12 rounded-xl font-medium"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">تأكيد كلمة المرور الجديدة</label>
                <Input
                  type="password"
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 rounded-xl font-medium"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-13 font-bold text-base rounded-xl"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
            </Button>
          </form>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">جارٍ تحميل الطلبات...</p>
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="bg-card rounded-3xl border border-border shadow-md p-12 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-3">ما طلبتي شي بعد!</h3>
              <p className="text-muted-foreground font-medium mb-8 max-w-sm mx-auto">
                اكتشف منتجاتنا المميزة من بن وقهوة ومكسرات وأكثر
              </p>
              <Button size="lg" className="font-bold px-10" onClick={() => setLocation("/products")}>
                تصفح المنتجات
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-black text-foreground">سجل طلباتك</h2>
                <span className="text-sm text-muted-foreground font-medium">{orders.length} طلب</span>
              </div>
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

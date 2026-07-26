import { useState } from "react";
import { useLocation } from "wouter";
import { UserCircle2, Settings, LogOut, Package, Download } from "lucide-react";
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
import { getGetAuthMeQueryKey } from "@/lib/api-client";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-SY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customer, isLoading: loadingCustomer, isError: authError } = useGetAuthMe();
  const { data: orders } = useGetMyOrders();
  const updateProfile = useUpdateProfile();
  const logoutMutation = useLogoutCustomer();

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleApkDownload = () => {
    const a = document.createElement("a");
    a.href = encodeURI("/متجر الزين.apk");
    a.download = "متجر الزين.apk";
    a.click();
  };

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
          <p className="text-muted-foreground font-medium">سجّل دخولك لعرض ملفك الشخصي</p>
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

        <div className="relative z-10 mt-4">
          <button
            onClick={() => setLocation("/orders")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
          >
            <Package className="w-4 h-4" />
            عرض سجل الطلبات
          </button>
        </div>

        <div className="relative z-10 mt-3 md:hidden">
          <button
            onClick={handleApkDownload}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm"
            style={{ backgroundColor: "#3b1f0e", color: "#e8d5b0" }}
          >
            <Download className="w-4 h-4" />
            تحميل تطبيق متجر الزين
          </button>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-md p-6 md:p-8">
        <h2 className="text-xl font-black text-foreground mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          تعديل البيانات الشخصية
        </h2>
        <form onSubmit={handleSaveProfile} className="space-y-8">

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
    </div>
  );
}

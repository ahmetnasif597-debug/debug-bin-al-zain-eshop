import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Lock, LogIn, UserPlus, Eye, EyeOff } from "lucide-react";

type Tab = "login" | "register";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [loginForm, setLoginForm] = useState({ phone: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ fullName: "", phone: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "خطأ في تسجيل الدخول", variant: "destructive" });
      } else {
        toast({ title: `أهلاً بك، ${data.fullName}!` });
        navigate("/");
      }
    } catch {
      toast({ title: "خطأ في الاتصال بالخادم", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password.length < 6) {
      toast({ title: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(registerForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "خطأ في إنشاء الحساب", variant: "destructive" });
      } else {
        toast({ title: "تم إنشاء حسابك بنجاح!", description: `أهلاً بك ${data.fullName}` });
        navigate("/");
      }
    } catch {
      toast({ title: "خطأ في الاتصال بالخادم", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background py-12 px-4">
      <div className="w-full max-w-md">

        {/* Logo & Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <img src="/images/logo-transparent.png" alt="بن الزين" className="w-28 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium text-sm">مذاق القهوة الأصلية</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden"
        >
          {/* Tab Switcher */}
          <div className="flex relative">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative z-10 ${
                tab === "login" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LogIn className="w-4 h-4" />
              تسجيل الدخول
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative z-10 ${
                tab === "register" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              إنشاء حساب
            </button>
            {/* Sliding indicator */}
            <motion.div
              className="absolute bottom-0 h-0.5 bg-primary rounded-full"
              animate={{ right: tab === "login" ? "50%" : "0%", width: "50%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {/* Login Form */}
              {tab === "login" && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleLogin}
                  className="space-y-5"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-foreground">مرحباً بك</h2>
                    <p className="text-muted-foreground text-sm mt-1">سجّل دخولك للمتابعة</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">رقم الهاتف</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="09xxxxxxxx"
                        className="pr-10"
                        dir="ltr"
                        required
                        value={loginForm.phone}
                        onChange={e => setLoginForm({ ...loginForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10 pl-10"
                        required
                        value={loginForm.password}
                        onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full font-bold h-11 text-base" disabled={loading}>
                    {loading ? "جاري الدخول..." : "تسجيل الدخول"}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    ليس لديك حساب؟{" "}
                    <button type="button" onClick={() => setTab("register")} className="text-primary font-bold hover:underline">
                      أنشئ حساباً
                    </button>
                  </p>
                </motion.form>
              )}

              {/* Register Form */}
              {tab === "register" && (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleRegister}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-foreground">إنشاء حساب جديد</h2>
                    <p className="text-muted-foreground text-sm mt-1">انضم إلى عائلة بن الزين</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">الاسم الكامل</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="محمد أحمد"
                        className="pr-10"
                        required
                        value={registerForm.fullName}
                        onChange={e => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">رقم الهاتف</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="09xxxxxxxx"
                        className="pr-10"
                        dir="ltr"
                        required
                        value={registerForm.phone}
                        onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="6 أحرف على الأقل"
                        className="pr-10 pl-10"
                        required
                        minLength={6}
                        value={registerForm.password}
                        onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full font-bold h-11 text-base mt-2" disabled={loading}>
                    {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    لديك حساب بالفعل؟{" "}
                    <button type="button" onClick={() => setTab("login")} className="text-primary font-bold hover:underline">
                      سجّل دخولك
                    </button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Decorative text */}
        <p className="text-center text-primary/40 mt-6 text-xl">❋ ❋ ❋</p>
      </div>
    </div>
  );
}

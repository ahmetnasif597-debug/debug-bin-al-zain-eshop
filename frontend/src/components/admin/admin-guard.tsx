import { useState } from "react";
import { useAdmin } from "@/context/admin-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading, login } = useAdmin();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        await login(password);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-md bg-card p-8 rounded-3xl shadow-lg border border-border text-center">
          <div className="text-primary font-black text-4xl mb-2">بن الزين</div>
          <h1 className="text-2xl font-bold text-foreground mb-8">تسجيل الدخول للإدارة</h1>
          {/* Default password is binalzain2024 */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 text-center text-lg"
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "دخول"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

import { createContext, useContext, ReactNode } from "react";
import { useAdminMe, useAdminLogin, useAdminLogout, getAdminMeQueryKey } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading: isMeLoading, isError } = useAdminMe({
    query: {
      queryKey: getAdminMeQueryKey(),
      retry: false,
      refetchOnWindowFocus: false,
    },
  });
  const loginMutation = useAdminLogin();
  const logoutMutation = useAdminLogout();
  const { toast } = useToast();

  const isAdmin = !isError && !!data?.authenticated;

  const login = async (password: string) => {
    try {
      await loginMutation.mutateAsync({ data: { password } });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
      toast({ title: "تم تسجيل الدخول بنجاح" });
    } catch (error) {
      toast({ title: "كلمة المرور غير صحيحة", variant: "destructive" });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
      toast({ title: "تم تسجيل الخروج" });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AdminContext.Provider value={{ isAdmin, isLoading: isMeLoading, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}

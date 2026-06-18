import { useState, useMemo } from "react";
import { useListCustomers, getListCustomersQueryKey } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2, Phone, Mail, Calendar, Hash, User, Eye, KeyRound, Search } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function AdminCustomers() {
  const { data: customers, isLoading } = useListCustomers();
  const [selected, setSelected] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [pwCustomer, setPwCustomer] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const { toast } = useToast();

  const filtered = useMemo(() => {
    if (!customers) return [];
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  const openPasswordDialog = (customer: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewPassword("");
    setPwError("");
    setPwCustomer(customer);
  };

  const handlePasswordReset = async () => {
    if (!newPassword.trim()) {
      setPwError("خطأ! حقل كلمة السر لا يمكن أن يكون فارغاً.");
      return;
    }
    if (!confirm(`هل أنت متأكد من تغيير كلمة السر لهذا الزبون؟\n\n${pwCustomer?.fullName}`)) return;
    setPwLoading(true);
    setPwError("");
    try {
      const res = await fetch(`/api/admin/customers/${pwCustomer.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error ?? "Failed to update password.");
        return;
      }
      toast({ title: "Success! The password has been updated." });
      setPwCustomer(null);
      setNewPassword("");
    } catch {
      setPwError("Network error. Please try again.");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-black text-foreground">إدارة كلمات سر الزبائن</h1>
        {!isLoading && (
          <div className="flex items-center gap-2 bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl">
            <Users className="w-5 h-5" />
            <span>{customers?.length ?? 0} {customers?.length === 1 ? "زبون" : "الزبائن المسجلين"}</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="ابحث عن الزبائن بالاسم أو الرقم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10 h-11 rounded-xl"
        />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">#</TableHead>
              <TableHead className="text-right">اسم الزبون</TableHead>
              <TableHead className="text-right">رقم الهاتف</TableHead>
              <TableHead className="text-right">حالة الحساب</TableHead>
              <TableHead className="text-right">تغيير كلمة السر</TableHead>
              <TableHead className="text-right">التفاصيل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filtered.length > 0 ? (
              filtered.map((customer, idx) => (
                <TableRow
                  key={customer.id}
                  className="hover:bg-muted/30 cursor-pointer"
                  onClick={() => setSelected(customer)}
                >
                  <TableCell className="text-muted-foreground font-medium">{idx + 1}</TableCell>
                  <TableCell className="font-bold">{customer.fullName}</TableCell>
                  <TableCell>
                    <span className="font-sans" dir="ltr">{customer.phone}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-xs font-bold">
                      نشط
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-primary border-primary/30 hover:border-primary hover:bg-primary/5"
                      onClick={(e) => openPasswordDialog(customer, e)}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      تغيير كلمة السر
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-primary hover:text-primary"
                      onClick={(e) => { e.stopPropagation(); setSelected(customer); }}
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{search ? "لا يوجد زبائن مطابقون للبحث." : "لا يوجد زبائن مسجلون حتى الآن."}</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Customer Detail Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              بيانات الحساب
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5 mt-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-black text-primary">
                    {selected.fullName?.charAt(0) ?? "?"}
                  </span>
                </div>
                <div>
                  <p className="text-xl font-black text-foreground">{selected.fullName}</p>
                  <Badge variant="outline" className="text-xs mt-1 text-green-600 border-green-300 bg-green-50">
                    حساب نشط
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 bg-muted/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Hash className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">رقم الحساب</p>
                    <p className="font-bold text-sm">#{selected.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">رقم الهاتف</p>
                    <a href={`tel:${selected.phone}`} className="font-bold text-sm font-sans hover:text-primary transition-colors" dir="ltr">
                      {selected.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-bold text-sm font-sans break-all" dir="ltr">{selected.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">تاريخ التسجيل</p>
                    <p className="font-bold text-sm">
                      {format(new Date(selected.createdAt), 'dd / MM / yyyy — HH:mm')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-2"
                  onClick={() => window.open(`https://wa.me/${selected.phone.replace(/^0/, '963')}`, '_blank')}
                >
                  واتساب
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2 text-primary border-primary/30"
                  onClick={(e) => { setSelected(null); openPasswordDialog(selected, e as any); }}
                >
                  <KeyRound className="w-4 h-4" />
                  تغيير كلمة السر
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={!!pwCustomer} onOpenChange={(open) => { if (!open) setPwCustomer(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              تغيير كلمة السر
            </DialogTitle>
          </DialogHeader>
          {pwCustomer && (
            <div className="space-y-4 mt-1">
              <div className="bg-muted/40 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الزبون</p>
                  <p className="font-bold text-sm">{pwCustomer.fullName}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">
                  أدخل كلمة السر الجديدة لهذا الزبون:
                </label>
                <Input
                  type="password"
                  placeholder="كلمة السر الجديدة..."
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPwError(""); }}
                  className="h-11 rounded-xl"
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordReset()}
                />
                {pwError && (
                  <p className="text-destructive text-xs font-bold mt-2 flex items-center gap-1">
                    ⚠ {pwError}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setPwCustomer(null)}
              disabled={pwLoading}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              onClick={handlePasswordReset}
              disabled={pwLoading}
              className="flex-1 gap-2"
            >
              {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

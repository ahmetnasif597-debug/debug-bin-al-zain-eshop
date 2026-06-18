import { useRef, useState } from "react";
import { 
  useListCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory,
  getListCategoriesQueryKey,
  getGetAdminStatsQueryKey
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Loader2, Image as ImageIcon, Rows2, Upload, X } from "lucide-react";

async function uploadImageToStorage(file: File): Promise<string> {
  const metaRes = await fetch("/api/storage/uploads/request-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "image/jpeg" }),
  });
  if (!metaRes.ok) throw new Error("فشل في طلب رابط الرفع");
  const { uploadURL, objectPath } = await metaRes.json() as { uploadURL: string; objectPath: string };
  const putRes = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "image/jpeg" },
  });
  if (!putRes.ok) throw new Error("فشل في رفع الصورة");
  return `/api/storage${objectPath}`;
}

export default function AdminCategories() {
  const { data: categories, isLoading } = useListCategories();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadPreview, setUploadPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setUploadPreview(localPreview);
    setIsUploading(true);
    try {
      const servingUrl = await uploadImageToStorage(file);
      setFormData(prev => ({ ...prev, imageUrl: servingUrl }));
      setUploadPreview(servingUrl);
      toast({ title: "تم رفع الصورة بنجاح" });
    } catch {
      toast({ title: "فشل رفع الصورة", variant: "destructive" });
      setUploadPreview("");
    } finally {
      setIsUploading(false);
    }
  };

  const createMutation = useCreateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        toast({ title: "تم إضافة الفئة بنجاح" });
        setIsOpen(false);
      }
    }
  });
  
  const updateMutation = useUpdateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
        toast({ title: "تم تعديل الفئة بنجاح" });
        setIsOpen(false);
      }
    }
  });

  const deleteMutation = useDeleteCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        toast({ title: "تم حذف الفئة" });
      }
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nameAr: "",
    nameEn: "",
    slug: "",
    icon: "",
    imageUrl: "",
    rowNumber: 1
  });

  const handleOpen = (cat?: any) => {
    if (cat) {
      setEditingId(cat.id);
      setFormData({
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        slug: cat.slug,
        icon: cat.icon || "",
        imageUrl: cat.imageUrl || "",
        rowNumber: cat.rowNumber ?? 1
      });
      setUploadPreview(cat.imageUrl || "");
    } else {
      setEditingId(null);
      setFormData({ nameAr: "", nameEn: "", slug: "", icon: "", imageUrl: "", rowNumber: 1 });
      setUploadPreview("");
    }
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate({ data: formData });
    }
  };

  const row1 = categories?.filter(c => (c.rowNumber ?? 1) === 1) ?? [];
  const row2 = categories?.filter(c => (c.rowNumber ?? 1) === 2) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-foreground">إدارة الفئات</h1>
        <Button onClick={() => handleOpen()} className="gap-2 font-bold">
          <Plus className="w-5 h-5" /> إضافة فئة
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* Row 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Rows2 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-black text-muted-foreground uppercase tracking-wider">الصف الأول</h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{row1.length} فئات</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {row1.map(cat => <CategoryCard key={cat.id} cat={cat} onEdit={handleOpen} onDelete={id => deleteMutation.mutate({ id })} />)}
              {row1.length === 0 && <p className="text-sm text-muted-foreground col-span-full py-4">لا توجد فئات في هذا الصف</p>}
            </div>
          </div>

          {/* Row 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Rows2 className="w-4 h-4 text-secondary" />
              <h2 className="text-sm font-black text-muted-foreground uppercase tracking-wider">الصف الثاني</h2>
              <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-bold">{row2.length} فئات</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {row2.map(cat => <CategoryCard key={cat.id} cat={cat} onEdit={handleOpen} onDelete={id => deleteMutation.mutate({ id })} />)}
              {row2.length === 0 && <p className="text-sm text-muted-foreground col-span-full py-4">لا توجد فئات في هذا الصف</p>}
            </div>
          </div>
        </>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "تعديل الفئة" : "إضافة فئة جديدة"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>الاسم (عربي)</Label>
              <Input required value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>الاسم (إنكليزي)</Label>
              <Input required value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>المعرف (Slug - إنكليزي بدون مسافات)</Label>
              <Input required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>أيقونة إيموجي (اختياري)</Label>
                <Input value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} placeholder="☕" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Rows2 className="w-3.5 h-3.5" />
                  الصف في الرئيسية
                </Label>
                <Select
                  value={formData.rowNumber.toString()}
                  onValueChange={v => setFormData({...formData, rowNumber: Number(v)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">الصف الأول</SelectItem>
                    <SelectItem value="2">الصف الثاني</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>صورة الفئة</Label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
              />
              {uploadPreview ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border bg-muted/20">
                  <img src={uploadPreview} alt="معاينة" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setUploadPreview(""); setFormData(prev => ({ ...prev, imageUrl: "" })); }}
                    className="absolute top-2 left-2 bg-background/80 hover:bg-background rounded-full p-1 shadow transition-colors"
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-2 left-2 bg-background/80 hover:bg-background text-xs font-bold px-3 py-1.5 rounded-lg shadow flex items-center gap-1.5 transition-colors"
                  >
                    {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    تغيير الصورة
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/40 flex flex-col items-center justify-center gap-2 transition-all"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">جاري الرفع...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">اضغط لرفع صورة</span>
                      <span className="text-xs text-muted-foreground/60">JPG، PNG، WebP</span>
                    </>
                  )}
                </button>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>إلغاء</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "تعديل" : "إضافة"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryCard({ cat, onEdit, onDelete }: { cat: any; onEdit: (c: any) => void; onDelete: (id: number) => void }) {
  return (
    <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
      <div className="aspect-[2/1] bg-muted/20 relative">
        {cat.imageUrl ? (
          <img src={cat.imageUrl} alt={cat.nameAr} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageIcon className="w-8 h-8 opacity-20" />
          </div>
        )}
        {cat.icon && (
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur rounded-full w-8 h-8 flex items-center justify-center shadow-sm">
            {cat.icon}
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge variant={(cat.rowNumber ?? 1) === 1 ? "default" : "secondary"} className="text-xs">
            صف {cat.rowNumber ?? 1}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 text-center">
        <h3 className="font-black text-lg mb-1">{cat.nameAr}</h3>
        <p className="text-xs text-muted-foreground font-mono">{cat.slug}</p>
        <div className="mt-2 text-sm text-primary font-medium">{cat.productCount || 0} منتجات</div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button variant="outline" className="flex-1 gap-2" onClick={() => onEdit(cat)}>
          <Edit2 className="w-4 h-4" /> تعديل
        </Button>
        <Button variant="destructive" className="flex-1 gap-2" onClick={() => {
          if (confirm("هل أنت متأكد من الحذف؟")) onDelete(cat.id);
        }}>
          <Trash2 className="w-4 h-4" /> حذف
        </Button>
      </CardFooter>
    </Card>
  );
}

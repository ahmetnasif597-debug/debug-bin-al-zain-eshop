import { useRef, useState } from "react";
import {
  useListBanners,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
  getListBannersQueryKey,
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Loader2, Image as ImageIcon, Upload, X } from "lucide-react";

async function uploadImageToStorage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/storage/uploads", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? "فشل في رفع الصورة");
  }
  const { url } = await res.json() as { url: string };
  return url;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  return "حدث خطأ غير متوقع، حاول مرة أخرى";
}

export default function AdminBanners() {
  const { data: banners, isLoading } = useListBanners();
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
    } catch (err) {
      toast({ title: "فشل رفع الصورة", description: getErrorMessage(err), variant: "destructive" });
      setUploadPreview("");
    } finally {
      setIsUploading(false);
    }
  };

  const createMutation = useCreateBanner({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() });
        toast({ title: "تم إضافة البانر بنجاح" });
        setIsOpen(false);
      },
      onError: (err) => {
        toast({ title: "فشل في إضافة البانر", description: getErrorMessage(err), variant: "destructive" });
      },
    }
  });

  const updateMutation = useUpdateBanner({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() });
        toast({ title: "تم تعديل البانر بنجاح" });
        setIsOpen(false);
      },
      onError: (err) => {
        toast({ title: "فشل في تعديل البانر", description: getErrorMessage(err), variant: "destructive" });
      },
    }
  });

  const deleteMutation = useDeleteBanner({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() });
        toast({ title: "تم حذف البانر" });
      },
      onError: (err) => {
        toast({ title: "فشل في حذف البانر", description: getErrorMessage(err), variant: "destructive" });
      },
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "",
    link: "",
  });

  const handleOpen = (banner?: any) => {
    if (banner) {
      setEditingId(banner.id);
      setFormData({
        title: banner.title,
        imageUrl: banner.imageUrl || "",
        link: banner.link || "",
      });
      setUploadPreview(banner.imageUrl || "");
    } else {
      setEditingId(null);
      setFormData({ title: "", imageUrl: "", link: "" });
      setUploadPreview("");
    }
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({ title: "الرجاء إدخال عنوان البانر", variant: "destructive" });
      return;
    }
    if (!formData.link.trim()) {
      toast({ title: "الرجاء إدخال رابط البانر", variant: "destructive" });
      return;
    }
    if (!formData.imageUrl.trim()) {
      toast({ title: "الرجاء رفع صورة للبانر", variant: "destructive" });
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate({ data: formData });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-foreground">إدارة البانرات</h1>
        <Button onClick={() => handleOpen()} className="gap-2 font-bold">
          <Plus className="w-5 h-5" /> إضافة بانر
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {banners?.map(banner => (
            <BannerCard
              key={banner.id}
              banner={banner}
              onEdit={handleOpen}
              onDelete={id => deleteMutation.mutate({ id })}
            />
          ))}
          {banners?.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full py-4">لا توجد بانرات مضافة بعد</p>
          )}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "تعديل البانر" : "إضافة بانر جديد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الرابط (عند الضغط على البانر)</Label>
              <Input
                required
                value={formData.link}
                onChange={e => setFormData({ ...formData, link: e.target.value })}
                placeholder="/products/12 أو /products?category=3"
              />
            </div>
            <div className="space-y-2">
              <Label>صورة البانر</Label>
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
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || isUploading}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                {editingId ? "تعديل" : "إضافة"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BannerCard({ banner, onEdit, onDelete }: { banner: any; onEdit: (b: any) => void; onDelete: (id: number) => void }) {
  return (
    <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
      <div className="aspect-video bg-muted/20 relative">
        {banner.imageUrl ? (
          <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageIcon className="w-8 h-8 opacity-20" />
          </div>
        )}
      </div>
      <CardContent className="p-4 text-center">
        <h3 className="font-black text-lg mb-1">{banner.title}</h3>
        <p className="text-xs text-muted-foreground font-mono truncate">{banner.link}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button variant="outline" className="flex-1 gap-2" onClick={() => onEdit(banner)}>
          <Edit2 className="w-4 h-4" /> تعديل
        </Button>
        <Button variant="destructive" className="flex-1 gap-2" onClick={() => {
          if (confirm("هل أنت متأكد من الحذف؟")) onDelete(banner.id);
        }}>
          <Trash2 className="w-4 h-4" /> حذف
        </Button>
      </CardFooter>
    </Card>
  );
}

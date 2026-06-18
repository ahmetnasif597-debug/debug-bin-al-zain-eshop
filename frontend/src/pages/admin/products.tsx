import { useState, useRef } from "react";
import { 
  useListProducts, 
  useListCategories, 
  useCreateProduct, 
  useUpdateProduct, 
  useDeleteProduct,
  getListProductsQueryKey,
  getGetAdminStatsQueryKey
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Edit2, Trash2, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";

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

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useListProducts();
  const { data: categories } = useListCategories();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createMutation = useCreateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        toast({ title: "تم إضافة المنتج بنجاح" });
        setIsOpen(false);
      }
    }
  });
  
  const updateMutation = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        toast({ title: "تم تعديل المنتج بنجاح" });
        setIsOpen(false);
      }
    }
  });

  const deleteMutation = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        toast({ title: "تم حذف المنتج" });
      }
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadPreview, setUploadPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "يرجى اختيار صورة صالحة", variant: "destructive" });
      return;
    }
    setUploadPreview(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const url = await uploadImageToStorage(file);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch {
      toast({ title: "فشل في رفع الصورة", variant: "destructive" });
      setUploadPreview("");
    } finally {
      setIsUploading(false);
    }
  };

  const [formData, setFormData] = useState({
    nameAr: "",
    nameEn: "",
    descriptionAr: "",
    price: "",
    unit: "كيلو",
    categoryId: "",
    imageUrl: "",
    inStock: true,
    isFeatured: false,
    soldByWeight: false,
    availableWeights: [] as number[],
    allowCustomWeight: false,
    availableFlavorsText: "",
  });

  const handleOpen = (product?: any) => {
    if (product) {
      setEditingId(product.id);
      setUploadPreview(product.imageUrl || "");
      setFormData({
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        descriptionAr: product.descriptionAr || "",
        price: product.price.toString(),
        unit: product.unit,
        categoryId: product.categoryId.toString(),
        imageUrl: product.imageUrl || "",
        inStock: product.inStock,
        isFeatured: product.isFeatured || false,
        soldByWeight: product.soldByWeight,
        availableWeights: product.availableWeights || [],
        allowCustomWeight: product.allowCustomWeight || false,
        availableFlavorsText: (product.availableFlavors || []).join(", "),
      });
    } else {
      setEditingId(null);
      setUploadPreview("");
      setFormData({
        nameAr: "",
        nameEn: "",
        descriptionAr: "",
        price: "",
        unit: "كيلو",
        categoryId: categories?.[0]?.id.toString() || "",
        imageUrl: "",
        inStock: true,
        isFeatured: false,
        soldByWeight: false,
        availableWeights: [],
        allowCustomWeight: false,
        availableFlavorsText: "",
      });
    }
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const availableFlavors = formData.availableFlavorsText
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    const data = {
      ...formData,
      price: Number(formData.price),
      categoryId: Number(formData.categoryId),
      availableFlavors: availableFlavors.length > 0 ? availableFlavors : null,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const toggleWeight = (weight: number) => {
    setFormData(prev => ({
      ...prev,
      availableWeights: prev.availableWeights.includes(weight)
        ? prev.availableWeights.filter(w => w !== weight)
        : [...prev.availableWeights, weight].sort((a, b) => a - b)
    }));
  };

  const filteredProducts = products?.filter(p => p.nameAr.includes(search)) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-foreground">إدارة المنتجات</h1>
        <Button onClick={() => handleOpen()} className="gap-2 font-bold">
          <Plus className="w-5 h-5" /> إضافة منتج
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-card p-2 rounded-xl border border-border">
        <Search className="w-5 h-5 text-muted-foreground ml-2" />
        <Input 
          placeholder="ابحث عن منتج..." 
          className="border-0 shadow-none focus-visible:ring-0" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الصورة</TableHead>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">الفئة</TableHead>
              <TableHead className="text-right">السعر</TableHead>
              <TableHead className="text-right">المخزون</TableHead>
              <TableHead className="text-right">مميز</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell>
              </TableRow>
            ) : filteredProducts.map(p => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.imageUrl ? <img src={p.imageUrl} className="w-12 h-12 rounded object-cover" /> : <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">صورة</div>}
                </TableCell>
                <TableCell className="font-bold">{p.nameAr}</TableCell>
                <TableCell>{p.categoryNameAr}</TableCell>
                <TableCell>{p.price.toLocaleString('ar-SY')} ل.س / {p.unit}</TableCell>
                <TableCell>
                  <Badge variant={p.inStock ? "default" : "destructive"}>
                    {p.inStock ? "متوفر" : "نفد"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {p.featured && <Badge variant="secondary">مميز</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpen(p)}>
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm("هل أنت متأكد من الحذف؟")) {
                        deleteMutation.mutate({ id: p.id });
                      }
                    }}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "تعديل منتج" : "إضافة منتج جديد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input required value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>الاسم (إنكليزي)</Label>
                <Input required value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>الوصف (عربي)</Label>
              <Textarea value={formData.descriptionAr} onChange={e => setFormData({...formData, descriptionAr: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>السعر (ل.س)</Label>
                <Input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>الوحدة</Label>
                <Select value={formData.unit} onValueChange={v => setFormData({...formData, unit: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="كيلو">كيلو</SelectItem>
                    <SelectItem value="قطعة">قطعة</SelectItem>
                    <SelectItem value="لتر">لتر</SelectItem>
                    <SelectItem value="علبة">علبة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الفئة</Label>
                <Select value={formData.categoryId} onValueChange={v => setFormData({...formData, categoryId: v})}>
                  <SelectTrigger><SelectValue placeholder="اختر فئة" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>صورة المنتج</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                />
                {uploadPreview || formData.imageUrl ? (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border bg-muted">
                    <img
                      src={uploadPreview || formData.imageUrl}
                      alt="معاينة الصورة"
                      className="w-full h-full object-cover"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => { setUploadPreview(""); setFormData(p => ({ ...p, imageUrl: "" })); }}
                      className="absolute top-2 left-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 left-2 px-3 py-1.5 rounded-lg bg-black/60 text-white text-xs font-medium hover:bg-black/80 transition-colors flex items-center gap-1.5"
                    >
                      <Upload className="w-3 h-3" />
                      تغيير الصورة
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFileSelect(f); }}
                    className="w-full h-36 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  >
                    <ImageIcon className="w-8 h-8 opacity-50" />
                    <span className="text-sm font-medium">اضغط لرفع الصورة أو اسحب وأفلت</span>
                    <span className="text-xs opacity-60">PNG، JPG، WebP (حد أقصى 10MB)</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>إضافة الطعمات/النكهات المتاحة</Label>
              <Input
                placeholder="مثال: توت, فريز, رمان"
                value={formData.availableFlavorsText}
                onChange={e => setFormData({...formData, availableFlavorsText: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">افصل بين النكهات بفاصلة. اتركه فارغاً إذا لم يكن هناك نكهات.</p>
            </div>

            <div className="flex flex-col gap-4 bg-muted/30 p-4 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <Label className="font-bold">متوفر في المخزون</Label>
                <Switch checked={formData.inStock} onCheckedChange={c => setFormData({...formData, inStock: c})} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-bold">منتج مميز (يظهر في الرئيسية)</Label>
                <Switch checked={formData.isFeatured} onCheckedChange={c => setFormData({...formData, isFeatured: c})} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-bold">يباع بالوزن المحدد مسبقاً</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">يظهر أزرار الأوزان (250غ، 500غ، 1كغ...)</p>
                </div>
                <Switch checked={formData.soldByWeight} onCheckedChange={c => setFormData({...formData, soldByWeight: c})} />
              </div>
              
              {formData.soldByWeight && (
                <div className="pt-2 border-t border-border">
                  <Label className="block mb-2">الأوزان الجاهزة (غرام)</Label>
                  <div className="flex gap-4">
                    {[250, 500, 1000, 2000].map(w => (
                      <div key={w} className="flex items-center gap-2">
                        <Checkbox 
                          id={`w-${w}`} 
                          checked={formData.availableWeights.includes(w)}
                          onCheckedChange={() => toggleWeight(w)}
                        />
                        <Label htmlFor={`w-${w}`}>{w}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div>
                  <Label className="font-bold">السماح بإدخال وزن مخصص</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">يظهر حقل نصي للعميل ليكتب الوزن بنفسه</p>
                </div>
                <Switch checked={formData.allowCustomWeight} onCheckedChange={c => setFormData({...formData, allowCustomWeight: c})} />
              </div>
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

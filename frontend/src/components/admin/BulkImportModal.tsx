import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";
import { downloadBulkImportTemplate } from "@/lib/utils/export-template";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ImportResult {
  success: boolean;
  message: string;
  successCount: number;
  failureCount: number;
  errors: string[];
  totalErrors: number;
  addedProductIds: number[];
}

export function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv',
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
      toast({
        title: "صيغة ملف غير صحيحة",
        description: "يرجى استخدام ملف Excel (.xlsx) أو CSV",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "حجم الملف كبير جداً",
        description: "الحد الأقصى للملف هو 5 MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/products/bulk-import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = (await response.json()) as ImportResult & { error?: string };

      if (!response.ok) {
        toast({
          title: "خطأ في الاستيراد",
          description: data.error || "فشل في معالجة الملف",
          variant: "destructive",
        });
        return;
      }

      setResult(data);

      if (data.successCount > 0) {
        toast({
          title: "تم الاستيراد بنجاح",
          description: `تمت إضافة ${data.successCount} منتج`,
        });

        // Call onSuccess after a delay to show the result first
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
        }, 2000);
      } else if (data.failureCount > 0) {
        toast({
          title: "فشل الاستيراد",
          description: "جميع الصفوف تحتوي على أخطاء",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الاتصال",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء الاستيراد",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClose = () => {
    setResult(null);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            استيراد منتجات بالجملة
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-6 mt-4">
            {/* Download Template Section */}
            <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">
                    تحميل قالب Excel
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    حمّل القالب الفارغ واملأه بمعلومات المنتجات، ثم أرفعه هنا
                  </p>
                  <Button
                    onClick={() => downloadBulkImportTemplate()}
                    variant="outline"
                    className="gap-2 bg-white dark:bg-slate-900"
                  >
                    <Download className="w-4 h-4" />
                    تحميل القالب
                  </Button>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-3">
              <h3 className="font-bold text-foreground">أرفع الملف المعبأ</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileSelect(file);
                  }
                }}
                disabled={isUploading}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    handleFileSelect(file);
                  }
                }}
                disabled={isUploading}
                className="w-full h-40 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-sm font-medium">جاري الاستيراد...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 opacity-50" />
                    <span className="text-sm font-medium">اضغط لرفع الملف أو اسحب وأفلت</span>
                    <span className="text-xs opacity-60">Excel (.xlsx) أو CSV — حد أقصى 5MB</span>
                  </>
                )}
              </button>
            </div>

            {/* Info Section */}
            <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-900 dark:text-amber-100 leading-relaxed">
                <strong>ملاحظة:</strong> الأعمدة المطلوبة هي: اسم المنتج، الفئة، السعر، الوحدة، الكمية المتوفرة، والوصف.
                المنتجات المستوردة لن تحتوي على صور — يمكنك إضافة الصور لاحقاً من صفحة التعديل.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {/* Result Summary */}
            <div
              className={`rounded-lg p-4 border ${
                result.successCount > 0
                  ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
              }`}
            >
              <div className="flex items-start gap-3">
                {result.successCount > 0 ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3
                    className={`font-bold mb-1 ${
                      result.successCount > 0
                        ? "text-green-900 dark:text-green-100"
                        : "text-red-900 dark:text-red-100"
                    }`}
                  >
                    {result.message}
                  </h3>
                  <div
                    className={`text-sm space-y-1 ${
                      result.successCount > 0
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    }`}
                  >
                    {result.successCount > 0 && (
                      <p>✓ تمت إضافة <strong>{result.successCount}</strong> منتج بنجاح</p>
                    )}
                    {result.failureCount > 0 && (
                      <p>✗ فشل <strong>{result.failureCount}</strong> منتج</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Errors List */}
            {result.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <h4 className="font-bold text-red-900 dark:text-red-100 mb-2">
                  الأخطاء ({result.errors.length})
                </h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {result.errors.slice(0, 20).map((error, idx) => (
                    <p key={idx} className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                      • {error}
                    </p>
                  ))}
                </div>
                {result.errors.length > 20 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    ... وعدد {result.errors.length - 20} أخطاء أخرى
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-2">
              {result.successCount > 0 ? (
                <Button onClick={handleClose} className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  تم
                </Button>
              ) : (
                <Button onClick={() => setResult(null)} variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  حاول مرة أخرى
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

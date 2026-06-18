import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useGetProduct } from "@/lib/api-client";
import { useCart, FlavorQty } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ShoppingCart, ArrowRight, Minus, Plus, Scale } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const params = useParams();
  const id = Number(params.id);
  
  const { data: product, isLoading } = useGetProduct(id);
  const { addItem } = useCart();
  const { toast } = useToast();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState<number>(1000);
  const [isCustom, setIsCustom] = useState(false);
  const [customWeightInput, setCustomWeightInput] = useState<string>("");
  const [customUnit, setCustomUnit] = useState<"g" | "kg">("g");
  const [freeWeightInput, setFreeWeightInput] = useState<string>("");
  const [freeWeightUnit, setFreeWeightUnit] = useState<"g" | "kg">("g");
  const [flavorQtys, setFlavorQtys] = useState<Record<string, number>>({});

  useEffect(() => {
    if (product && product.soldByWeight && product.availableWeights && selectedWeight === 1000 && !isCustom) {
      if (product.availableWeights.length > 0 && !product.availableWeights.includes(1000)) {
        setSelectedWeight(product.availableWeights[0]);
      }
    }
  }, [product, isCustom, selectedWeight]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 min-h-[60vh]">
        <Skeleton className="h-10 w-32 mb-8" />
        <div className="grid md:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">المنتج غير موجود</h2>
        <Button asChild>
          <Link href="/products">العودة للمنتجات</Link>
        </Button>
      </div>
    );
  }

  const flavors: string[] = product.availableFlavors ?? [];
  const hasFlavors = flavors.length > 0;
  const totalFlavorQty = Object.values(flavorQtys).reduce((s, q) => s + q, 0);

  let finalWeightInGrams = selectedWeight;
  if (isCustom) {
    const parsed = Number(customWeightInput);
    if (!isNaN(parsed) && parsed > 0) {
      finalWeightInGrams = customUnit === "kg" ? parsed * 1000 : parsed;
    }
  }

  let freeWeightInGrams: number | undefined;
  if (product?.allowCustomWeight && !product?.soldByWeight) {
    const parsed = Number(freeWeightInput);
    if (!isNaN(parsed) && parsed > 0) {
      freeWeightInGrams = freeWeightUnit === "kg" ? parsed * 1000 : parsed;
    }
  }

  const priceToDisplay = product.soldByWeight
    ? (finalWeightInGrams / 1000) * product.price
    : product.price;

  const adjustFlavor = (flavor: string, delta: number) => {
    setFlavorQtys(prev => {
      const curr = prev[flavor] ?? 0;
      const next = Math.max(0, curr + delta);
      return { ...prev, [flavor]: next };
    });
  };

  const handleAddToCart = () => {
    if (!product.inStock) return;
    
    if (product.soldByWeight && isCustom) {
      const parsed = Number(customWeightInput);
      if (isNaN(parsed) || parsed <= 0) {
        toast({ title: "يرجى إدخال وزن صحيح", variant: "destructive" });
        return;
      }
      if (finalWeightInGrams > 10000) {
        toast({ title: "الوزن الأقصى المسموح هو 10 كغ", variant: "destructive" });
        return;
      }
    }

    if (product.allowCustomWeight && !product.soldByWeight && !freeWeightInGrams) {
      toast({ title: "يرجى إدخال الوزن المطلوب", variant: "destructive" });
      return;
    }

    if (hasFlavors && totalFlavorQty === 0) {
      toast({ title: "يرجى اختيار نكهة واحدة على الأقل", variant: "destructive" });
      return;
    }

    const cartWeight = product.soldByWeight ? finalWeightInGrams : freeWeightInGrams;

    if (hasFlavors) {
      const breakdown: FlavorQty[] = flavors
        .filter(f => (flavorQtys[f] ?? 0) > 0)
        .map(f => ({ flavor: f, quantity: flavorQtys[f] }));
      addItem(product, totalFlavorQty, cartWeight, breakdown);
      toast({
        title: "تمت الإضافة للسلة",
        description: `تمت إضافة ${totalFlavorQty} × ${product.nameAr} إلى سلة المشتريات`,
      });
    } else {
      addItem(product, quantity, cartWeight);
      toast({
        title: "تمت الإضافة للسلة",
        description: `تمت إضافة ${quantity} × ${product.nameAr} إلى سلة المشتريات`,
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <Link href="/products" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 font-medium transition-colors">
        <ArrowRight className="w-4 h-4" />
        العودة للمنتجات
      </Link>

      <div className="grid md:grid-cols-2 gap-12 bg-card rounded-3xl p-6 md:p-10 shadow-sm border border-border">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted/20 border border-border">
          {!product.inStock && (
            <div className="absolute top-4 right-4 z-10">
              <Badge variant="destructive" className="text-lg px-4 py-1">نفذت الكمية</Badge>
            </div>
          )}
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.nameAr}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-medium">
              لا توجد صورة
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {product.categoryNameAr && (
            <Badge variant="outline" className="w-fit mb-4 text-secondary border-secondary">
              {product.categoryNameAr}
            </Badge>
          )}
          
          <h1 className="text-3xl md:text-5xl font-black text-foreground mb-4">
            {product.nameAr}
          </h1>
          
          <div className="text-3xl font-black text-primary mb-4">
            {priceToDisplay.toLocaleString('ar-SY')} <span className="text-lg font-normal text-muted-foreground">ل.س</span>
            {product.soldByWeight && (
              <span className="text-sm font-medium text-muted-foreground mr-2 block mt-1">
                (السعر للكيلو: {product.price.toLocaleString('ar-SY')} ل.س)
              </span>
            )}
          </div>

          {/* Flavor chips */}
          {hasFlavors && (
            <div className="mb-6">
              <p className="text-sm font-bold text-foreground mb-3">اختر النكهات وحدد الكميات:</p>
              <div className="flex flex-wrap gap-2">
                {flavors.map(flavor => {
                  const qty = flavorQtys[flavor] ?? 0;
                  const active = qty > 0;
                  return (
                    <div
                      key={flavor}
                      className="rounded-lg overflow-hidden transition-all duration-200 border"
                      style={active
                        ? { backgroundColor: "#4A3525", borderColor: "#4A3525" }
                        : { borderColor: "var(--border)" }
                      }
                    >
                      {active ? (
                        <div className="flex items-center gap-1 px-3 py-2">
                          <button
                            onClick={() => adjustFlavor(flavor, -1)}
                            className="w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-white/10"
                            style={{ color: "#F5EDD8" }}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-bold min-w-[20px] text-center" style={{ color: "#F5EDD8" }}>
                            {qty}
                          </span>
                          <button
                            onClick={() => adjustFlavor(flavor, 1)}
                            className="w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-white/10"
                            style={{ color: "#F5EDD8" }}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-semibold mr-1" style={{ color: "#F5EDD8" }}>
                            {flavor}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => adjustFlavor(flavor, 1)}
                          className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                        >
                          {flavor}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {totalFlavorQty > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  إجمالي الكمية: <span className="font-bold text-primary">{totalFlavorQty}</span>
                </p>
              )}
            </div>
          )}

          {product.descriptionAr && (
            <div className="prose prose-p:text-muted-foreground mb-6">
              <p className="text-lg leading-relaxed">{product.descriptionAr}</p>
            </div>
          )}

          <div className="mt-auto space-y-6 bg-background p-6 rounded-2xl border border-border shadow-inner">
            {product.allowCustomWeight && !product.soldByWeight && (
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" />
                  أدخل الوزن المطلوب:
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="1"
                    placeholder="أدخل الوزن"
                    className="max-w-[150px] h-12 text-lg font-bold"
                    value={freeWeightInput}
                    onChange={e => setFreeWeightInput(e.target.value)}
                  />
                  <ToggleGroup
                    type="single"
                    value={freeWeightUnit}
                    onValueChange={v => v && setFreeWeightUnit(v as "g" | "kg")}
                    className="h-12 border rounded-md"
                  >
                    <ToggleGroupItem value="g" className="px-4 font-bold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">غرام</ToggleGroupItem>
                    <ToggleGroupItem value="kg" className="px-4 font-bold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">كيلو</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <p className="text-xs text-muted-foreground">اكتب الوزن الذي تحتاجه وسيتم تسجيله مع طلبك</p>
              </div>
            )}

            {product.soldByWeight && (
              <div className="space-y-4">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" />
                  الوزن المطلوب:
                </label>
                
                <div className="flex flex-wrap gap-3">
                  {[250, 500, 1000, 2000].map(w => (
                    <button
                      key={w}
                      onClick={() => { setIsCustom(false); setSelectedWeight(w); }}
                      className={`px-5 py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${!isCustom && selectedWeight === w ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:border-primary/50'}`}
                    >
                      {w >= 1000 ? `${w/1000} كغ` : `${w} غ`}
                    </button>
                  ))}
                  <button
                    onClick={() => setIsCustom(true)}
                    className={`px-5 py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${isCustom ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:border-primary/50'}`}
                  >
                    مخصص
                  </button>
                </div>

                {isCustom && (
                  <div className="flex items-center gap-3 mt-4 animate-in fade-in slide-in-from-top-2">
                    <Input 
                      type="number" 
                      min="1" 
                      placeholder="أدخل الوزن" 
                      className="max-w-[150px] h-12 text-lg font-bold"
                      value={customWeightInput}
                      onChange={(e) => setCustomWeightInput(e.target.value)}
                    />
                    <ToggleGroup type="single" value={customUnit} onValueChange={(v) => v && setCustomUnit(v as any)} className="h-12 border rounded-md">
                      <ToggleGroupItem value="g" className="px-4 font-bold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">غرام</ToggleGroupItem>
                      <ToggleGroupItem value="kg" className="px-4 font-bold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">كيلو</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                )}
              </div>
            )}

            {!hasFlavors && (
              <div className="space-y-3 pt-4 border-t border-border">
                <label className="text-sm font-bold text-foreground block">الكمية:</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-card border border-border rounded-xl h-12">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-full flex items-center justify-center text-foreground hover:bg-muted hover:text-primary transition-colors rounded-r-xl"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-12 h-full flex items-center justify-center text-foreground hover:bg-muted hover:text-primary transition-colors rounded-l-xl"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Button 
              size="lg" 
              className="w-full h-14 text-lg font-bold gap-3 shadow-lg"
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              <ShoppingCart className="w-5 h-5" />
              {hasFlavors && totalFlavorQty > 0
                ? `أضف ${totalFlavorQty} للسلة`
                : "أضف إلى السلة"
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

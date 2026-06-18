import { useState } from "react";
import { Link } from "wouter";
import { Product } from "@/lib/api-client";
import { useCart, FlavorQty } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const flavors: string[] = product.availableFlavors ?? [];

  const defaultWeight = product.availableWeights && product.availableWeights.length > 0
    ? product.availableWeights[0]
    : 1000;

  const [selectedWeight, setSelectedWeight] = useState<number>(defaultWeight);
  const [isCustomWeight, setIsCustomWeight] = useState(false);
  const [customWeightVal, setCustomWeightVal] = useState<string>("");
  const [flavorQtys, setFlavorQtys] = useState<Record<string, number>>({});

  const actualWeight = isCustomWeight ? (Number(customWeightVal) || defaultWeight) : selectedWeight;

  const hasFlavors = flavors.length > 0;
  const totalFlavorQty = Object.values(flavorQtys).reduce((s, q) => s + q, 0);

  const priceToDisplay = product.soldByWeight
    ? (actualWeight / 1000) * product.price
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

    let weightToAdd: number | undefined;
    if (product.soldByWeight) {
      if (isCustomWeight) {
        weightToAdd = Number(customWeightVal);
        if (!weightToAdd || weightToAdd < 1) {
          toast({ title: "يرجى إدخال وزن صحيح", variant: "destructive" });
          return;
        }
      } else {
        weightToAdd = selectedWeight;
      }
    }

    if (hasFlavors) {
      if (totalFlavorQty === 0) {
        toast({ title: "يرجى اختيار نكهة واحدة على الأقل", variant: "destructive" });
        return;
      }
      const breakdown: FlavorQty[] = flavors
        .filter(f => (flavorQtys[f] ?? 0) > 0)
        .map(f => ({ flavor: f, quantity: flavorQtys[f] }));
      addItem(product, totalFlavorQty, weightToAdd, breakdown);
    } else {
      addItem(product, 1, weightToAdd);
    }

    toast({
      title: "تمت الإضافة للسلة",
      description: `تمت إضافة ${product.nameAr} إلى سلة المشتريات`,
    });
  };

  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow h-full flex flex-col relative">
      {!product.inStock && (
        <div className="absolute top-1.5 left-1.5 z-10">
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-bold">نفذت</Badge>
        </div>
      )}

      <Link href={`/products/${product.id}`} className="block relative aspect-square overflow-hidden bg-muted/20">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.nameAr}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            لا توجد صورة
          </div>
        )}
      </Link>

      <div className="p-2.5 md:p-4 flex flex-col flex-grow gap-2 md:gap-3">
        <div>
          <Link href={`/products/${product.id}`}>
            <h3 className="text-sm md:text-lg font-bold text-foreground mb-0.5 hover:text-primary transition-colors leading-tight line-clamp-2">
              {product.nameAr}
            </h3>
          </Link>
          <div className="text-primary font-black text-base md:text-xl">
            {priceToDisplay.toLocaleString('ar-SY')} <span className="text-xs font-normal text-muted-foreground">ل.س</span>
          </div>
        </div>

        {hasFlavors && (
          <div className="flex flex-wrap gap-1.5">
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
                    <div className="flex items-center gap-0.5 px-1.5 py-1">
                      <button
                        onClick={() => adjustFlavor(flavor, -1)}
                        className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-white/10"
                        style={{ color: "#F5EDD8" }}
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-[11px] font-bold min-w-[14px] text-center" style={{ color: "#F5EDD8" }}>
                        {qty}
                      </span>
                      <button
                        onClick={() => adjustFlavor(flavor, 1)}
                        className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-white/10"
                        style={{ color: "#F5EDD8" }}
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-[10px] font-medium mr-0.5" style={{ color: "#F5EDD8" }}>
                        {flavor}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => adjustFlavor(flavor, 1)}
                      className="px-2.5 py-1.5 text-[10px] md:text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {flavor}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {product.soldByWeight && (
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1">
              {[250, 500, 1000].map(w => (
                <button
                  key={w}
                  onClick={() => { setIsCustomWeight(false); setSelectedWeight(w); }}
                  className={`px-1.5 py-0.5 text-[10px] md:text-xs font-medium rounded border transition-colors ${!isCustomWeight && selectedWeight === w ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-border'}`}
                >
                  {w >= 1000 ? `${w/1000}كغ` : `${w}غ`}
                </button>
              ))}
              <button
                onClick={() => setIsCustomWeight(true)}
                className={`px-1.5 py-0.5 text-[10px] md:text-xs font-medium rounded border transition-colors ${isCustomWeight ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-border'}`}
              >
                مخصص
              </button>
            </div>
            {isCustomWeight && (
              <div className="flex items-center gap-1 mt-1">
                <Input
                  type="number"
                  min="1"
                  placeholder="الوزن"
                  value={customWeightVal}
                  onChange={(e) => setCustomWeightVal(e.target.value)}
                  className="h-7 text-xs"
                />
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">غ</span>
              </div>
            )}
          </div>
        )}

        <Button
          className="w-full mt-auto font-bold gap-1 h-8 md:h-10 text-xs md:text-sm"
          onClick={handleAddToCart}
          disabled={!product.inStock}
        >
          <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4" />
          {hasFlavors && totalFlavorQty > 0 ? `أضف ${totalFlavorQty} للسلة` : <><span className="hidden xs:inline">أضف</span> للسلة</>}
        </Button>
      </div>
    </div>
  );
}

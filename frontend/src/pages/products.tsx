import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useListProducts, useListCategories } from "@/lib/api-client";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Products() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category") ? Number(searchParams.get("category")) : null;

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories, isLoading: loadingCategories } = useListCategories();
  const { data: products, isLoading: loadingProducts } = useListProducts(
    selectedCategoryId ? { categoryId: selectedCategoryId } : {}
  );

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery) return products;
    return products.filter(p =>
      p.nameAr.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-primary mb-6">منتجاتنا</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          تصفح تشكيلتنا الواسعة من القهوة المحمصة، المكسرات الطازجة، والمنتجات الغذائية عالية الجودة.
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ابحث عن منتج..."
          className="pr-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* شريط الأقسام الأفقي - صورة القسم + اسمه، قابل للسحب جنبيًا */}
      <div className="mb-8">
        {loadingCategories ? (
          <div className="flex gap-3 overflow-x-hidden pb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-32 rounded-full flex-shrink-0" />
            ))}
          </div>
        ) : (
          <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`flex-shrink-0 px-5 py-3 rounded-full border font-bold text-sm whitespace-nowrap transition-colors ${
                selectedCategoryId === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground hover:border-primary/40"
              }`}
            >
              الكل
            </button>
            {categories?.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex-shrink-0 flex items-center gap-2 pr-2 pl-4 py-2 rounded-full border transition-colors ${
                  selectedCategoryId === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground hover:border-primary/40"
                }`}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex-shrink-0 border border-black/5">
                  <img
                    src={cat.imageUrl || `/images/category-${cat.slug}.png`}
                    alt={cat.nameAr}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=200&auto=format&fit=crop";
                    }}
                  />
                </div>
                <span className="font-bold text-sm whitespace-nowrap">{cat.nameAr}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div>
        {loadingProducts ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 md:h-96 rounded-xl" />)}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {filteredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-card rounded-xl border border-dashed border-border">
            <h3 className="text-xl font-bold text-muted-foreground mb-2">لا توجد منتجات</h3>
            <p className="text-muted-foreground/80">لم نتمكن من العثور على منتجات تطابق بحثك.</p>
          </div>
        )}
      </div>
    </div>
  );
}

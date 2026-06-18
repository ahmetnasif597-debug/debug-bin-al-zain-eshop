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
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-primary mb-6">منتجاتنا</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          تصفح تشكيلتنا الواسعة من القهوة المحمصة، المكسرات الطازجة، والمنتجات الغذائية عالية الجودة.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {/* Categories Sidebar/Tabs */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-6">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="ابحث عن منتج..." 
              className="pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="font-bold text-lg mb-4 text-foreground border-b pb-2">الأقسام</h3>
            {loadingCategories ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full rounded-md" />)}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`text-right px-4 py-2 rounded-md transition-colors font-medium ${
                    selectedCategoryId === null 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  الكل
                </button>
                {categories?.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`text-right px-4 py-2 rounded-md transition-colors font-medium ${
                      selectedCategoryId === cat.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {cat.nameAr}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-grow">
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
    </div>
  );
}

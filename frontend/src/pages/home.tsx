import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetFeaturedProducts, useListCategories, useListBanners } from "@/lib/api-client";
import { ProductCard } from "@/components/product-card";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function Home() {
  const { data: featuredProducts, isLoading: loadingFeatured } = useGetFeaturedProducts();
  const { data: categories, isLoading: loadingCategories } = useListCategories();
  const { data: banners, isLoading: loadingBanners } = useListBanners();
  const [, setLocation] = useLocation();

  const handleBannerClick = (link: string) => {
    if (!link) return;
    if (link.startsWith("http://") || link.startsWith("https://")) {
      window.location.href = link;
    } else {
      setLocation(link);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">

      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[460px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-primary/70 mix-blend-multiply z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-20" />
          <img
            src="/images/hero-bg.png"
            alt="بن الزين"
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="container relative z-30 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <img
              src="/images/logo-emblem.png"
              alt="بن الزين"
              className="w-48 md:w-72 mx-auto mb-10"
              style={{ filter: "sepia(100%) saturate(300%) brightness(1.15) hue-rotate(-5deg) drop-shadow(0 4px 24px rgba(0,0,0,0.5))" }}
            />
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="text-lg font-bold px-8" asChild>
                <Link href="/products">تصفح المنتجات</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Admin-managed Banners */}
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4">
          {loadingBanners ? (
            <Skeleton className="w-full h-40 sm:h-48 md:h-56 rounded-2xl" />
          ) : banners && banners.length > 0 ? (
            <FeaturedCarousel
              products={banners.map((b) => ({
                id: b.id,
                nameAr: b.title,
                imageUrl: b.imageUrl,
                onCtaClick: () => handleBannerClick(b.link),
              }))}
            />
          ) : null}
        </div>
      </section>

      {/* Decorative Divider */}
      <div className="flex justify-center py-8 text-primary/40 text-2xl">
        ❋ ❋ ❋
      </div>

      {/* Categories */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-primary mb-4">أقسام المحل</h2>
            <div className="w-24 h-1 bg-secondary mx-auto rounded-full"></div>
          </div>

          {loadingCategories ? (
            <div className="space-y-8">
              {[1, 2, 3].map(r => (
                <div key={r} className="flex gap-5 overflow-hidden px-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex-shrink-0 flex flex-col items-center gap-3">
                      <Skeleton className="w-24 h-24 rounded-full" />
                      <Skeleton className="w-16 h-3 rounded" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {[1, 2, 3].map(row => {
                const rowCats = categories?.filter(c => (c.rowNumber ?? 1) === row) ?? [];
                if (rowCats.length === 0) return null;
                return (
                  <div key={row} className="scrollbar-hide flex gap-5 overflow-x-auto px-1 pb-2">
                    {rowCats.map((category, idx) => (
                      <Link key={category.id} href={`/products?category=${category.id}`}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.92 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.07 }}
                          className="group cursor-pointer flex flex-col items-center gap-3 flex-shrink-0 w-28"
                        >
                          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-card shadow-[0_4px_20px_rgba(0,0,0,0.12)] relative">
                            <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors z-10" />
                            <img
                              src={category.imageUrl || `/images/category-${category.slug}.png`}
                              alt={category.nameAr}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => {
                                e.currentTarget.src = "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=400&auto=format&fit=crop";
                              }}
                            />
                          </div>
                          <h3 className="text-sm font-bold text-center text-foreground group-hover:text-primary transition-colors leading-snug w-full">
                            {category.nameAr}
                          </h3>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Decorative Divider */}
      <div className="flex justify-center py-8 text-primary/40 text-2xl">
        ❋ ❋ ❋
      </div>

      {/* Featured Products */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-primary mb-4">منتجات مختارة</h2>
              <div className="w-24 h-1 bg-secondary rounded-full"></div>
            </div>
            <Button variant="ghost" className="hidden md:flex gap-2 font-bold hover:text-primary" asChild>
              <Link href="/products">
                عرض الكل <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-56 sm:h-96 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
              {featuredProducts?.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" className="font-bold w-full" asChild>
              <Link href="/products">عرض كل المنتجات</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

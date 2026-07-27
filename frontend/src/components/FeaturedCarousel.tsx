import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

export interface FeaturedProduct {
  id: string | number;
  nameAr: string;
  tagline?: string; // وصف قصير تحت الاسم
  imageUrl: string;
  price?: number;
  ctaLabel?: string; // نص الزر، افتراضي "تسوق الآن"
  onCtaClick?: () => void;
}

interface FeaturedCarouselProps {
  products: FeaturedProduct[];
  autoPlayMs?: number; // مدة كل شريحة بالميلي ثانية، افتراضي 5000
}

export default function FeaturedCarousel({ products, autoPlayMs = 5000 }: FeaturedCarouselProps) {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (index: number) => {
      const next = (index + products.length) % products.length;
      setActive(next);
    },
    [products.length]
  );

  const goNext = useCallback(() => goTo(active + 1), [active, goTo]);
  const goPrev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (isPaused || products.length <= 1) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % products.length);
    }, autoPlayMs);
    return () => clearInterval(timer);
  }, [isPaused, autoPlayMs, products.length]);

  if (!products || products.length === 0) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      // في RTL: سحب لليمين = التالي، سحب لليسار = السابق
      if (delta > 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl border border-border shadow-lg"
      style={{ background: "linear-gradient(135deg, #2A1D14 0%, #1A120C 60%, #0F0A07 100%)" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* توهج دافئ خلفي */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #C68B3C 0%, transparent 70%)" }}
      />

      <div className="relative">
        {products.map((product, index) => (
          <div
            key={product.id}
            className={`grid grid-cols-1 md:grid-cols-2 items-center gap-6 md:gap-10 px-6 py-10 md:px-14 md:py-16 transition-opacity duration-700 ${
              index === active ? "opacity-100 relative" : "opacity-0 absolute inset-0 pointer-events-none"
            }`}
          >
            {/* النص */}
            <div className="order-2 md:order-1 text-right">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-4"
                style={{ backgroundColor: "#4A3525", color: "#F5EDD8" }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                منتج مميز
              </span>
              <h2 className="text-3xl md:text-4xl font-black leading-tight mb-3" style={{ color: "#F5EDD8" }}>
                {product.nameAr}
              </h2>
              <div className="w-16 h-0.5 mr-0 ml-auto md:mr-0 mb-4" style={{ backgroundColor: "#C68B3C" }} />
              {product.tagline && (
                <p className="text-sm md:text-base mb-6 max-w-sm ml-auto" style={{ color: "#D8C6AE" }}>
                  {product.tagline}
                </p>
              )}
              <div className="flex items-center justify-end gap-4 flex-wrap">
                {product.price !== undefined && (
                  <span className="text-2xl font-black" style={{ color: "#C68B3C" }}>
                    {product.price.toLocaleString("ar-SY")} <span className="text-sm font-medium" style={{ color: "#D8C6AE" }}>ل.س</span>
                  </span>
                )}
                <button
                  onClick={product.onCtaClick}
                  className="font-bold px-6 py-2.5 rounded-xl transition-transform hover:scale-105"
                  style={{ backgroundColor: "#C68B3C", color: "#1A120C" }}
                >
                  {product.ctaLabel || "تسوق الآن"}
                </button>
              </div>
            </div>

            {/* الصورة */}
            <div className="order-1 md:order-2 flex justify-center">
              <div className="w-full max-w-xs aspect-square rounded-2xl overflow-hidden bg-black/20 border border-white/10 flex items-center justify-center">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.nameAr} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs" style={{ color: "#D8C6AE" }}>صورة المنتج</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* أسهم التنقل */}
      {products.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="السابق"
            className="absolute top-1/2 -translate-y-1/2 right-3 md:right-5 w-9 h-9 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 text-white transition-colors backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            aria-label="التالي"
            className="absolute top-1/2 -translate-y-1/2 left-3 md:left-5 w-9 h-9 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 text-white transition-colors backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </>
      )}

      {/* نقاط التنقل */}
      {products.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              aria-label={`الشريحة ${index + 1}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: index === active ? "20px" : "6px",
                backgroundColor: index === active ? "#C68B3C" : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

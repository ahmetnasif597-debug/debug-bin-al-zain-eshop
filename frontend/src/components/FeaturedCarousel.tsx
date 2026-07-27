import { useState, useEffect, useRef, useCallback } from "react";

export interface FeaturedProduct {
  id: string | number;
  nameAr: string;
  tagline?: string; // نص فرعي قصير تحت الاسم
  imageUrl: string;
  onCtaClick?: () => void;
}

interface FeaturedCarouselProps {
  products: FeaturedProduct[];
  autoPlayMs?: number; // مدة كل شريحة بالميلي ثانية، افتراضي 4500
}

export default function FeaturedCarousel({ products, autoPlayMs = 4500 }: FeaturedCarouselProps) {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (index: number) => {
      setActive((index + products.length) % products.length);
    },
    [products.length]
  );

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
      if (delta > 0) goTo(active + 1);
      else goTo(active - 1);
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="relative w-full h-40 sm:h-48 md:h-56 overflow-hidden rounded-2xl shadow-sm cursor-pointer select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {products.map((product, index) => (
        <button
          key={product.id}
          onClick={product.onCtaClick}
          className={`absolute inset-0 w-full h-full grid grid-cols-2 items-center text-right transition-opacity duration-700 ${
            index === active ? "opacity-100 z-10" : "opacity-0 pointer-events-none"
          }`}
          style={{ background: "linear-gradient(135deg, #241811 0%, #120C08 100%)" }}
        >
          {/* النص */}
          <div className="px-4 sm:px-6 flex flex-col items-end order-2">
            <h3 className="text-lg sm:text-2xl md:text-3xl font-black leading-snug" style={{ color: "#F5EDD8" }}>
              {product.nameAr}
            </h3>
            <div className="w-10 h-0.5 my-2" style={{ backgroundColor: "#C68B3C" }} />
            {product.tagline && (
              <p className="text-[11px] sm:text-sm font-medium line-clamp-1" style={{ color: "#D8C6AE" }}>
                {product.tagline}
              </p>
            )}
          </div>

          {/* الصورة */}
          <div className="order-1 h-full flex items-center justify-center p-3 sm:p-4">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.nameAr}
                className="max-h-full max-w-full object-contain drop-shadow-xl"
              />
            )}
          </div>
        </button>
      ))}

      {/* نقاط التنقل */}
      {products.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {products.map((_, index) => (
            <span
              key={index}
              className="h-1 rounded-full transition-all"
              style={{
                width: index === active ? "14px" : "5px",
                backgroundColor: index === active ? "#C68B3C" : "rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

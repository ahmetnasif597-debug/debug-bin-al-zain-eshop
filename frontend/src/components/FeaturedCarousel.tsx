import { useEffect, useRef, useState } from "react";

export interface FeaturedProduct {
  id: string | number;
  nameAr: string;
  tagline?: string; // نص فرعي قصير تحت الاسم
  imageUrl: string;
  onCtaClick?: () => void;
}

interface FeaturedCarouselProps {
  products: FeaturedProduct[];
  autoPlayMs?: number; // مدة كل شريحة بالميلي ثانية، افتراضي 6000
}

export default function FeaturedCarousel({ products, autoPlayMs = 6000 }: FeaturedCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || products.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % products.length);
    }, autoPlayMs);
    return () => clearInterval(timer);
  }, [isPaused, autoPlayMs, products.length]);

  useEffect(() => {
    const card = cardRefs.current[activeIndex];
    if (card) {
      card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeIndex]);

  if (!products || products.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-hide"
      style={{ scrollSnapType: "x mandatory" }}
      onTouchStart={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {products.map((product, index) => (
        <button
          key={product.id}
          ref={(el) => { cardRefs.current[index] = el; }}
          onClick={product.onCtaClick}
          className="flex-shrink-0 w-[82%] sm:w-[420px] h-40 sm:h-48 md:h-56 rounded-2xl overflow-hidden shadow-sm cursor-pointer select-none grid grid-cols-2 items-center text-right"
          style={{
            background: "linear-gradient(135deg, #241811 0%, #120C08 100%)",
            scrollSnapAlign: "center",
          }}
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
    </div>
  );
}

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

/**
 * كاروسيل البانرات — سلايدر أفقي باللمس بنمط "peek":
 * كل بانر صورة كاملة (graphic جاهز) تملأ البطاقة بالكامل،
 * مع التقاط تلقائي (snap) عند التمرير ونقاط ترقيم تحت السلايدر.
 */
export default function FeaturedCarousel({ products, autoPlayMs = 6000 }: FeaturedCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // تتبع البطاقة المرئية أثناء التمرير باللمس لتحديث نقاط الترقيم
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx)) setActiveIndex(idx);
          }
        }
      },
      { root: container, threshold: [0.6] }
    );
    cardRefs.current.forEach((card) => card && observer.observe(card));
    return () => observer.disconnect();
  }, [products.length]);

  // تشغيل تلقائي سلس مع توقف مؤقت عند اللمس أو التحويم
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
    <div>
      <div
        ref={containerRef}
        className="-mx-4 flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 pb-1"
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            ref={(el) => { cardRefs.current[index] = el; }}
            data-index={index}
            onClick={product.onCtaClick}
            role={product.onCtaClick ? "button" : undefined}
            className="flex-shrink-0 min-w-[88%] w-[88%] sm:w-[500px] aspect-[16/8] rounded-2xl overflow-hidden shadow-md cursor-pointer select-none snap-center"
          >
            {/* بانر كامل يملأ البطاقة */}
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.nameAr}
                className="w-full h-full object-cover"
                draggable={false}
              />
            )}
          </div>
        ))}
      </div>

      {/* نقاط الترقيم */}
      {products.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {products.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`الشريحة ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: index === activeIndex ? 20 : 6,
                backgroundColor: index === activeIndex ? "#C68B3C" : "rgba(36,24,17,0.2)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

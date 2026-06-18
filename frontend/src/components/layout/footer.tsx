import { Instagram, Facebook, Phone, MessageCircle, MapPin, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground border-t-4 border-secondary mt-16">
      <div className="container mx-auto px-4 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">

          {/* Brand */}
          <div className="flex flex-col items-start gap-4">
            <img
              src="/images/logo-transparent.png"
              alt="بن الزين"
              className="w-24 brightness-0 invert opacity-90"
            />
            <div className="space-y-1">
              <p className="text-secondary font-black text-base tracking-wide">AL ZAIN COFFEE</p>
              <p className="text-primary-foreground/70 text-sm font-medium">مذاق القهوة الأصلية</p>
              <p className="text-primary-foreground/60 text-xs">100% Arabica · HAL</p>
            </div>
          </div>

          {/* Our Location */}
          <div>
            <h4 className="text-base font-black mb-5 text-secondary tracking-wide uppercase">موقعنا</h4>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-secondary" />
              </div>
              <div className="space-y-1">
                <p className="text-primary-foreground/90 text-sm font-medium leading-snug">
                  حلب — الفرقان — شارع الفتال
                </p>
                <p className="text-primary-foreground/70 text-xs">مقابل أحذية الآغا</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-base font-black mb-5 text-secondary tracking-wide uppercase">تواصل معنا</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <p className="text-primary-foreground/60 text-[10px] font-medium mb-0.5">هاتف</p>
                  <a
                    href="tel:0962823756"
                    className="font-sans font-bold text-sm hover:text-secondary transition-colors"
                    dir="ltr"
                  >
                    0962 823 756
                  </a>
                </div>
              </li>

              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <p className="text-primary-foreground/60 text-[10px] font-medium mb-0.5">واتساب</p>
                  <a
                    href="https://wa.me/963962823756"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans font-bold text-sm hover:text-secondary transition-colors"
                    dir="ltr"
                  >
                    +963 962 823 756
                  </a>
                </div>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="text-base font-black mb-5 text-secondary tracking-wide uppercase">تابعنا</h4>
            <div className="flex flex-col gap-3">
              <a
                href="https://www.instagram.com/zen_cofe?igsh=NWt2eDEwOHZueGFv"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-secondary/20 group-hover:bg-secondary/30 flex items-center justify-center transition-colors flex-shrink-0">
                  <Instagram className="w-4 h-4 text-secondary" />
                </div>
                <span className="text-primary-foreground/75 group-hover:text-secondary transition-colors font-medium text-sm">
                  Instagram
                </span>
              </a>
              <a
                href="https://www.facebook.com/share/14e5tNuBUXU/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-secondary/20 group-hover:bg-secondary/30 flex items-center justify-center transition-colors flex-shrink-0">
                  <Facebook className="w-4 h-4 text-secondary" />
                </div>
                <span className="text-primary-foreground/75 group-hover:text-secondary transition-colors font-medium text-sm">
                  Facebook
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-3 text-primary-foreground/50 text-xs font-medium">
          <p>جميع الحقوق محفوظة &copy; {new Date().getFullYear()} بن الزين · AL ZAIN COFFEE</p>
          <p className="font-sans" dir="ltr">Aleppo, Syria</p>
        </div>
      </div>
    </footer>
  );
}

import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X, LogIn, UserCircle2 } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useGetAuthMe } from "@/lib/api-client";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function Navbar() {
  const { totalItems } = useCart();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { data: customer } = useGetAuthMe();
  const menuRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { label: "الرئيسية", href: "/" },
    { label: "منتجاتنا", href: "/products" },
    { label: "عن المحل", href: "/about" },
  ];

  const openMenu = () => {
    setIsAnimating(true);
    setIsVisible(true);
    setIsMobileMenuOpen(true);
  };

  const closeMenu = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsMobileMenuOpen(false);
      setIsAnimating(false);
    }, 280);
  };

  const toggleMenu = () => {
    if (isMobileMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      closeMenu();
    }
  }, [location]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 h-20 flex flex-row-reverse md:flex-row items-center justify-between">

        {/* LEFT on mobile (logo) | RIGHT on desktop (logo + nav) */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/images/logo-emblem.png" alt="بن الزين" className="h-12 w-auto" />
            <span className="hidden sm:block text-lg font-black" style={{ color: "#e8d5b0" }}>
              بن الزين
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-colors hover:text-primary ${
                  location === link.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* RIGHT on mobile (cart + hamburger) | LEFT on desktop (all action buttons) */}
        <div className="flex items-center gap-2 md:gap-3">
          {customer ? (
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex gap-2 font-bold border-primary/30 hover:border-primary"
              asChild
            >
              <Link href="/profile">
                <UserCircle2 className="w-4 h-4" />
                {customer.fullName?.split(" ")[0]}
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex gap-2 font-bold border-primary/30 hover:border-primary"
              asChild
            >
              <Link href="/login">
                <LogIn className="w-4 h-4" />
                تسجيل الدخول
              </Link>
            </Button>
          )}

          {/* Notification Bell — shown when logged in, always visible */}
          {customer && <NotificationBell />}

          {/* Cart */}
          <Link href="/cart" className="relative group p-2">
            <ShoppingCart className="w-6 h-6 text-primary group-hover:text-secondary transition-colors" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {totalItems}
              </span>
            )}
          </Link>

          {/* WhatsApp CTA — desktop only */}
          <Button
            className="hidden md:flex gap-2 font-bold"
            onClick={() => window.open('https://wa.me/963962823756', '_blank')}
          >
            تواصل معنا
          </Button>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-2 text-primary rounded-lg hover:bg-primary/10 transition-colors active:scale-95"
            onClick={toggleMenu}
            aria-label={isMobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          >
            <span
              className={`block transition-all duration-300 ease-in-out ${
                isMobileMenuOpen ? "rotate-90 opacity-0 scale-75 absolute" : "rotate-0 opacity-100 scale-100"
              }`}
            >
              {!isMobileMenuOpen && <Menu className="w-6 h-6" />}
            </span>
            <span
              className={`block transition-all duration-300 ease-in-out ${
                isMobileMenuOpen ? "rotate-0 opacity-100 scale-100" : "rotate-90 opacity-0 scale-75 absolute"
              }`}
            >
              {isMobileMenuOpen && <X className="w-6 h-6" />}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu — animated slide-in */}
      {(isMobileMenuOpen || isAnimating) && (
        <div
          ref={menuRef}
          className={`md:hidden border-t border-primary/20 bg-background/98 backdrop-blur-sm overflow-hidden transition-all duration-300 ease-out ${
            isVisible
              ? "max-h-[400px] opacity-100 translate-y-0"
              : "max-h-0 opacity-0 -translate-y-2"
          }`}
          style={{ willChange: "max-height, opacity, transform" }}
        >
          <div
            className={`p-5 flex flex-col gap-1 transition-all duration-300 ease-out ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
            }`}
            style={{ transitionDelay: isVisible ? "40ms" : "0ms" }}
          >
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-lg font-semibold py-3 px-4 rounded-xl block transition-all duration-200 ${
                  location === link.href
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
                style={{
                  transitionDelay: isVisible ? `${60 + i * 40}ms` : "0ms",
                  transform: isVisible ? "translateX(0)" : "translateX(8px)",
                  opacity: isVisible ? 1 : 0,
                }}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}

            <div
              className="pt-2 mt-1 border-t border-primary/10 flex flex-col gap-2 transition-all duration-200"
              style={{
                transitionDelay: isVisible ? "180ms" : "0ms",
                transform: isVisible ? "translateX(0)" : "translateX(8px)",
                opacity: isVisible ? 1 : 0,
              }}
            >
              {customer ? (
                <Link
                  href="/profile"
                  className="text-lg font-semibold flex items-center gap-3 py-3 px-4 rounded-xl text-primary hover:bg-primary/8 transition-colors"
                  onClick={closeMenu}
                >
                  <UserCircle2 className="w-5 h-5" />
                  حسابي — {customer.fullName}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="text-lg font-semibold flex items-center gap-3 py-3 px-4 rounded-xl text-primary hover:bg-primary/8 transition-colors"
                  onClick={closeMenu}
                >
                  <LogIn className="w-5 h-5" />
                  تسجيل الدخول / إنشاء حساب
                </Link>
              )}
              <Button
                className="w-full gap-2 font-bold mt-1"
                onClick={() => {
                  window.open('https://wa.me/963962823756', '_blank');
                  closeMenu();
                }}
              >
                تواصل معنا
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

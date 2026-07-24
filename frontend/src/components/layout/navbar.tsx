import { Link, useLocation } from "wouter";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { useGetAuthMe } from "@/lib/api-client";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function Navbar() {
  const { totalItems } = useCart();
  const [location] = useLocation();
  const { data: customer } = useGetAuthMe();
  usePushNotifications({ enabled: !!customer, role: "customer" });

  const navLinks = [
    { label: "الرئيسية", href: "/" },
    { label: "منتجاتنا", href: "/products" },
    { label: "عن المحل", href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 h-20 flex flex-row-reverse md:flex-row items-center justify-between">

        {/* Logo */}
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

        {/* Right side actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Notification Bell */}
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
        </div>
      </div>
    </header>
  );
}

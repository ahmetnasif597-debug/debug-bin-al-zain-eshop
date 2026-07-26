import { Link, useLocation } from "wouter";
import { Home, ShoppingBag, Package, UserCircle2 } from "lucide-react";
import { useGetAuthMe } from "@/lib/api-client";

export function BottomNav() {
  const [location] = useLocation();
  const { data: customer } = useGetAuthMe();

  const tabs = [
    { label: "الرئيسية", href: "/", icon: Home },
    { label: "المنتجات", href: "/products", icon: ShoppingBag },
    { label: "طلباتي", href: customer ? "/orders" : "/login", icon: Package },
    { label: "حسابي", href: customer ? "/profile" : "/login", icon: UserCircle2 },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-primary/20"
      style={{ backgroundColor: "#e8d5b0" }}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.href;
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all active:scale-95"
            >
              <Icon
                className="w-5 h-5 transition-colors"
                style={{ color: isActive ? "#3b1f0e" : "#7a5a3a" }}
              />
              <span
                className="text-[10px] font-bold transition-colors"
                style={{ color: isActive ? "#3b1f0e" : "#7a5a3a" }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

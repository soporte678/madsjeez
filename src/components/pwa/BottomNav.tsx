"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, ShoppingCart, Heart, User } from "lucide-react";
import { useCartCount } from "@/hooks/useCartCount";

const navItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/search", label: "Buscar", icon: Search },
  { href: "/cart", label: "Carrito", icon: ShoppingCart, badge: true },
  { href: "/favorites", label: "Favoritos", icon: Heart },
  { href: "/dashboard", label: "Cuenta", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const cartCount = useCartCount();

  // Solo mostrar en mobile
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Ocultar en rutas de checkout y auth donde no queremos bottom nav
  const hideOnPaths = ["/checkout", "/auth"];
  const shouldHide = hideOnPaths.some(path => pathname?.startsWith(path));

  if (!isMobile || shouldHide) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors active:scale-95 ${
                isActive
                  ? "text-[#0A1B5A] dark:text-[#5B7CC8]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                {item.badge && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 shadow-sm">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#0A1B5A] dark:bg-[#5B7CC8]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

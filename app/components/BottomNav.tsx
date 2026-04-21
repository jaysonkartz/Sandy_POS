"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, Package, User } from "lucide-react";
import { useCart } from "@/app/context/CartContext";

const HIDE_ON_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/pending-approval",
  "/dashboard",
  "/management",
  "/pricing-management",
];

export default function BottomNav() {
  const pathname = usePathname();
  const { cartCount, openOrderPanel, isOrderPanelOpen } = useCart();
  const shouldHide = HIDE_ON_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (shouldHide) return null;

  const items: Array<{
    href: string;
    label: string;
    Icon: typeof Home;
    badge?: number;
  }> = [
    { href: "/", label: "Products", Icon: Home },
    { href: "/cart", label: "Cart", Icon: ShoppingCart, badge: cartCount },
    { href: "/order-history", label: "Orders", Icon: Package },
    { href: "/customer-details", label: "Me", Icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 h-16 w-full max-w-md border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-t-2xl shadow-lg">
      <div className="w-full px-3 h-full">
        <div className="grid grid-cols-4 h-full items-center">
          {items.map(({ href, label, Icon, badge }) => {
            const active =
              label === "Cart"
                ? isOrderPanelOpen
                : href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(href);

            if (label === "Cart") {
              return (
                <button
                  key={label}
                  className="flex flex-col items-center justify-center gap-1 text-[11px] text-gray-600"
                  type="button"
                  onClick={openOrderPanel}
                >
                  <span className="relative">
                    <Icon className={active ? "h-5 w-5 text-blue-600" : "h-5 w-5"} />
                    {badge && badge > 0 ? (
                      <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    ) : null}
                  </span>
                  <span className={active ? "text-blue-600 font-medium" : ""}>{label}</span>
                </button>
              );
            }

            return (
              <Link
                key={label}
                className="flex flex-col items-center justify-center gap-1 text-[11px] text-gray-600"
                href={href}
              >
                <span className="relative">
                  <Icon className={active ? "h-5 w-5 text-blue-600" : "h-5 w-5"} />
                </span>
                <span className={active ? "text-blue-600 font-medium" : ""}>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

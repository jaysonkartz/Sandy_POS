"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, Package, User } from "lucide-react";
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
  const { cartCount } = useCart();

  const shouldHide = HIDE_ON_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

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
    <nav className="fixed bottom-0 left-1/2 z-50 h-16 w-full max-w-md -translate-x-1/2 rounded-t-2xl border-t bg-white/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/80 md:hidden">
      <div className="h-full w-full px-3">
        <div className="grid h-full grid-cols-4 items-center">
          {items.map(({ href, label, Icon, badge }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(href + "/");

            return (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center justify-center gap-1 text-[11px] text-gray-600"
              >
                <span className="relative">
                  <Icon className={active ? "h-5 w-5 text-blue-600" : "h-5 w-5"} />
                  {label === "Cart" && badge && badge > 0 ? (
                    <span className="absolute -right-3 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  ) : null}
                </span>
                <span className={active ? "font-medium text-blue-600" : ""}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
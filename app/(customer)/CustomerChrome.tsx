"use client";

import ApprovalGate from "@/app/components/ApprovalGate";
import BottomNav from "@/app/components/BottomNav";
import { CartProvider } from "@/app/context/CartContext";

export default function CustomerChrome({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <ApprovalGate>
        {children}
        <div className="block sm:hidden">
          <BottomNav />
        </div>
      </ApprovalGate>
    </CartProvider>
  );
}

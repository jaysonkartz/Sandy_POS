"use client";

import ApprovalGate from "@/app/components/ApprovalGate";
import BottomNav from "@/app/components/BottomNav";
import CartProvider from "@/app/context/CartContext";

export default function CustomerChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <ApprovalGate>
        <div className="min-h-screen bg-gray-50 pb-20">
          {children}
          <BottomNav />
        </div>
      </ApprovalGate>
    </CartProvider>
  );
}
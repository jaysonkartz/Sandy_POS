"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";

interface FloatingOrderButtonProps {
  selectedProductsCount: number;
  isEnglish: boolean;
  onClick: () => void;
}

export const FloatingOrderButton: React.FC<FloatingOrderButtonProps> = ({
  selectedProductsCount,
  isEnglish,
  onClick,
}) => {
  return (
    <motion.button
      animate={{ scale: 1 }}
      aria-label={isEnglish ? "View Order" : "查看订单"}
      className="relative flex items-center gap-2 px-4 py-3 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 transition"
      initial={{ scale: 0 }}
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <ShoppingCart size={20} />

      {/* Text: hidden on mobile, show on sm+ */}
      <span className="hidden sm:inline font-semibold text-sm">
        {isEnglish ? "View Order" : "查看订单"}
      </span>

      {/* Badge: always show */}
      {selectedProductsCount > 0 && (
        <span className="ml-1 bg-white text-blue-600 rounded-full min-w-6 h-6 px-2 text-xs font-bold flex items-center justify-center">
          {selectedProductsCount > 9 ? "9+" : selectedProductsCount}
        </span>
      )}
    </motion.button>
  );
};

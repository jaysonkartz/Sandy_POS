import React from "react";
import { motion } from "framer-motion";

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
      className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-40"
      initial={{ scale: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">{isEnglish ? "View Order" : "查看订单"}</span>
        <span className="bg-white text-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
          {selectedProductsCount}
        </span>
      </div>
    </motion.button>
  );
};

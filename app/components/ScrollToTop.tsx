import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ScrollToTopProps {
  show: boolean;
  onClick: () => void;
}

export const ScrollToTop: React.FC<ScrollToTopProps> = ({ show, onClick }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          animate={{ opacity: 1, scale: 1 }}
          aria-label="Scroll to top"
          className="fixed bottom-20 right-4 z-50 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
          exit={{ opacity: 0, scale: 0 }}
          initial={{ opacity: 0, scale: 0 }}
          onClick={onClick}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

"use client";

import React from "react";
import { motion, AnimatePresence as FramerAnimatePresence } from "framer-motion";

interface ScrollToTopProps {
  show: boolean;
  onClick: () => void;
  className?: string; // allow parent to position it
}

const AnimatePresence = FramerAnimatePresence as unknown as React.FC<
  React.PropsWithChildren<Record<string, unknown>>
>;

export const ScrollToTop: React.FC<ScrollToTopProps> = ({ show, onClick, className = "" }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          animate={{ opacity: 1, scale: 1 }}
          aria-label="Scroll to top"
          className={
            "bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center " +
            className
          }
          exit={{ opacity: 0, scale: 0 }}
          initial={{ opacity: 0, scale: 0 }}
          type="button"
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

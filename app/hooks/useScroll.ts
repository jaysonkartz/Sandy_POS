import { useState, useEffect, useCallback } from "react";
import { SCROLL_THRESHOLD } from "@/app/constants/app-constants";

interface UseScrollReturn {
  showScrollTop: boolean;
  scrollToTop: () => void;
}

export const useScroll = (): UseScrollReturn => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = useCallback(() => {
    setShowScrollTop(window.scrollY > SCROLL_THRESHOLD);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return {
    showScrollTop,
    scrollToTop,
  };
};

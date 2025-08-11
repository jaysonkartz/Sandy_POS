"use client";

import { useState, useCallback } from "react";
import { ImageIcon } from "lucide-react";

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export default function ProductImage({ 
  src, 
  alt, 
  className = "w-full h-full object-cover",
  fallbackSrc = "/product-placeholder.svg"
}: ProductImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallbackSrc);
    }
  }, [hasError, fallbackSrc]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Reset state when src changes
  if (src !== imageSrc && !hasError) {
    setImageSrc(src);
    setIsLoading(true);
    setHasError(false);
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleError}
        onLoad={handleLoad}
      />
      
      {hasError && imageSrc === fallbackSrc && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No Image</p>
          </div>
        </div>
      )}
    </div>
  );
} 
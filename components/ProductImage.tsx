"use client";

import React, { useEffect, useState } from "react";

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export default function ProductImage({
  src,
  alt,
  className = "",
}: ProductImageProps) {
  const placeholder = "/product-placeholder.svg";
  const [imgSrc, setImgSrc] = useState(src || placeholder);
  const [loading, setLoading] = useState(true);
  const [triedFallback, setTriedFallback] = useState(false);

  useEffect(() => {
    setImgSrc(src || placeholder);
    setLoading(true);
    setTriedFallback(false);
  }, [src]);

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
        </div>
      )}

      <img
        src={imgSrc}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity ${
          loading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setLoading(false)}
        onError={() => {
          if (!triedFallback && imgSrc !== placeholder) {
            setTriedFallback(true);
            setImgSrc(placeholder);
            return;
          }
          setLoading(false);
        }}
      />
    </div>
  );
}
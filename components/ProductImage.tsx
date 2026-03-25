"use client";

import React, { useEffect, useState } from "react";
import { CldImage as CloudinaryImage } from "@/app/lib/cloudinary";

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export default function ProductImage({ src, alt, className = "" }: ProductImageProps) {
  const placeholder = "/product-placeholder.svg";
  const [imgSrc, setImgSrc] = useState(src || placeholder);
  const [loading, setLoading] = useState(true);
  const [triedFallback, setTriedFallback] = useState(false);

  useEffect(() => {
    setImgSrc(src || placeholder);
    setLoading(true);
    setTriedFallback(false);
  }, [src]);

  useEffect(() => {
    let cancelled = false;
    const preloader = new Image();

    preloader.src = imgSrc;

    // Covers refresh/hydration + cached image paths where DOM onLoad can be missed.
    if (preloader.complete) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const finishLoading = () => {
      if (!cancelled) setLoading(false);
    };

    preloader.onload = finishLoading;
    preloader.onerror = finishLoading;

    return () => {
      cancelled = true;
      preloader.onload = null;
      preloader.onerror = null;
    };
  }, [imgSrc]);

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
        </div>
      )}

      <CloudinaryImage
        unoptimized
        alt={alt}
        className={`h-full w-full object-cover transition-opacity ${
          loading ? "opacity-0" : "opacity-100"
        }`}
        height={1200}
        src={imgSrc}
        width={1200}
        onError={() => {
          if (!triedFallback && imgSrc !== placeholder) {
            setTriedFallback(true);
            setImgSrc(placeholder);
            return;
          }
          setLoading(false);
        }}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}

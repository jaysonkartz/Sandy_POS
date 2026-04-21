"use client";

import React from "react";
import { IMAGE_PLACEHOLDER, resolveImageSrc } from "@/app/lib/image";

interface ProductImageProps {
  src?: string | null;
  publicId?: string | null;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
}

export default function ProductImage({
  src,
  publicId,
  alt,
  className = "",
  fill = false,
  width = 500,
  height = 500,
  priority = false,
}: ProductImageProps) {
  const finalSrc = resolveImageSrc(src, publicId);

  return (
    <img
      alt={alt}
      className={className}
      src={finalSrc}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : "lazy"}
      style={fill ? { width: "100%", height: "100%", objectFit: "cover" } : undefined}
      onError={(e) => {
        e.currentTarget.src = IMAGE_PLACEHOLDER;
      }}
    />
  );
}
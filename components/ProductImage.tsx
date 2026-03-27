"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CldImage as CloudinaryImage } from "../app/lib/cloudinary";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
}

const LOCAL_PLACEHOLDER = "/product-placeholder.svg";
const CLOUDINARY_PLACEHOLDER = "sandy-pos-products/product-placeholder";

function sanitizePart(value: string) {
  return value
    .replace(/%20/g, " ")
    .replace(/&/g, " and ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[()]/g, " ")
    .replace(/\.[a-zA-Z0-9]+$/g, "")
    .replace(/[^a-zA-Z0-9\s/_-]/g, " ")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
}

function extractCloudinaryPublicId(url: string) {
  try {
    const decoded = decodeURIComponent(url);
    const match = decoded.match(
      /\/upload\/(?:[^/]+\/)*(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?(?:\?.*)?$/i
    );
    return match?.[1]?.replace(/^\/+/, "") || "";
  } catch {
    return "";
  }
}

function normalizeToCloudinaryPublicId(input?: string | null) {
  if (!input) return CLOUDINARY_PLACEHOLDER;

  let value = String(input).trim();
  if (!value) return CLOUDINARY_PLACEHOLDER;

  value = value.replace(/\\/g, "/").trim();

  if (value === LOCAL_PLACEHOLDER || value.endsWith("/product-placeholder.svg")) {
    return CLOUDINARY_PLACEHOLDER;
  }

  if (/^https?:\/\//i.test(value)) {
    if (value.includes("res.cloudinary.com")) {
      const publicId = extractCloudinaryPublicId(value);
      return publicId || CLOUDINARY_PLACEHOLDER;
    }

    return CLOUDINARY_PLACEHOLDER;
  }

  if (value.startsWith("/Img/") || value.startsWith("Img/")) {
    const clean = decodeURIComponent(value)
      .replace(/^\/+/, "")
      .replace(/^Img\//i, "")
      .replace(/\.[a-zA-Z0-9]+$/i, "");

    const parts = clean.split("/").map(sanitizePart).filter(Boolean);
    return parts.length ? `sandy-pos-products/${parts.join("/")}` : CLOUDINARY_PLACEHOLDER;
  }

  if (value.startsWith("/")) {
    return CLOUDINARY_PLACEHOLDER;
  }

  const cleanedDirect = decodeURIComponent(value)
    .replace(/\.[a-zA-Z0-9]+$/i, "")
    .split("/")
    .map((part, index) => {
      const next = sanitizePart(part);
      return index === 0 && next === "img" ? "" : next;
    })
    .filter(Boolean)
    .join("/");

  if (!cleanedDirect) return CLOUDINARY_PLACEHOLDER;

  if (cleanedDirect.startsWith("sandy-pos-products/")) {
    return cleanedDirect;
  }

  return cleanedDirect.includes("/") ? `sandy-pos-products/${cleanedDirect}` : cleanedDirect;
}

export default function ProductImage({
  src,
  alt,
  className = "",
  fill = false,
  width = 500,
  height = 500,
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority = false,
}: ProductImageProps) {
  const normalizedSrc = useMemo(() => normalizeToCloudinaryPublicId(src), [src]);

  const [mode, setMode] = useState<"cloudinary" | "local">("cloudinary");
  const [currentSrc, setCurrentSrc] = useState(normalizedSrc);

  useEffect(() => {
    setMode("cloudinary");
    setCurrentSrc(normalizedSrc);
  }, [normalizedSrc]);

  const commonProps = {
    alt,
    className,
  };

  if (mode === "cloudinary") {
    return (
      <CloudinaryImage
        {...commonProps}
        fill={fill || undefined}
        height={fill ? undefined : height}
        loading={priority ? "eager" : "lazy"}
        sizes={sizes}
        src={currentSrc}
        width={fill ? undefined : width}
        onError={() => {
          if (currentSrc !== CLOUDINARY_PLACEHOLDER) {
            setCurrentSrc(CLOUDINARY_PLACEHOLDER);
            return;
          }
          setMode("local");
        }}
      />
    );
  }

  return (
    <img
      {...commonProps}
      height={fill ? undefined : height}
      loading={priority ? "eager" : "lazy"}
      src={LOCAL_PLACEHOLDER}
      style={fill ? { width: "100%", height: "100%", objectFit: "cover" } : undefined}
      width={fill ? undefined : width}
      onError={(e) => {
        const target = e.currentTarget;
        if (target.src !== window.location.origin + LOCAL_PLACEHOLDER) {
          target.src = LOCAL_PLACEHOLDER;
        }
      }}
    />
  );
}

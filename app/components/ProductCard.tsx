"use client";

import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Camera } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { CATEGORY_ID_NAME_MAP } from "@/app/(admin)/const/category";

interface ProductImageRow {
  id: number;
  product_id: number;
  image_url: string;
  sort_order: number;
  is_cover: boolean;
}

interface Product {
  id: number;
  "Item Code": string;
  Product: string;
  Category: string;
  weight: string;
  UOM: string;
  Country: string;
  Product_CH?: string;
  Category_CH?: string;
  Country_CH?: string;
  Variation?: string;
  Variation_CH?: string;
  price: number;
  uom: string;
  stock_quantity: number;
  image_url?: string;
  product_images?: ProductImageRow[];
}

interface ProductGroup {
  groupKey: string;
  title: string;
  products: Product[];
  category: string;
}

interface ProductCardProps {
  group: ProductGroup;
  isEnglish: boolean;
  isSessionValid: boolean;
  userRole: string;
  selectedOptions: {
    [groupKey: string]: { variation?: string; countryId?: string; weight?: string };
  };
  currentQuantityByProductId: Record<number, number>;
  countryMap: { [key: string]: { name: string; chineseName: string } };
  isLoggingIn: boolean;
  reorderedProductIds?: number[];
  onOptionChange: (
    groupKey: string,
    type: "variation" | "countryId" | "weight",
    value: string
  ) => void;
  onAddToOrder: (product: Product) => void;
  onUpdateQuantity: (productId: number, newQuantity: number) => void;
  onCustomerService: () => void;
  onOpenPhotoEditor: (product: Product) => void;
  onOpenSignupModal: () => void;
}

const getCategoryName = (category: string | number) =>
  CATEGORY_ID_NAME_MAP[String(category)] || "Unknown Category";

const ProductCardContent = memo<ProductCardProps>(
  ({
    group,
    isEnglish,
    isSessionValid,
    userRole,
    selectedOptions,
    currentQuantityByProductId,
    countryMap,
    isLoggingIn,
    reorderedProductIds = [],
    onOptionChange,
    onAddToOrder,
    onUpdateQuantity,
    onCustomerService,
    onOpenPhotoEditor,
    onOpenSignupModal,
  }) => {
    const { groupKey, products } = group;
    const IMAGE_PLACEHOLDER = "/product-placeholder.svg";

    const getMatchingProduct = useCallback(
      (
        selection: { variation?: string; countryId?: string; weight?: string },
        changedType?: "variation" | "countryId" | "weight"
      ) => {
        const exact = products.find(
          (p) =>
            (!selection.variation || p.Variation === selection.variation) &&
            (!selection.countryId || p.Country === selection.countryId) &&
            (!selection.weight || p.weight === selection.weight)
        );
        if (exact) return exact;

        if (changedType === "variation") {
          return products.find((p) => p.Variation === selection.variation) || products[0];
        }
        if (changedType === "countryId") {
          return products.find((p) => p.Country === selection.countryId) || products[0];
        }
        if (changedType === "weight") {
          return products.find((p) => p.weight === selection.weight) || products[0];
        }

        return products[0];
      },
      [products]
    );

    const getSelectedProduct = useCallback(() => {
      const selected = selectedOptions[groupKey] || {};
      return getMatchingProduct(selected);
    }, [getMatchingProduct, selectedOptions, groupKey]);

    const product = getSelectedProduct();
    const currentQuantity = currentQuantityByProductId[product.id] ?? 0;
    const isReordered = reorderedProductIds.includes(product.id);

    const uniq = (arr: Array<string | undefined | null>) =>
      Array.from(new Set(arr.filter(Boolean).map((v) => String(v).trim()))).filter(Boolean);

    const variations = uniq(products.map((p) => p.Variation));
    const origins = uniq(products.map((p) => p.Country));
    const weights = uniq(products.map((p) => p.weight));

    const handleOptionChange = useCallback(
      (type: "variation" | "countryId" | "weight", value: string) => {
        const current = selectedOptions[groupKey] || {};
        const nextSelection = {
          variation: current.variation,
          countryId: current.countryId,
          weight: current.weight,
          [type]: value,
        };

        const matched = getMatchingProduct(nextSelection, type);
        onOptionChange(groupKey, "variation", matched.Variation || "");
        onOptionChange(groupKey, "countryId", matched.Country || "");
        onOptionChange(groupKey, "weight", matched.weight || "");
      },
      [getMatchingProduct, onOptionChange, selectedOptions, groupKey]
    );

    const fallbackImage = `/Img/${getCategoryName(product.Category)}/${product.Product}${
      product.Variation ? ` (${product.Variation})` : ""
    }.png`;

    const galleryImages = useMemo(() => {
      const productImages = [...(product.product_images || [])].sort((a, b) => {
        if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });

      const urls = productImages
        .map((img) => img.image_url?.trim())
        .filter((url): url is string => Boolean(url));

      if (product.image_url && product.image_url.trim() !== "") {
        const productImageUrl = product.image_url.trim();
        if (!urls.includes(productImageUrl)) {
          urls.unshift(productImageUrl);
        }
      }

      const uniqueUrls = Array.from(new Set(urls));
      if (uniqueUrls.length > 0) return uniqueUrls;
      return [fallbackImage];
    }, [product.product_images, product.image_url, fallbackImage]);

    const [selectedImage, setSelectedImage] = useState(galleryImages[0]);

    useEffect(() => {
      setSelectedImage(galleryImages[0]);
    }, [galleryImages, product.id]);

    return (
      <div
        aria-label={isEnglish ? product.Product : product.Product_CH}
        className={`relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:shadow-md ${
          isReordered ? "ring-2 ring-green-400 shadow-lg animate-[pulse_1.6s_ease-in-out_3]" : ""
        }`}
        role="article"
      >
        {isReordered && (
          <div className="absolute left-2 top-2 z-10 rounded-full bg-green-500 px-2 py-1 text-xs font-semibold text-white shadow">
            Reordered
          </div>
        )}

        <div className="relative bg-gray-100">
          <div className="relative h-24 bg-gray-100 sm:h-48">
            <ProductImage
              key={`${product.id}-${selectedImage}`}
              alt={isEnglish ? product.Product : product.Product_CH || product.Product}
              className="h-full w-full"
              src={selectedImage}
            />

            {isSessionValid && userRole === "ADMIN" && (
              <button
                className="absolute right-2 top-2 rounded-full bg-blue-500 p-2 text-white"
                onClick={() => onOpenPhotoEditor(product)}
              >
                <Camera size={14} />
              </button>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-t bg-white px-2 py-2">
              {galleryImages.slice(0, 5).map((img, index) => (
                <button
                  key={`${img}-${index}`}
                  className={`shrink-0 overflow-hidden rounded border-2 transition ${
                    selectedImage === img ? "border-blue-500" : "border-gray-200"
                  }`}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                >
                  <img
                    alt={`${product.Product} ${index + 1}`}
                    className="h-12 w-12 object-cover sm:h-14 sm:w-14"
                    src={img}
                    onError={(e) => {
                      if (e.currentTarget.src.endsWith(IMAGE_PLACEHOLDER)) return;
                      e.currentTarget.src = IMAGE_PLACEHOLDER;
                    }}
                  />
                </button>
              ))}

              {galleryImages.length > 5 && (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border bg-gray-50 text-xs text-gray-500 sm:h-14 sm:w-14">
                  +{galleryImages.length - 5}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-grow flex-col p-3 sm:p-4">
          <h3 className="line-clamp-2 text-base font-bold leading-snug sm:text-lg">
            {isEnglish ? product.Product : product.Product_CH}
          </h3>
          <p className="mb-3 text-xs text-gray-400">{product["Item Code"]}</p>

          <div className="mb-4 space-y-2">
            {variations.length > 1 ? (
              <select
                className="w-full rounded border p-2 text-sm"
                value={product.Variation || variations[0]}
                onChange={(e) => handleOptionChange("variation", e.target.value)}
              >
                {variations.map((v) => (
                  <option key={v} value={v}>
                    {isEnglish ? v : products.find((p) => p.Variation === v)?.Variation_CH || v}
                  </option>
                ))}
              </select>
            ) : variations.length === 1 ? (
              <div className="text-sm text-gray-600">
                {isEnglish ? "Variation" : "规格"}:
                <span className="ml-2 rounded bg-gray-100 px-2 py-0.5">
                  {isEnglish ? variations[0] : products[0].Variation_CH || variations[0]}
                </span>
              </div>
            ) : null}

            {origins.length > 1 ? (
              <select
                className="w-full rounded border p-2 text-sm"
                value={product.Country || origins[0]}
                onChange={(e) => handleOptionChange("countryId", e.target.value)}
              >
                {origins.map((o) => (
                  <option key={o} value={o}>
                    {isEnglish ? countryMap[o]?.name || o : countryMap[o]?.chineseName || o}
                  </option>
                ))}
              </select>
            ) : origins.length === 1 ? (
              <div className="text-sm text-gray-600">
                {isEnglish ? "Origin" : "产地"}:
                <span className="ml-2 rounded bg-gray-100 px-2 py-0.5">
                  {isEnglish
                    ? countryMap[origins[0]]?.name || origins[0]
                    : countryMap[origins[0]]?.chineseName || origins[0]}
                </span>
              </div>
            ) : null}

            {weights.length > 1 ? (
              <select
                className="w-full rounded border p-2 text-sm"
                value={product.weight || weights[0]}
                onChange={(e) => handleOptionChange("weight", e.target.value)}
              >
                {weights.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            ) : weights.length === 1 ? (
              <div className="text-sm text-gray-600">
                {isEnglish ? "Weight" : "重量"}:
                <span className="ml-2 rounded bg-gray-100 px-2 py-0.5">{weights[0]}</span>
              </div>
            ) : null}
          </div>

          {isSessionValid && (
            <div className="mb-4 text-xl font-bold">
              ${product.price.toFixed(2)}
              <span className="text-sm text-gray-500"> /{product.UOM}</span>
            </div>
          )}

          <div className="mt-auto border-t border-gray-100 pt-4">
            {!isSessionValid ? (
              <button
                className="w-full text-center font-semibold text-blue-600 transition-colors hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoggingIn}
                onClick={onOpenSignupModal}
              >
                {isLoggingIn
                  ? isEnglish
                    ? "Logging in..."
                    : "登录中..."
                  : isEnglish
                    ? "Login to see price"
                    : "登录查看价格"}
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-lg px-1 py-3 sm:px-3">
                <div className="flex items-center">
                  <div className="flex w-fit items-stretch overflow-hidden rounded-md border bg-white">
                    <button
                      className="flex h-10 w-10 items-center justify-center bg-gray-100 text-base font-semibold hover:bg-gray-200"
                      onClick={() => {
                        if (currentQuantity > 1) onUpdateQuantity(product.id, currentQuantity - 1);
                        else if (currentQuantity === 1) onUpdateQuantity(product.id, 0);
                      }}
                    >
                      −
                    </button>

                    <input
                      className="w-12 bg-white text-center text-base font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      inputMode="numeric"
                      min={0}
                      type="number"
                      value={currentQuantity}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value) || 0;
                        if (newQuantity > 0) {
                          if (currentQuantity === 0) onAddToOrder(product);
                          onUpdateQuantity(product.id, newQuantity);
                        } else {
                          onUpdateQuantity(product.id, 0);
                        }
                      }}
                    />

                    <button
                      className="flex h-10 w-10 items-center justify-center bg-gray-100 text-base font-semibold hover:bg-gray-200"
                      onClick={() => {
                        if (currentQuantity > 0) onUpdateQuantity(product.id, currentQuantity + 1);
                        else onAddToOrder(product);
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                  title={isEnglish ? "Inquire via WhatsApp" : "通过WhatsApp询价"}
                  onClick={onCustomerService}
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ProductCardContent.displayName = "ProductCardContent";

export const ProductCard = memo<ProductCardProps>((props) => {
  if (props.group.products.length === 0) return null;
  return <ProductCardContent {...props} />;
});

ProductCard.displayName = "ProductCard";

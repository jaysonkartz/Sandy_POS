"use client";

import React, { memo, useCallback } from "react";
import { Camera } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { CATEGORY_ID_NAME_MAP } from "@/app/(admin)/const/category";

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
}

interface ProductGroup {
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
    [title: string]: { variation?: string; countryId?: string; weight?: string };
  };
  currentQuantityByProductId: Record<number, number>;
  countryMap: { [key: string]: { name: string; chineseName: string } };
  isLoggingIn: boolean;
  onOptionChange: (
    title: string,
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

export const ProductCard = memo<ProductCardProps>(({
  group,
  isEnglish,
  isSessionValid,
  userRole,
  selectedOptions,
  currentQuantityByProductId,
  countryMap,
  isLoggingIn,
  onOptionChange,
  onAddToOrder,
  onUpdateQuantity,
  onCustomerService,
  onOpenPhotoEditor,
  onOpenSignupModal,
}) => {
  const { title, products } = group;

  const getSelectedProduct = useCallback(() => {
    const selected = selectedOptions[title] || {};
    return (
      products.find(
        (p) =>
          (!selected.variation || p.Variation === selected.variation) &&
          (!selected.countryId || p.Country === selected.countryId) &&
          (!selected.weight || p.weight === selected.weight)
      ) || products[0]
    );
  }, [products, selectedOptions, title]);

  const product = getSelectedProduct();
  const currentQuantity = currentQuantityByProductId[product.id] ?? 0;

  const uniq = (arr: Array<string | undefined | null>) =>
    Array.from(new Set(arr.filter(Boolean).map((v) => String(v).trim()))).filter(Boolean);

  const variations = uniq(products.map((p) => p.Variation));
  const origins = uniq(products.map((p) => p.Country));
  const weights = uniq(products.map((p) => p.weight));

  const handleOptionChange = useCallback(
    (type: "variation" | "countryId" | "weight", value: string) => {
      onOptionChange(title, type, value);
    },
    [onOptionChange, title]
  );

  return (
    <div
      className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
      role="article"
      aria-label={isEnglish ? product.Product : product.Product_CH}
    >
      {/* Image */}
      <div className="relative h-24 sm:h-48 bg-gray-100">
        <ProductImage
          src={
            product.image_url ||
            `/Img/${getCategoryName(product.Category)}/${product.Product}${
              product.Variation ? ` (${product.Variation})` : ""
            }.png`
          }
          alt={isEnglish ? product.Product : product.Product_CH || product.Product}
          className="w-full h-full object-cover"
        />

        {isSessionValid && userRole === "ADMIN" && (
          <button
            onClick={() => onOpenPhotoEditor(product)}
            className="absolute top-2 right-2 bg-blue-500 text-white p-2 rounded-full"
          >
            <Camera size={14} />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <h3 className="text-base sm:text-lg font-bold leading-snug line-clamp-2">
          {isEnglish ? product.Product : product.Product_CH}
        </h3>
        <p className="text-xs text-gray-400 mb-3">{product["Item Code"]}</p>

        {/* OPTIONS */}
        <div className="space-y-2 mb-4">
          {/* Variation */}
          {variations.length > 1 ? (
            <select
              className="w-full p-2 text-sm border rounded"
              value={selectedOptions[title]?.variation || variations[0]}
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
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded">
                {isEnglish ? variations[0] : products[0].Variation_CH || variations[0]}
              </span>
            </div>
          ) : null}

          {/* Origin */}
          {origins.length > 1 ? (
            <select
              className="w-full p-2 text-sm border rounded"
              value={selectedOptions[title]?.countryId || origins[0]}
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
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded">
                {isEnglish
                  ? countryMap[origins[0]]?.name || origins[0]
                  : countryMap[origins[0]]?.chineseName || origins[0]}
              </span>
            </div>
          ) : null}

          {/* Weight */}
          {weights.length > 1 ? (
            <select
              className="w-full p-2 text-sm border rounded"
              value={selectedOptions[title]?.weight || weights[0]}
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
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded">{weights[0]}</span>
            </div>
          ) : null}
        </div>

        {/* Price */}
        {isSessionValid && (
          <div className="text-xl font-bold mb-4">
            ${product.price.toFixed(2)}
            <span className="text-sm text-gray-500"> /{product.UOM}</span>
          </div>
        )}

        {/* Action Buttons */}
<div className="mt-auto pt-4 border-t border-gray-100">
  {!isSessionValid ? (
    <button
      className="w-full text-center text-blue-600 font-semibold hover:text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="flex items-center justify-between w-full gap-2 py-3 px-1 sm:px-3 rounded-lg">
    {/* Left: Quantity controls */}
<div className="flex items-center gap-2 flex-1">
  <div className="flex items-stretch flex-1 overflow-hidden rounded-md border bg-white">
    {/* Minus */}
    <button
      className="shrink-0 w-10 h-10 bg-gray-100 hover:bg-gray-200 text-base font-semibold flex items-center justify-center"
      onClick={() => {
        if (currentQuantity > 1) onUpdateQuantity(product.id, currentQuantity - 1);
        else if (currentQuantity === 1) onUpdateQuantity(product.id, 0);
      }}
    >
      −
    </button>

    {/* Quantity */}
    <input
      type="number"
      inputMode="numeric"
      min={0}
      className="w-16 sm:w-20 text-center text-base font-semibold outline-none border-x bg-white
                 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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

    {/* Plus */}
    <button
      className="shrink-0 w-10 h-10 bg-gray-100 hover:bg-gray-200 text-base font-semibold flex items-center justify-center"
      onClick={() => {
        if (currentQuantity > 0) onUpdateQuantity(product.id, currentQuantity + 1);
        else onAddToOrder(product);
      }}
    >
      +
    </button>
  </div>
</div>

              {/* WhatsApp (stacked on md/ipad) */}
              <button
                className="bg-gray-100 text-gray-600 h-10 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center
                           lg:w-10 lg:h-10"
                title={isEnglish ? "Inquire via WhatsApp" : "通过WhatsApp询价"}
                onClick={onCustomerService}
              >
                <WhatsAppIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";
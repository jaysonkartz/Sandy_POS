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
  onCustomerService: (productDetails: {
    productName: string;
    variation?: string;
    origin?: string;
    weight?: string;
  }) => void;
  onOpenPhotoEditor: (product: Product) => void;
  onOpenSignupModal: () => void;
}

const getCategoryName = (category: string | number) =>
  CATEGORY_ID_NAME_MAP[String(category)] || "Unknown Category";

export const ProductCard = memo<ProductCardProps>(
  ({
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
    const optionIdPrefix = `product-${String(title).toLowerCase().replace(/\s+/g, "-")}`;

    const getValue = useCallback(
      (value?: string | null) => (value ? String(value).trim() : ""),
      []
    );
    const matchBySelection = useCallback(
      (p: Product, selection: { variation?: string; countryId?: string; weight?: string }) => {
        const variation = getValue(selection.variation);
        const countryId = getValue(selection.countryId);
        const weight = getValue(selection.weight);

        if (variation && getValue(p.Variation) !== variation) return false;
        if (countryId && getValue(p.Country) !== countryId) return false;
        if (weight && getValue(p.weight) !== weight) return false;

        return true;
      },
      [getValue]
    );

    const getSelectedProduct = useCallback(() => {
      const selected = selectedOptions[title] || {};
      return (
        products.find((p) => matchBySelection(p, selected)) ||
        products.find((p) => {
          const normalizedCountry = getValue(selected.countryId);
          return normalizedCountry ? getValue(p.Country) === normalizedCountry : false;
        }) ||
        products.find((p) => {
          const normalizedVariation = getValue(selected.variation);
          return normalizedVariation ? getValue(p.Variation) === normalizedVariation : false;
        }) ||
        products.find((p) => {
          const normalizedWeight = getValue(selected.weight);
          return normalizedWeight ? getValue(p.weight) === normalizedWeight : false;
        }) ||
        products[0]
      );
    }, [products, selectedOptions, title, matchBySelection, getValue]);

    const product = getSelectedProduct();
    const currentQuantity = currentQuantityByProductId[product.id] ?? 0;

    const uniq = (arr: Array<string | undefined | null>) =>
      Array.from(new Set(arr.filter(Boolean).map((v) => String(v).trim()))).filter(Boolean);

    const variations = uniq(products.map((p) => p.Variation));
    const origins = uniq(products.map((p) => p.Country));
    const weights = uniq(products.map((p) => p.weight));
    const productOrigin = getValue(product.Country);
    const originDisplayName = productOrigin
      ? isEnglish
        ? countryMap[productOrigin]?.name || productOrigin
        : countryMap[productOrigin]?.chineseName || productOrigin
      : "";

  const handleOptionChange = useCallback(
    (type: "variation" | "countryId" | "weight", value: string) => {
      onOptionChange(title, type, value);
    },
    [onOptionChange, title]
  );

  const fallbackImage = `/Img/${getCategoryName(product.Category)}/${product.Product}${
    product.Variation ? ` (${product.Variation})` : ""
  }.png`;

  const galleryImages = useMemo(() => {
    const productImages = [...(product.product_images || [])].sort((a, b) => {
      if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
  
    const urls = productImages.map((img) => img.image_url).filter(Boolean);
  
    // If products.image_url exists but is missing from product_images, prepend it
    if (product.image_url && product.image_url.trim() !== "") {
      if (!urls.includes(product.image_url)) {
        urls.unshift(product.image_url);
      }
    }
  
    if (urls.length > 0) return urls;
    return [fallbackImage];
  }, [product.product_images, product.image_url, fallbackImage]);
  const [selectedImage, setSelectedImage] = useState(galleryImages[0]);

  useEffect(() => {
    setSelectedImage(galleryImages[0]);
  }, [galleryImages, product.id]);
  console.log("[ProductCard]", {
    productId: product.id,
    productName: product.Product,
    image_url: product.image_url,
    product_images: product.product_images,
    galleryImages,
  });
  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
      role="article"
      aria-label={isEnglish ? product.Product : product.Product_CH}
    >
      <div className="relative bg-gray-100">
        <div className="relative h-24 bg-gray-100 sm:h-48">
          <ProductImage
            key={`${product.id}-${selectedImage}`}
            src={selectedImage}
            alt={isEnglish ? product.Product : product.Product_CH || product.Product}
            className="h-full w-full"
          />

          {isSessionValid && userRole === "ADMIN" && (
            <button
              onClick={() => onOpenPhotoEditor(product)}
              className="absolute right-2 top-2 rounded-full bg-blue-500 p-2 text-white"
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
                type="button"
                onClick={() => setSelectedImage(img)}
                className={`shrink-0 overflow-hidden rounded border-2 ${
                  selectedImage === img ? "border-blue-500" : "border-gray-200"
                }`}
              >
                <img
                  src={img}
                  alt={`${product.Product} ${index + 1}`}
                  className="h-12 w-12 object-cover sm:h-14 sm:w-14"
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
              <span className="ml-2 rounded bg-gray-100 px-2 py-0.5">
                {isEnglish ? variations[0] : products[0].Variation_CH || variations[0]}
              </span>
            </div>
          ) : null}

          {origins.length > 1 ? (
            <select
              className="w-full rounded border p-2 text-sm"
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
              <div className="flex items-stretch overflow-hidden rounded-md border bg-white w-fit">
                  <button
                    className="flex h-10 w-10 shrink-0 items-center justify-center bg-gray-100 text-base font-semibold hover:bg-gray-200"
                    onClick={() => {
                      if (currentQuantity > 1) onUpdateQuantity(product.id, currentQuantity - 1);
                      else if (currentQuantity === 1) onUpdateQuantity(product.id, 0);
                    }}
                  >
                    −
                  </button>

                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className="w-16 border-x bg-white text-center text-base font-semibold outline-none [appearance:textfield] sm:w-20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                    className="flex h-10 w-10 shrink-0 items-center justify-center bg-gray-100 text-base font-semibold hover:bg-gray-200"
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
                className="flex h-10 items-center justify-center rounded-md bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 lg:h-10 lg:w-10"
                title={isEnglish ? "Inquire via WhatsApp" : "通过WhatsApp询价"}
                onClick={() =>
                  onCustomerService({
                    productName: product.Product,
                    variation: product.Variation,
                    origin: originDisplayName || product.Country,
                    weight: product.weight,
                  })
                }
              >
                <WhatsAppIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

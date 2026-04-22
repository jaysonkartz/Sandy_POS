import React, { useMemo, useState } from "react";
import type { Product, ProductGroup, SelectedOptions, CountryMap } from "@/app/types/product";

interface Props {
  group: ProductGroup;
  isEnglish: boolean;
  selectedOptions: SelectedOptions;
  currentQuantityByProductId: Record<number, number>;
  countryMap: CountryMap;
  isSessionValid: boolean;
  isLoggingIn: boolean;
  userRole: string;
  reorderedProductIds: number[];
  onOptionChange: (
    groupKey: string,
    type: "variation" | "countryId" | "weight",
    value: string
  ) => void;
  onAddToOrder: (product: Product) => void;
  onUpdateQuantity: (productId: number, qty: number) => void;
  onCustomerService: () => void;
  onOpenPhotoEditor: (product: Product) => void;
  onOpenSignupModal: () => void;
}

export const ProductCard = ({
  group,
  isEnglish,
  selectedOptions,
  currentQuantityByProductId,
  countryMap,
  isSessionValid,
  isLoggingIn,
  userRole,
  reorderedProductIds,
  onOptionChange,
  onAddToOrder,
  onUpdateQuantity,
  onCustomerService,
  onOpenPhotoEditor,
  onOpenSignupModal,
}: Props) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const allVariations = useMemo(() => {
    return Array.from(
      new Set(group.products.map((p) => p.Variation).filter(Boolean))
    ) as string[];
  }, [group.products]);

  const allCountries = useMemo(() => {
    return Array.from(
      new Set(group.products.map((p) => p.Country).filter(Boolean))
    ) as string[];
  }, [group.products]);

  const allWeights = useMemo(() => {
    return Array.from(
      new Set(group.products.map((p) => p.weight).filter(Boolean))
    ) as string[];
  }, [group.products]);

  const selectedVariation = selectedOptions[group.groupKey]?.variation ?? "";
  const selectedCountry = selectedOptions[group.groupKey]?.countryId ?? "";
  const selectedWeight = selectedOptions[group.groupKey]?.weight ?? "";

  const matchedProduct =
    group.products.find((p) => {
      const variationMatch = selectedVariation ? p.Variation === selectedVariation : true;
      const countryMatch = selectedCountry ? p.Country === selectedCountry : true;
      const weightMatch = selectedWeight ? p.weight === selectedWeight : true;
      return variationMatch && countryMatch && weightMatch;
    }) ??
    group.products[0];

  const product = matchedProduct;

  const quantity = currentQuantityByProductId[product.id] || 0;

  const productImages = useMemo(() => {
    const gallery = (product.product_images ?? [])
      .filter((img) => !!img.image_url)
      .sort((a, b) => a.sort_order - b.sort_order);

    if (gallery.length > 0) return gallery;

    return product.image_url
      ? [
          {
            id: 0,
            product_id: product.id,
            image_url: product.image_url,
            sort_order: 0,
            is_cover: true,
          },
        ]
      : [];
  }, [product]);

  const activeImage =
    productImages[activeImageIndex]?.image_url ||
    product.image_url ||
    "/product-placeholder.svg";

  const displayName = isEnglish ? product.Product : product.Product_CH || product.Product;
  const displayVariation = isEnglish
    ? product.Variation
    : product.Variation_CH || product.Variation;
  const displayCountry = isEnglish
    ? countryMap[product.Country]?.name || product.Country
    : countryMap[product.Country]?.chineseName || product.Country_CH || product.Country;

  const handleChange = (
    type: "variation" | "countryId" | "weight",
    value: string
  ) => {
    onOptionChange(group.groupKey, type, value);
    setActiveImageIndex(0);
  };

  const canOrder = isSessionValid || userRole === "admin";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="relative aspect-square bg-gray-100">
        <img
          src={activeImage}
          alt={displayName}
          className="h-full w-full object-cover"
        />

        {userRole === "admin" && (
          <button
            type="button"
            onClick={() => onOpenPhotoEditor(product)}
            className="absolute right-2 top-2 rounded-full bg-blue-600 p-2 text-white shadow"
            aria-label="Edit photo"
          >
            📷
          </button>
        )}
      </div>

      {productImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-3 pt-2">
          {productImages.map((img, index) => (
            <button
              key={`${img.id}-${index}`}
              type="button"
              onClick={() => setActiveImageIndex(index)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded border-2 ${
                index === activeImageIndex ? "border-blue-500" : "border-gray-200"
              }`}
            >
              <img
                src={img.image_url || "/product-placeholder.svg"}
                alt={`${displayName} ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 min-h-[3.5rem] text-base font-semibold leading-6 text-gray-900">
          {displayName}
        </h3>

        <div className="mt-3">
          <div className="text-3xl font-bold tracking-tight text-gray-900">
            ${Number(product.price || 0).toFixed(2)}
          </div>
          <div className="mt-1 text-sm font-semibold text-gray-500">/{product.uom || product.UOM}</div>
        </div>

        <div className="mt-4 space-y-3">
  {(allVariations.length > 0 || product.Variation) && (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2">
      <span className="text-[11px] uppercase tracking-wide text-gray-400 sm:min-w-[70px]">
        {isEnglish ? "Type" : "规格"}
      </span>

      {allVariations.length > 1 ? (
        <select
          className="w-full rounded-lg border border-gray-300 p-2 text-sm sm:flex-1"
          value={selectedVariation || product.Variation || ""}
          onChange={(e) => handleChange("variation", e.target.value)}
        >
          {allVariations.map((variation) => {
            const match = group.products.find((p) => p.Variation === variation);
            const label = isEnglish
              ? variation
              : match?.Variation_CH || variation;

            return (
              <option key={variation} value={variation}>
                {label}
              </option>
            );
          })}
        </select>
      ) : (
        <div className="text-sm text-gray-700 sm:flex-1">
          {isEnglish
            ? product.Variation || "-"
            : product.Variation_CH || product.Variation || "-"}
        </div>
      )}
    </div>
  )}

  {(allCountries.length > 0 || product.Country) && (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2">
      <span className="text-[11px] uppercase tracking-wide text-gray-400 sm:min-w-[70px]">
        {isEnglish ? "Origin" : "产地"}
      </span>

      {allCountries.length > 1 ? (
        <select
          className="w-full rounded-lg border border-gray-300 p-2 text-sm sm:flex-1"
          value={selectedCountry || product.Country || ""}
          onChange={(e) => handleChange("countryId", e.target.value)}
        >
          {allCountries.map((country) => (
            <option key={country} value={country}>
              {isEnglish
                ? countryMap[country]?.name || country
                : countryMap[country]?.chineseName || country}
            </option>
          ))}
        </select>
      ) : (
        <div className="text-sm text-gray-700 sm:flex-1">
          {isEnglish
            ? countryMap[product.Country]?.name || product.Country || "-"
            : countryMap[product.Country]?.chineseName ||
              product.Country_CH ||
              product.Country ||
              "-"}
        </div>
      )}
    </div>
  )}

  {(allWeights.length > 0 || product.weight) && (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2">
      <span className="text-[11px] uppercase tracking-wide text-gray-400 sm:min-w-[70px]">
        {isEnglish ? "Weight" : "重量"}
      </span>

      {allWeights.length > 1 ? (
        <select
          className="w-full rounded-lg border border-gray-300 p-2 text-sm sm:flex-1"
          value={selectedWeight || product.weight || ""}
          onChange={(e) => handleChange("weight", e.target.value)}
        >
          {allWeights.map((weight) => (
            <option key={weight} value={weight}>
              {weight}
            </option>
          ))}
        </select>
      ) : (
        <div className="text-sm text-gray-700 sm:flex-1">
          {product.weight || "-"}
        </div>
      )}
    </div>
  )}
</div>



        <div className="mt-auto pt-4">
          {!canOrder ? (
            <button
              type="button"
              onClick={onOpenSignupModal}
              disabled={isLoggingIn}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isLoggingIn
                ? isEnglish
                  ? "Loading..."
                  : "处理中..."
                : isEnglish
                ? "Sign in to order"
                : "登录后下单"}
            </button>
          ) : quantity <= 0 ? (
            <button
              type="button"
              onClick={() => onAddToOrder(product)}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white"
            >
              {isEnglish ? "Add to Cart" : "加入购物车"}
            </button>
          ) : (
            <div className="flex items-center overflow-hidden rounded-xl border border-gray-300">
              <button
                type="button"
                onClick={() => onUpdateQuantity(product.id, Math.max(0, quantity - 1))}
                className="h-12 w-12 shrink-0 text-xl font-semibold text-gray-700"
              >
                −
              </button>
              <div className="flex h-12 flex-1 items-center justify-center border-x border-gray-300 text-lg font-semibold">
                {quantity}
              </div>
              <button
                type="button"
                onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                className="h-12 w-12 shrink-0 text-xl font-semibold text-gray-700"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
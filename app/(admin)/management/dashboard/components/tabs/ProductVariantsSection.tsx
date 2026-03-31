"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/react";
import { supabase } from "@/app/lib/supabaseClient";
import VariantManager from "@/app/components/VariantManager";
import VariantExtractor from "@/app/components/VariantExtractor";
import { ProductVariant } from "@/app/types/product";
import type { Category, Product } from "../../types";

export type ProductVariantsSectionProps = {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  fetchCategories: () => Promise<void>;
};

export function ProductVariantsSection({
  categories,
  setCategories,
  fetchCategories,
}: ProductVariantsSectionProps) {
  const [variantMap, setVariantMap] = useState<Record<number, ProductVariant[]>>({});
  const [loadedVariantProductIds, setLoadedVariantProductIds] = useState<Set<number>>(new Set());
  const [loadingVariantProductIds, setLoadingVariantProductIds] = useState<Set<number>>(new Set());
  const loadedVariantProductIdsRef = useRef<Set<number>>(new Set());

  const fetchVariantsByProductIds = useCallback(async (productIds: number[]) => {
    const ids = Array.from(new Set(productIds.filter((id) => Number.isFinite(id))));
    if (ids.length === 0) return {} as Record<number, ProductVariant[]>;

    try {
      const { data, error: fetchError } = await supabase
        .from("product_variants")
        .select("*")
        .in("product_id", ids)
        .order("created_at", { ascending: true });

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          return {} as Record<number, ProductVariant[]>;
        }
        throw fetchError;
      }

      const grouped: Record<number, ProductVariant[]> = {};
      (data || []).forEach((variant: ProductVariant & { product_id: number }) => {
        if (!grouped[variant.product_id]) {
          grouped[variant.product_id] = [];
        }
        grouped[variant.product_id].push(variant);
      });

      return grouped;
    } catch {
      return {} as Record<number, ProductVariant[]>;
    }
  }, []);

  const ensureVariantsLoaded = useCallback(
    async (productIds: number[], options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      const toLoad = Array.from(
        new Set(
          productIds.filter(
            (id) => Number.isFinite(id) && !loadedVariantProductIdsRef.current.has(id)
          )
        )
      );
      if (toLoad.length === 0) return;

      if (!silent) {
        setLoadingVariantProductIds((prev) => {
          const next = new Set(prev);
          toLoad.forEach((id) => next.add(id));
          return next;
        });
      }

      try {
        const variantsByProductId = await fetchVariantsByProductIds(toLoad);
        setVariantMap((prev) => {
          const next = { ...prev };
          for (const [pid, list] of Object.entries(variantsByProductId)) {
            next[Number(pid)] = list;
          }
          return next;
        });
        setLoadedVariantProductIds((prev) => {
          const next = new Set(prev);
          toLoad.forEach((id) => next.add(id));
          return next;
        });
      } finally {
        if (!silent) {
          setLoadingVariantProductIds((prev) => {
            const next = new Set(prev);
            toLoad.forEach((id) => next.delete(id));
            return next;
          });
        }
      }
    },
    [fetchVariantsByProductIds]
  );

  const variantsForProduct = useCallback(
    (product: Product): ProductVariant[] => {
      const fromParent = product.variants;
      if (Array.isArray(fromParent) && fromParent.length > 0) return fromParent;
      return variantMap[product.id] ?? [];
    },
    [variantMap]
  );

  const clearVariantCache = useCallback(() => {
    setVariantMap({});
    setLoadedVariantProductIds(new Set());
    loadedVariantProductIdsRef.current = new Set();
  }, []);

  useEffect(() => {
    loadedVariantProductIdsRef.current = loadedVariantProductIds;
  }, [loadedVariantProductIds]);

  const [useNewVariantSystem, setUseNewVariantSystem] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<number | null>(null);

  const productVariantOptions = useMemo(() => {
    const uniqueProducts = new Map<string, Product & { categoryName: string }>();
    categories.forEach((category) => {
      category.products.forEach((product) => {
        const productNameKey = (product.Product || "").trim().toLowerCase();
        const categoryKey = (category.name || "").trim().toLowerCase();
        const dedupeKey = `${productNameKey}::${categoryKey}`;

        if (!uniqueProducts.has(dedupeKey)) {
          uniqueProducts.set(dedupeKey, {
            ...product,
            categoryName: category.name,
          });
        }
      });
    });
    return Array.from(uniqueProducts.values());
  }, [categories]);

  /** Avoid depending on `productVariantOptions` identity in effects — it churns whenever `categories` refreshes (e.g. customer offers) and must not retrigger variant UI logic. */
  const productVariantOptionsRef = useRef(productVariantOptions);
  productVariantOptionsRef.current = productVariantOptions;
  const productVariantOptionCount = productVariantOptions.length;

  useEffect(() => {
    if (selectedProductForVariants !== null || productVariantOptionCount === 0) return;
    const first = productVariantOptionsRef.current[0];
    if (!first) return;
    setSelectedProductForVariants(first.id);
  }, [productVariantOptionCount, selectedProductForVariants]);

  useEffect(() => {
    if (!selectedProductForVariants) return;
    void ensureVariantsLoaded([selectedProductForVariants]);
  }, [ensureVariantsLoaded, selectedProductForVariants]);

  const refetchProductsAfterVariantChange = useCallback(async () => {
    await fetchCategories();
    clearVariantCache();
    if (selectedProductForVariants != null) {
      await ensureVariantsLoaded([selectedProductForVariants]);
    }
  }, [clearVariantCache, ensureVariantsLoaded, fetchCategories, selectedProductForVariants]);

  return (
    <section aria-labelledby="product-variants-heading" className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900" id="product-variants-heading">
          Product variants
        </h2>
        <label className="hidden items-center text-sm">
          <input
            checked={useNewVariantSystem}
            className="mr-2"
            type="checkbox"
            onChange={(e) => setUseNewVariantSystem(e.target.checked)}
          />
          Use New Variant System
        </label>
      </div>

      <Autocomplete
  aria-label="Select product to manage variants"
  className="w-full"
  classNames={{
    base: "w-full",
    popoverContent: "bg-white overflow-hidden",
    listboxWrapper: "p-0 overflow-hidden max-h-[280px]",
    listbox: "max-h-[280px] overflow-y-auto",
    selectorButton: "h-auto min-h-12",
  }}
  inputProps={{
    classNames: {
      inputWrapper: "min-h-12 h-auto py-2",
      input: "truncate",
    },
  }}
  items={productVariantOptions}
  listboxProps={{
    itemClasses: {
      base: "h-auto min-h-12 py-2 data-[hover=true]:bg-blue-50 data-[hover=true]:text-blue-700",
      wrapper: "h-auto",
      title: "whitespace-normal break-words leading-5",
    },
  }}
  placeholder="-- Select a Product --"
  selectedKey={
    selectedProductForVariants !== null ? String(selectedProductForVariants) : null
  }
  onSelectionChange={(key) => {
    if (!key) {
      setSelectedProductForVariants(null);
      return;
    }
    const newProductId = Number(key);
    if (Number.isNaN(newProductId)) return;
    setSelectedProductForVariants(newProductId);
  }}
>
  {(item) => (
    <AutocompleteItem
      key={String(item.id)}
      className="h-auto py-2"
      textValue={`${item.Product} ${item.Variation || ""} ${item.countryName || ""} ${
        item.weight || ""
      } ${item.categoryName || ""}`}
    >
      {item.Product} {item.categoryName ? `(${item.categoryName})` : ""}
    </AutocompleteItem>
  )}
</Autocomplete>
      {(() => {
        if (!selectedProductForVariants) return null;

        const selectedProductData = categories
          .flatMap((c: Category) => c.products)
          .find((p) => p.id === selectedProductForVariants);
        const isLoadingSelectedVariants = loadingVariantProductIds.has(selectedProductForVariants);

        if (!selectedProductData) return null;

        return (
          <>
            {isLoadingSelectedVariants && (
              <div className="mt-2 mb-2 inline-flex items-center gap-2 text-sm text-blue-600">
                <span className="inline-block h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                Loading variants...
              </div>
            )}

            <div className="mt-4">
              {useNewVariantSystem ? (
                <VariantManager
                  productId={selectedProductForVariants}
                  variants={variantsForProduct(selectedProductData)}
                  onRefetchProducts={refetchProductsAfterVariantChange}
                  onVariantsChange={(newVariants) => {
                    setCategories((prevCategories) =>
                      prevCategories.map((category) => ({
                        ...category,
                        products: category.products.map((p) =>
                          p.id === selectedProductForVariants ? { ...p, variants: newVariants } : p
                        ),
                      }))
                    );
                  }}
                />
              ) : (
                <VariantExtractor
                  productId={selectedProductForVariants}
                  productName={selectedProductData.Product}
                  onVariantsChange={() => {
                    // Variants updated
                  }}
                />
              )}
            </div>
          </>
        );
      })()}
    </section>
  );
}

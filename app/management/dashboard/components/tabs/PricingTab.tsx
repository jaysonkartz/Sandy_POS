"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/react";
import toast from "react-hot-toast";
import { supabase } from "@/app/lib/supabaseClient";
import VariantManager from "@/components/VariantManager";
import VariantExtractor from "@/components/VariantExtractor";
import { ProductVariant } from "@/app/types/product";
import type { Category, Product } from "../../types";
import { PricingCategorySection } from "./PricingCategorySection";

export type PricingTabProps = {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  countryMap: { [key: string]: { name: string; chineseName?: string } };
  /** Incremented when variant data may have changed; resets lazy variant cache */
  pricingDataVersion: number;
  /** Call after variant CRUD so the lazy variant cache is invalidated */
  bumpVariantCacheVersion: () => void;
  fetchCategories: () => Promise<void>;
  error: string | null;
  isLoading: boolean;
  insertPriceOffersWithFallback: (
    offers: Array<{
      customer_id: string;
      product_id: number;
      offered_price: number;
      previous_price: number;
      created_at?: string;
    }>
  ) => Promise<void>;
  getReadableErrorMessage: (error: unknown, fallback: string) => string;
};

export default function PricingTab(props: PricingTabProps) {
  const {
    categories,
    setCategories,
    countryMap,
    pricingDataVersion,
    bumpVariantCacheVersion,
    fetchCategories,
    error,
    isLoading,
    insertPriceOffersWithFallback,
    getReadableErrorMessage,
  } = props;

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

  useEffect(() => {
    setVariantMap({});
    setLoadedVariantProductIds(new Set());
    loadedVariantProductIdsRef.current = new Set();
  }, [pricingDataVersion]);

  useEffect(() => {
    loadedVariantProductIdsRef.current = loadedVariantProductIds;
  }, [loadedVariantProductIds]);

  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const [offerPrices, setOfferPrices] = useState<{ [key: string]: number | null }>({});
  const [useNewVariantSystem, setUseNewVariantSystem] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<number | null>(null);
  const [allCustomers, setAllCustomers] = useState<
    Array<{
      id: string | number;
      name: string;
      phone?: string | null;
      email?: string | null;
      user_id?: string | null;
    }>
  >([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [selectedCustomersForOffer, setSelectedCustomersForOffer] = useState<{
    [productId: number]: string[];
  }>({});
  const [customerOfferSearchQuery, setCustomerOfferSearchQuery] = useState<{
    [productId: number]: string;
  }>({});
  const [customPriceForSelectedCustomer, setCustomPriceForSelectedCustomer] = useState<{
    [key: string]: number | null;
  }>({});
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<{
    [productId: number]: boolean;
  }>({});
  const [savingProductIds, setSavingProductIds] = useState<Set<number>>(new Set());
  const [hasAttemptedCustomerLoad, setHasAttemptedCustomerLoad] = useState(false);

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

  const fetchAllCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("customers")
        .select("id, name, phone, email, user_id")
        .order("name", { ascending: true });

      if (fetchError) {
        toast.error(
          `Failed to load customers: ${fetchError.message}${fetchError.details ? ` (${fetchError.details})` : ""}`
        );
        setIsLoadingCustomers(false);
        return;
      }

      if (data && Array.isArray(data)) {
        const formattedCustomers = data
          .filter(
            (customer: { id?: string | number | null }) =>
              customer && customer.id !== null && customer.id !== undefined
          )
          .map(
            (customer: {
              id: string | number;
              name?: string | null;
              phone?: string | null;
              email?: string | null;
              user_id?: string | null;
            }) => ({
              id: String(customer.id),
              name: customer.name?.trim() || customer.email?.split("@")[0] || "Unnamed Customer",
              phone: customer.phone || null,
              email: customer.email || null,
              user_id: customer.user_id || null,
            })
          );

        const dedupedCustomers = Array.from(
          new Map(formattedCustomers.map((customer) => [String(customer.id), customer])).values()
        );

        setAllCustomers(dedupedCustomers);
      } else {
        setAllCustomers([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to load customers: ${errorMessage}`);
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProductForVariants !== null || productVariantOptions.length === 0) return;
    setSelectedProductForVariants(productVariantOptions[0].id);
  }, [productVariantOptions, selectedProductForVariants]);

  useEffect(() => {
    setOfferPrices({});
  }, [selectedProduct]);

  useEffect(() => {
    // Eager-load once; if still empty, retry when user opens a product row.
    const shouldEagerLoad = !hasAttemptedCustomerLoad;
    const shouldRetryForOffers =
      selectedProduct !== null && allCustomers.length === 0 && !isLoadingCustomers;

    if (isLoadingCustomers || (!shouldEagerLoad && !shouldRetryForOffers)) {
      return;
    }

    if (shouldEagerLoad) {
      setHasAttemptedCustomerLoad(true);
    }
    void fetchAllCustomers();
  }, [
    allCustomers.length,
    fetchAllCustomers,
    hasAttemptedCustomerLoad,
    isLoadingCustomers,
    selectedProduct,
  ]);

  useEffect(() => {
    if (!selectedProductForVariants) return;
    void ensureVariantsLoaded([selectedProductForVariants]);
  }, [ensureVariantsLoaded, pricingDataVersion, selectedProductForVariants]);

  const refetchProductsAfterVariantChange = useCallback(async () => {
    await fetchCategories();
    bumpVariantCacheVersion();
  }, [bumpVariantCacheVersion, fetchCategories]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Product List</h2>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-gray-700 text-lg">Product Variants:</h4>
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

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Product to Manage Variants:
          </label>
          <Autocomplete
            aria-label="Select product to manage variants"
            className="w-full max-w-md"
            classNames={{
              popoverContent: "bg-white/100",
              listboxWrapper: "bg-white/100",
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
        </div>

        {(() => {
          if (!selectedProductForVariants) return null;

          const selectedProductData = categories
            .flatMap((c: Category) => c.products)
            .find((p) => p.id === selectedProductForVariants);
          const isLoadingSelectedVariants = loadingVariantProductIds.has(
            selectedProductForVariants
          );

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
                      // Update the product in the categories state
                      setCategories((prevCategories) =>
                        prevCategories.map((category) => ({
                          ...category,
                          products: category.products.map((p) =>
                            p.id === selectedProductForVariants
                              ? { ...p, variants: newVariants }
                              : p
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
      </div>

      <div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {categories.length === 0 && !error && !isLoading && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            No categories found.
          </div>
        )}
        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!isLoading && categories.length > 0 && (
          <div className="space-y-6">
            {categories.map((category) => (
              <PricingCategorySection
                key={category.id}
                allCustomers={allCustomers}
                category={category}
                countryMap={countryMap}
                customerOfferSearchQuery={customerOfferSearchQuery}
                customPriceForSelectedCustomer={customPriceForSelectedCustomer}
                editingPrice={editingPrice}
                editingProductId={editingProductId}
                fetchAllCustomers={fetchAllCustomers}
                fetchCategories={fetchCategories}
                getReadableErrorMessage={getReadableErrorMessage}
                insertPriceOffersWithFallback={insertPriceOffersWithFallback}
                isCustomerDropdownOpen={isCustomerDropdownOpen}
                isLoadingCustomers={isLoadingCustomers}
                offerPrices={offerPrices}
                savingProductIds={savingProductIds}
                selectedCustomersForOffer={selectedCustomersForOffer}
                selectedProduct={selectedProduct}
                setCustomerOfferSearchQuery={setCustomerOfferSearchQuery}
                setCustomPriceForSelectedCustomer={setCustomPriceForSelectedCustomer}
                setEditingPrice={setEditingPrice}
                setEditingProductId={setEditingProductId}
                setIsCustomerDropdownOpen={setIsCustomerDropdownOpen}
                setOfferPrices={setOfferPrices}
                setSavingProductIds={setSavingProductIds}
                setSelectedCustomersForOffer={setSelectedCustomersForOffer}
                setSelectedProduct={setSelectedProduct}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/app/lib/supabaseClient";
import type { Category } from "../../types";
import { PricingCategorySection } from "./PricingCategorySection";

export type CustomPriceOffersSectionProps = {
  categories: Category[];
  countryMap: { [key: string]: { name: string; chineseName?: string } };
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

export function CustomPriceOffersSection({
  categories,
  countryMap,
  fetchCategories,
  error,
  isLoading,
  insertPriceOffersWithFallback,
  getReadableErrorMessage,
}: CustomPriceOffersSectionProps) {
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const [offerPrices, setOfferPrices] = useState<{ [key: string]: number | null }>({});
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

  return (
    <section aria-labelledby="custom-price-offers-heading" className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900" id="custom-price-offers-heading">
        Product list and custom price offers
      </h2>

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
    </section>
  );
}

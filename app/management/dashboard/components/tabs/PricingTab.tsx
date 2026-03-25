"use client";

import React from "react";
import type { Category } from "../../types";
import { CustomPriceOffersSection } from "./CustomPriceOffersSection";
import { ProductVariantsSection } from "./ProductVariantsSection";

export type PricingTabProps = {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
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

export default function PricingTab(props: PricingTabProps) {
  const {
    categories,
    setCategories,
    countryMap,
    fetchCategories,
    error,
    isLoading,
    insertPriceOffersWithFallback,
    getReadableErrorMessage,
  } = props;

  return (
    <div className="space-y-6">
      <ProductVariantsSection
        categories={categories}
        fetchCategories={fetchCategories}
        setCategories={setCategories}
      />
      <CustomPriceOffersSection
        categories={categories}
        countryMap={countryMap}
        error={error}
        fetchCategories={fetchCategories}
        getReadableErrorMessage={getReadableErrorMessage}
        insertPriceOffersWithFallback={insertPriceOffersWithFallback}
        isLoading={isLoading}
      />
    </div>
  );
}

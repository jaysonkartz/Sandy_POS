import React, { memo, useMemo } from "react";
import type { Product, ProductGroup } from "@/app/types/product";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  productGroups: ProductGroup[];
  isEnglish: boolean;
  isSessionValid: boolean;
  userRole: string;
  selectedOptions: {
    [groupKey: string]: { variation?: string; countryId?: string; weight?: string };
  };
  selectedProducts: { product: Product; quantity: number }[];
  countryMap: { [key: string]: { name: string; chineseName: string } };
  isLoggingIn: boolean;
  reorderedProductIds?: number[];
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

export const ProductGrid = memo<ProductGridProps>(
  ({
    productGroups,
    isEnglish,
    isSessionValid,
    userRole,
    selectedOptions,
    selectedProducts,
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
    const quantityByProductId = useMemo(() => {
      const result: Record<number, number> = {};
      selectedProducts.forEach(({ product, quantity }) => {
        result[product.id] = quantity;
      });
      return result;
    }, [selectedProducts]);

    const categoryDisplayGroups: Record<string, ProductGroup[]> = useMemo(() => {
      const grouped: Record<string, ProductGroup[]> = {};

      productGroups.forEach((group) => {
        if (!grouped[group.category]) {
          grouped[group.category] = [];
        }
        grouped[group.category].push(group);
      });

      return grouped;
    }, [productGroups]);

    return (
      <div className="space-y-8">
        {Object.entries(categoryDisplayGroups).map(([category, groups]) => (
          <section key={category} className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
                {isEnglish ? category : groups[0]?.products[0]?.Category_CH || category}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {groups.map((group) => (
                <ProductCard
                  key={group.groupKey}
                  countryMap={countryMap}
                  currentQuantityByProductId={quantityByProductId}
                  group={group}
                  isEnglish={isEnglish}
                  isLoggingIn={isLoggingIn}
                  isSessionValid={isSessionValid}
                  reorderedProductIds={reorderedProductIds}
                  selectedOptions={selectedOptions}
                  userRole={userRole}
                  onAddToOrder={onAddToOrder}
                  onCustomerService={onCustomerService}
                  onOpenPhotoEditor={onOpenPhotoEditor}
                  onOpenSignupModal={onOpenSignupModal}
                  onOptionChange={onOptionChange}
                  onUpdateQuantity={onUpdateQuantity}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }
);

ProductGrid.displayName = "ProductGrid";
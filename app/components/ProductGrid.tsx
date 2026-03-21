import React, { memo, useMemo } from "react";
import { ProductCard } from "./ProductCard";

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

interface ProductGridProps {
  productGroups: ProductGroup[];
  isEnglish: boolean;
  isSessionValid: boolean;
  userRole: string;
  selectedOptions: { [title: string]: { variation?: string; countryId?: string; weight?: string } };
  selectedProducts: { product: Product; quantity: number }[];
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

  const categoryDisplayGroups: { [category: string]: typeof productGroups } = {};
  productGroups.forEach((group) => {
    if (!categoryDisplayGroups[group.category]) {
      categoryDisplayGroups[group.category] = [];
    }
    categoryDisplayGroups[group.category].push(group);
  });

  return (
    <div className="space-y-8">
      {Object.entries(categoryDisplayGroups).map(([category, groups]) => (
        <div key={category} className="space-y-4">
          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
              {isEnglish ? category : groups[0]?.products[0]?.Category_CH || category}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 [@media(min-width:480px)]:grid-cols-4 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {groups.map((group) => (
              <ProductCard
                key={group.title}
                group={group}
                isEnglish={isEnglish}
                isSessionValid={isSessionValid}
                userRole={userRole}
                selectedOptions={selectedOptions}
                currentQuantityByProductId={quantityByProductId}
                countryMap={countryMap}
                isLoggingIn={isLoggingIn}
                onOptionChange={onOptionChange}
                onAddToOrder={onAddToOrder}
                onUpdateQuantity={onUpdateQuantity}
                onCustomerService={onCustomerService}
                onOpenPhotoEditor={onOpenPhotoEditor}
                onOpenSignupModal={onOpenSignupModal}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

ProductGrid.displayName = "ProductGrid";
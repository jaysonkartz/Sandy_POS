import React, { memo } from "react";
import { ProductCard } from "./ProductCard";

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

interface ProductGridProps {
  productGroups: ProductGroup[];
  isEnglish: boolean;
  isSessionValid: boolean;
  userRole: string;
  selectedOptions: { [title: string]: { variation?: string; countryId?: string; weight?: string } };
  selectedProducts: { product: Product; quantity: number }[];
  countryMap: { [key: string]: { name: string; chineseName: string } };
  isLoggingIn: boolean;
  onOptionChange: (title: string, type: "variation" | "countryId" | "weight", value: string) => void;
  onAddToOrder: (product: Product) => void;
  onUpdateQuantity: (productId: number, newQuantity: number) => void;
  onCustomerService: () => void;
  onOpenPhotoEditor: (product: Product) => void;
  onOpenSignupModal: () => void;
}

export const ProductGrid = memo<ProductGridProps>(({
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
  // Group products by category for display
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
          {/* Category Header */}
          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-2xl font-bold text-gray-800">
              {isEnglish ? category : groups[0]?.products[0]?.Category_CH || category}
            </h2>
          </div>

          {/* Products in this category */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groups.map((group) => (
              <ProductCard
                key={group.title}
                group={group}
                isEnglish={isEnglish}
                isSessionValid={isSessionValid}
                userRole={userRole}
                selectedOptions={selectedOptions}
                selectedProducts={selectedProducts}
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

import React, { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { CATEGORY_ID_NAME_MAP } from "@/app/(admin)/const/category";
import { CATEGORY_MAP } from "@/app/constants/app-constants";

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

const getCategoryName = (category: string | number) => {
  return CATEGORY_ID_NAME_MAP[String(category)] || "Unknown Category";
};

export const ProductCard = memo<ProductCardProps>(({
  group,
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
  const { title, products: groupProducts } = group;

  // Helper to get selected product based on dropdowns
  const getSelectedProduct = useCallback(() => {
    const selected = selectedOptions[title] || {};
    let product = groupProducts.find(
      (p) =>
        (!selected.variation || p.Variation === selected.variation) &&
        (!selected.countryId || p.Country === selected.countryId) &&
        (!selected.weight || p.weight === selected.weight)
    );
    return product || groupProducts[0];
  }, [groupProducts, selectedOptions, title]);

  const product = getSelectedProduct();
  const variations = [...new Set(groupProducts.map((p) => p.Variation).filter(Boolean))];
  const origins = [...new Set(groupProducts.map((p) => p.Country).filter(Boolean))];
  const weights = [...new Set(groupProducts.map((p) => p.weight).filter(Boolean))];

  const handleOptionChange = useCallback((
    type: "variation" | "countryId" | "weight",
    value: string
  ) => {
    onOptionChange(title, type, value);
  }, [onOptionChange, title]);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      aria-label={`${isEnglish ? product.Product : product.Product_CH} product card`}
      className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl"
      initial={{ opacity: 0, y: 20 }}
      role="article"
      transition={{ duration: 0.3 }}
    >
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100">
        <ProductImage
          alt={isEnglish ? product.Product : product.Product_CH || product.Product}
          className="w-full h-full object-cover"
          src={
            product.image_url ||
            `/Img/${getCategoryName(product.Category)}/${product.Product}${product.Variation ? ` (${product.Variation})` : ""}.png`
          }
        />

        {/* Photo Editor Button - Only show for admin users */}
        {isSessionValid && userRole === "ADMIN" && (
          <button
            className="absolute top-2 right-2 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors shadow-lg"
            title={isEnglish ? "Edit Photo (Admin Only)" : "编辑照片（仅管理员）"}
            onClick={() => onOpenPhotoEditor(product)}
          >
            <Camera className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex-grow">
          <h3 className="text-xl font-bold text-gray-800 truncate">
            {isEnglish ? product.Product : product.Product_CH}
          </h3>
          <p className="text-xs text-gray-400 mb-3">{product["Item Code"]}</p>

          {/* Dropdowns */}
          <div className="space-y-2 mb-4">
            {variations.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500">
                  {isEnglish ? "Variation" : "规格"}
                </label>
                <select
                  className="w-full p-2 mt-1 text-sm border-gray-200 border bg-gray-50 rounded-md focus:border-blue-500 focus:ring-blue-500 transition"
                  value={selectedOptions[title]?.variation || variations[0]}
                  onChange={(e) => handleOptionChange("variation", e.target.value)}
                >
                  {variations.map((v) => (
                    <option key={v} value={v}>
                      {isEnglish
                        ? v
                        : groupProducts.find((p) => p.Variation === v)?.Variation_CH || v}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {origins.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500">
                  {isEnglish ? "Origin" : "产地"}
                </label>
                <select
                  className="w-full p-2 mt-1 text-sm border-gray-200 border bg-gray-50 rounded-md focus:border-blue-500 focus:ring-blue-500 transition"
                  value={selectedOptions[title]?.countryId || origins[0]}
                  onChange={(e) => handleOptionChange("countryId", e.target.value)}
                >
                  {origins.map((o) => (
                    <option key={o} value={o}>
                      {isEnglish
                        ? countryMap[o]?.name || o
                        : countryMap[o]?.chineseName || o}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {weights.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500">
                  {isEnglish ? "Weight" : "重量"}
                </label>
                <select
                  className="w-full p-2 mt-1 text-sm border-gray-200 border bg-gray-50 rounded-md focus:border-blue-500 focus:ring-blue-500 transition"
                  value={selectedOptions[title]?.weight || weights[0]}
                  onChange={(e) => handleOptionChange("weight", e.target.value)}
                >
                  {weights.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Price */}
          {isSessionValid && (
            <div className="mb-4">
              <p className="text-2xl font-extrabold text-gray-800">
                ${product.price.toFixed(2)}
                <span className="text-base font-medium text-gray-500">
                  /{product.UOM}
                </span>
              </p>
            </div>
          )}
        </div>

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
            <div className="flex items-center justify-between w-full gap-1 py-3 px-3 rounded-lg">
              {/* Left: Quantity controls */}
              <div className="flex items-center gap-4">
                {/* Minus button */}
                <button
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors text-base font-semibold min-w-[40px] h-10 flex items-center justify-center"
                  onClick={() => {
                    const existingProduct = selectedProducts.find(
                      (p) => p.product.id === product.id
                    );
                    if (existingProduct && existingProduct.quantity > 1) {
                      onUpdateQuantity(product.id, existingProduct.quantity - 1);
                    } else if (existingProduct && existingProduct.quantity === 1) {
                      onUpdateQuantity(product.id, 0);
                    }
                  }}
                >
                  -
                </button>

                {/* Editable quantity input */}
                {selectedProducts.find((p) => p.product.id === product.id) ? (
                  <input
                    className="w-28 text-center px-3 py-2 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 h-10 bg-transparent"
                    min="1"
                    type="number"
                    value={
                      selectedProducts.find((p) => p.product.id === product.id)?.quantity || 0
                    }
                    onBlur={(e) => {
                      const newQuantity = parseInt(e.target.value) || 0;
                      if (newQuantity < 1) {
                        onUpdateQuantity(product.id, 1);
                      }
                    }}
                    onChange={(e) => {
                      const newQuantity = parseInt(e.target.value) || 0;
                      if (newQuantity > 0) {
                        onUpdateQuantity(product.id, newQuantity);
                      } else if (newQuantity === 0) {
                        onUpdateQuantity(product.id, 0);
                      }
                    }}
                  />
                ) : (
                  <input
                    className="w-28 text-center px-3 py-2 text-base font-semibold focus:outline-none text-gray-400 h-10 bg-transparent"
                    min="1"
                    placeholder="0"
                    type="number"
                    value="0"
                    onBlur={(e) => {
                      const newQuantity = parseInt(e.target.value) || 0;
                      if (newQuantity < 1) {
                        e.target.value = "0";
                      }
                    }}
                    onChange={(e) => {
                      const newQuantity = parseInt(e.target.value) || 0;
                      if (newQuantity > 0) {
                        onAddToOrder(product);
                        setTimeout(() => {
                          onUpdateQuantity(product.id, newQuantity);
                        }, 100);
                      }
                    }}
                  />
                )}

                {/* Plus button */}
                <button
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors text-base font-semibold min-w-[40px] h-10 flex items-center justify-center"
                  onClick={() => {
                    const existingProduct = selectedProducts.find(
                      (p) => p.product.id === product.id
                    );
                    if (existingProduct) {
                      onUpdateQuantity(product.id, existingProduct.quantity + 1);
                    } else {
                      onAddToOrder(product);
                    }
                  }}
                >
                  +
                </button>
              </div>

              {/* Right: WhatsApp Icon */}
              <button
                className="flex-shrink-0 bg-gray-100 text-gray-600 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors h-10 flex items-center justify-center"
                title={isEnglish ? "Inquire via WhatsApp" : "通过WhatsApp询价"}
                onClick={onCustomerService}
              >
                <WhatsAppIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = "ProductCard";

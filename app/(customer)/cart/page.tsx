"use client";

import { useOrder, type OrderCartItem } from "@/app/hooks/useOrder";
import { useState, useCallback } from "react";
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const { selectedProducts, updateQuantity, clearOrder } = useOrder();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [removingItem, setRemovingItem] = useState<null | string | number>(null);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert("Order placed successfully! Redirecting to order confirmation...");
    } catch {
      alert("Checkout failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const getCartTotal = useCallback(
    () =>
      selectedProducts.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0),
    [selectedProducts]
  );

  const getVariationLabel = (line: OrderCartItem) => line.product.Variation;
  const getOriginLabel = (line: OrderCartItem) =>
    line.product.Country_CH || line.product.Country;

  const resolveCartItemKey = (line: OrderCartItem) => String(line.product.id);

  const handleRemoveCartItem = async (line: OrderCartItem) => {
    const itemKey = resolveCartItemKey(line);
    setRemovingItem(itemKey);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      updateQuantity(line.product.id, 0);
    } finally {
      setRemovingItem(null);
    }
  };

  if (!selectedProducts.length) {
    return (
      <div className="container mx-auto p-4 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-600 mb-4">Your cart is empty</h1>
          <p className="text-gray-500 mb-6">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            href="/"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Shopping Cart</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            {selectedProducts.length} {selectedProducts.length === 1 ? "item" : "items"}
          </span>
          <button
            className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            onClick={clearOrder}
          >
            Clear Cart
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {selectedProducts.map(({ product, quantity }) => {
            const line: OrderCartItem = { product, quantity };
            const maxQuantity = product.stock_quantity ?? 999;

            return (
              <div
                key={resolveCartItemKey(line)}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex gap-4">
                    {product.image_url && (
                      <div className="flex-shrink-0">
                        <img
                          alt={product.Product}
                          className="w-24 h-24 object-cover rounded-lg"
                          height={96}
                          src={product.image_url}
                          width={96}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/product-placeholder.png";
                          }}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-800 mb-2">{product.Product}</h3>
                      {(getVariationLabel(line) || getOriginLabel(line)) && (
                        <div className="mb-3 space-y-1 text-sm text-gray-600">
                          {getVariationLabel(line) && (
                            <p>
                              Variation:{" "}
                              <span className="font-medium text-gray-800">
                                {getVariationLabel(line)}
                              </span>
                            </p>
                          )}
                          {getOriginLabel(line) && (
                            <p>
                              Origin:{" "}
                              <span className="font-medium text-gray-800">
                                {getOriginLabel(line)}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                      <div className="text-2xl font-bold text-blue-600 mb-4">
                        ${product.price.toFixed(2)}/{product.UOM}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 font-medium">Quantity:</span>
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={quantity <= 1}
                              onClick={() =>
                                updateQuantity(product.id, Math.max(0, quantity - 1))
                              }
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2 min-w-[3rem] text-center font-medium">
                              {quantity}
                            </span>
                            <button
                              className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={quantity >= maxQuantity}
                              onClick={() =>
                                updateQuantity(
                                  product.id,
                                  Math.min(maxQuantity, quantity + 1)
                                )
                              }
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-sm text-gray-500">Max: {maxQuantity}</span>
                        </div>

                        <button
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          disabled={removingItem === resolveCartItemKey(line)}
                          title="Remove item"
                          onClick={() => handleRemoveCartItem(line)}
                        >
                          {removingItem === resolveCartItemKey(line) ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Item Total:</span>
                      <span className="text-xl font-bold text-gray-800">
                        ${(product.price * quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-4">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="max-h-48 overflow-auto pr-1 space-y-2">
                {selectedProducts.map(({ product, quantity }) => {
                  const line: OrderCartItem = { product, quantity };
                  return (
                    <div
                      key={`summary-${resolveCartItemKey(line)}`}
                      className="text-sm text-gray-700"
                    >
                      <div className="flex justify-between gap-2">
                        <span className="truncate">{product.Product}</span>
                        <span>x{quantity}</span>
                      </div>
                      {(getVariationLabel(line) || getOriginLabel(line)) && (
                        <p className="text-xs text-gray-500 truncate">
                          {getVariationLabel(line) ? `Variation: ${getVariationLabel(line)}` : ""}
                          {getVariationLabel(line) && getOriginLabel(line) ? " | " : ""}
                          {getOriginLabel(line) ? `Origin: ${getOriginLabel(line)}` : ""}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-gray-600">
                <span>
                  Subtotal ({selectedProducts.length}{" "}
                  {selectedProducts.length === 1 ? "item" : "items"})
                </span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold text-gray-800">
                  <span>Total</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              disabled={isCheckingOut}
              onClick={handleCheckout}
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Proceed to Checkout"
              )}
            </button>

            <div className="mt-4 text-center">
              <Link className="text-blue-600 hover:text-blue-700 text-sm font-medium" href="/">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

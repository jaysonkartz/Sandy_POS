"use client";

import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [removingItem, setRemovingItem] = useState<number | null>(null);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      // Simulate checkout process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically:
      // 1. Validate cart items
      // 2. Send order to backend
      // 3. Process payment
      // 4. Clear cart on success
      
      alert("Order placed successfully! Redirecting to order confirmation...");
      // clearCart(); // Uncomment when implementing real checkout
    } catch (error) {
      alert("Checkout failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setRemovingItem(itemId);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      removeFromCart(itemId);
    } finally {
      setRemovingItem(null);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto p-4 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-600 mb-4">Your cart is empty</h1>
          <p className="text-gray-500 mb-6">Looks like you haven't added any items to your cart yet.</p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            {cart.length} {cart.length === 1 ? 'item' : 'items'}
          </span>
          <button
            onClick={clearCart}
            className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            Clear Cart
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex gap-4">
                  {/* Product Image */}
                  {item.imagesUrl && (
                    <div className="flex-shrink-0">
                      <img
                        alt={item.title}
                        className="w-24 h-24 object-cover rounded-lg"
                        src={item.imagesUrl}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/product-placeholder.png';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">{item.title}</h3>
                    <div className="text-2xl font-bold text-blue-600 mb-4">
                      ${item.price.toFixed(2)}/kg
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600 font-medium">Quantity:</span>
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-2 min-w-[3rem] text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => updateQuantity(item.id, Math.min(item.maxQuantity, item.quantity + 1))}
                            disabled={item.quantity >= item.maxQuantity}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="text-sm text-gray-500">
                          Max: {item.maxQuantity}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={removingItem === item.id}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove item"
                      >
                        {removingItem === item.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Item Total */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Item Total:</span>
                    <span className="text-xl font-bold text-gray-800">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-4">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
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
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Proceed to Checkout'
              )}
            </button>
            
            <div className="mt-4 text-center">
              <Link 
                href="/"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

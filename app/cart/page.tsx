'use client';

import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cart.map((item) => (
          <div key={item.id} className="bg-red-200 rounded-lg overflow-hidden">
            <div className="p-4">
              <h2 className="font-semibold text-lg">{item.title}</h2>
              
              {item.imagesUrl && (
                <div className="my-2">
                  <img 
                    src={item.imagesUrl} 
                    alt={item.title}
                    className="w-full h-48 object-cover rounded"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="text-right font-semibold">
                  ${item.price.toFixed(2)}/kg
                </div>

                <div className="flex justify-between items-center">
                  <span>Quantity:</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                      className="px-2 py-0.5 bg-white rounded"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, Math.min(item.maxQuantity, item.quantity + 1))}
                      className="px-2 py-0.5 bg-white rounded"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex justify-between font-semibold">
                  <span>Sub-Total:</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="flex-1 px-3 py-1 bg-blue-500 text-white rounded"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
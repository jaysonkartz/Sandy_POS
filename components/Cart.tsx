import { useCart } from '@/context/CartContext';
import Image from 'next/image';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h2 className="text-xl font-bold mb-4">Shopping Cart</h2>
      
      {cart.length === 0 ? (
        <p className="text-gray-500">Your cart is empty</p>
      ) : (
        <>
          {cart.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-4 border-b">
              <div className="relative h-20 w-20 flex-shrink-0">
                <Image
                  src={item.imagesUrl}
                  alt={item.title}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              
              <div className="flex-grow">
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-gray-600">${item.price.toFixed(2)}</p>
                
                <div className="flex items-center gap-2 mt-2">
                  <select
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                    className="border rounded p-1"
                  >
                    {[...Array(item.maxQuantity)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-4 text-right">
            <p className="text-lg font-bold">
              Total: ${getCartTotal().toFixed(2)}
            </p>
          </div>
        </>
      )}
    </div>
  );
} 
'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Product {
  id: number;
  title: string;
  slug: string;
  imagesUrl: string;
  price: number;
  heroImage: string;
  category: number;
  maxQuantity: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const supabase = createClientComponentClient();
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*');

        if (error) throw error;

        setProducts(data || []);
        const initialQuantities = (data || []).reduce((acc, product) => ({
          ...acc,
          [product.id]: 1
        }), {});
        setQuantities(initialQuantities);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const updateQuantity = (productId: number, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, Math.min(prev[productId] + delta, 
        products.find(p => p.id === productId)?.maxQuantity || 1))
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {products.map((product) => (
          <motion.div
            key={product.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow"
          >
            <h2 className="font-bold text-lg mb-2">{product.title}</h2>

            {product.imagesUrl && (
              <div className="relative mb-2 overflow-hidden rounded-lg">
                <Image
                  src={product.imagesUrl}
                  alt={product.title}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover transform hover:scale-105 transition-transform duration-300"
                />
                {product.maxQuantity <= 0 && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 text-sm">
                    Out of Stock
                  </div>
                )}
              </div>
            )}

            <div className="text-right font-bold text-lg mb-2 text-green-600">
              ${product.price.toFixed(2)}/kg
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Availability:</span>
                <span>{product.maxQuantity > 0 ? 'Yes' : 'No'}</span>
              </div>

              <div className="flex justify-between">
                <span>Lead Time:</span>
                <span>13 Days</span>
              </div>

              <div className="flex justify-between">
                <span>Origin:</span>
                <span>Shandong, China</span>
              </div>

              <div className="flex justify-between">
                <span>MOQ:</span>
                <span>9 kg/bag</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Quantity:</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => updateQuantity(product.id, -1)}
                    className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{quantities[product.id]}</span>
                  <button 
                    onClick={() => updateQuantity(product.id, 1)}
                    className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg">
                <span>Sub-Total:</span>
                <span>${(product.price * quantities[product.id]).toFixed(2)}</span>
              </div>

              <div className="flex gap-2 mt-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                >
                  Make Offer
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addToCart({ ...product, quantity: quantities[product.id] })}
                  className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                  disabled={product.maxQuantity <= 0}
                >
                  Add to Cart
                </motion.button>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm mt-2 transition-colors"
              >
                <span>Customer Service</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

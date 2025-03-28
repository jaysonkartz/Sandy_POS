"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Tag } from 'lucide-react';

interface Product {
  id: number;
  "Item Code": string;
  Product: string;
  Category: string;
  Weight: string;
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
}

const CATEGORIES = {
  'DRIED_CHILLI': 'Dried Chilli',
  'BEANS_LEGUMES': 'Beans & Legumes',
  'NUTS_SEEDS': 'Nuts & Seeds',
  'HERBS_SPICES': 'Herbs and Spices',
  'GRAINS': 'Grains',
  'DRIED_SEAFOOD': 'Dried Seafood',
  'VEGETABLES': 'Vegetables',
  'DRIED_MUSHROOM': 'Dried Mushroom & Fungus'
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const supabase = createClientComponentClient();
  const { addToCart } = useCart();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        let query = supabase.from('products').select('*');
        
        if (selectedCategory !== 'all') {
          const categoryValue = CATEGORIES[selectedCategory as keyof typeof CATEGORIES];
          // Add these debug logs
          console.log('All unique categories in data:', 
            [...new Set(products.map(p => p.Category))]
          );
          console.log('Attempting to filter by:', categoryValue);
          query = query.eq('Category', categoryValue);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        // Log for debugging
        console.log('Fetched products:', data);
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [supabase, selectedCategory]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleCustomerService = () => {
    const phoneNumber = '6592341145'; 
    const message = 'Hi, I would like to inquire about your products.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
      {/* Category Filter */}
      <div className="mb-6">
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORIES).map(([key, value]) => (
            <option key={key} value={key}>{value}</option>
          ))}
        </select>
      </div>

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
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-bold text-lg">{product.Product}</h2>
              <span className="text-sm text-gray-500">{product["Item Code"]}</span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Category:</span>
                <span>{product.Category}</span>
              </div>

              <div className="flex justify-between">
                <span>Weight:</span>
                <span>{product.Weight}</span>
              </div>

              <div className="flex justify-between">
                <span>Origin:</span>
                <span>{product.Country}</span>
              </div>

              {product.Variation && (
                <div className="flex justify-between">
                  <span>Variation:</span>
                  <span>{product.Variation}</span>
                </div>
              )}

              <div className="text-right font-bold text-lg mb-2 text-green-600">
                ${product.price.toFixed(2)}/{product.uom}
              </div>

              {session ? (
                <div className="flex gap-2 mt-4">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-1 px-3 py-2 ${
                      product.stock_quantity === 0 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white rounded-lg text-sm transition-colors`}
                    disabled={product.stock_quantity === 0}
                  >
                    Make Offer
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart({
                      id: product.id,
                      title: product.Product,
                      price: product.price,
                      quantity: 1,
                      maxQuantity: product.stock_quantity,
                      imagesUrl: []
                    })}
                    className={`flex-1 px-3 py-2 ${
                      product.stock_quantity === 0 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    } text-white rounded-lg text-sm transition-colors`}
                    disabled={product.stock_quantity === 0}
                  >
                    Add to Cart
                  </motion.button>
                </div>
              ) : (
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                >
                  Login to Purchase
                </button>
              )}

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCustomerService}
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

'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { ChevronDown, ChevronUp, Minus, Plus, MessageCircle, Tag } from 'lucide-react';

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

interface Category {
  id: number;
  title: string;
  imageUrl: string;
}

// Category color mapping
const categoryColors = {
  1: { color: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  2: { color: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700' },
  3: { color: 'border-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  4: { color: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  5: { color: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
  6: { color: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
  7: { color: 'border-pink-500', bg: 'bg-pink-50', text: 'text-pink-700' },
  8: { color: 'border-teal-500', bg: 'bg-teal-50', text: 'text-teal-700' },
};

const origins = [
  'Shandong, China',
  'Guangdong, China',
  'Fujian, China',
  'Vietnam',
  'Thailand',
  'Indonesia'
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [selectedOrigins, setSelectedOrigins] = useState<{ [key: number]: string }>({});
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: number]: boolean }>({});
  const supabase = createClientComponentClient();
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchData() {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) {
        console.error('Error fetching products:', productsError);
        return;
      }

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return;
      }

      const initialQuantities = Object.fromEntries(
        (productsData || []).map(product => [product.id, 1])
      );
      const initialOrigins = Object.fromEntries(
        (productsData || []).map(product => [product.id, origins[0]])
      );
      const initialDropdowns = Object.fromEntries(
        (productsData || []).map(product => [product.id, false])
      );

      setQuantities(initialQuantities);
      setSelectedOrigins(initialOrigins);
      setOpenDropdowns(initialDropdowns);
      setProducts(productsData || []);
      setCategories(categoriesData || []);
    }

    fetchData();
  }, []);

  const handleQuantityChange = (productId: number, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, Math.min(prev[productId] + change, 99))
    }));
  };

  const toggleDropdown = (productId: number) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const selectOrigin = (productId: number, origin: string) => {
    setSelectedOrigins(prev => ({
      ...prev,
      [productId]: origin
    }));
    toggleDropdown(productId);
  };

  const getCategoryTitle = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.title : 'Unknown Category';
  };

  const updateQuantity = (productId: number, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, Math.min(prev[productId] + change, 99))
    }));
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div 
            key={product.id} 
            className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col border-l-4 relative"
            style={{
              borderLeftColor: categoryColors[product.category as keyof typeof categoryColors]?.color?.replace('border-', '') || '#e5e7eb'
            }}
          >
            {/* Product Image */}
            <div className="relative aspect-square">
              <img 
                src="/Chilli-test-img.jpg"
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-white/90 text-gray-900 px-3 py-1 text-sm font-medium rounded-full shadow-sm">
                ${product.price.toFixed(2)}/kg
              </div>
              <div className={`absolute bottom-2 left-2 px-3 py-1 text-sm rounded-full flex items-center gap-1.5 bg-white/90 ${categoryColors[product.category as keyof typeof categoryColors]?.text || 'text-gray-700'}`}>
                <Tag size={14} />
                <span>{getCategoryTitle(product.category)}</span>
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {/* Product Title */}
              <div>
                <h2 className="font-medium text-gray-900 text-lg line-clamp-2">{product.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm ${product.maxQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.maxQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">13 Days Lead Time</span>
                </div>
              </div>

              {/* Origin Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown(product.id)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-gray-600">Origin:</span>
                    <span className="text-gray-900">{selectedOrigins[product.id] || 'Select origin'}</span>
                  </span>
                  {openDropdowns[product.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {openDropdowns[product.id] && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10">
                    {origins.map((origin) => (
                      <button
                        key={origin}
                        onClick={() => selectOrigin(product.id, origin)}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm first:rounded-t-lg last:rounded-b-lg"
                      >
                        {origin}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity and Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(product.id, -1)}
                      className="p-1 rounded-md hover:bg-gray-100"
                      disabled={quantities[product.id] <= 0}
                    >
                      <Minus size={16} className="text-gray-600" />
                    </button>
                    <span className="w-8 text-center text-sm">{quantities[product.id] || 0}</span>
                    <button
                      onClick={() => updateQuantity(product.id, 1)}
                      className="p-1 rounded-md hover:bg-gray-100"
                      disabled={quantities[product.id] >= product.maxQuantity}
                    >
                      <Plus size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors">
                    Make Offer
                  </button>
                  <button 
                    onClick={() => addToCart(product, quantities[product.id] || 1)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>

                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
                  <MessageCircle size={16} />
                  <span>Customer Service</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

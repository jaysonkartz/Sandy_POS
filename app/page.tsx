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

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <div 
            key={product.id} 
            className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border-l-4 ${categoryColors[product.category as keyof typeof categoryColors]?.color || 'border-gray-500'}`}
          >
            {/* Product Image */}
            {product.imagesUrl && (
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={product.imagesUrl} 
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-2 py-1 text-sm rounded-bl">
                  ${product.price.toFixed(2)}/kg
                </div>
                <div className={`absolute bottom-0 left-0 px-2 py-1 text-sm rounded-tr flex items-center gap-1 ${categoryColors[product.category as keyof typeof categoryColors]?.bg || 'bg-gray-50'} ${categoryColors[product.category as keyof typeof categoryColors]?.text || 'text-gray-700'}`}>
                  <Tag size={14} />
                  <span>{getCategoryTitle(product.category)}</span>
                </div>
              </div>
            )}

            <div className="p-4">
              {/* Product Title */}
              <h2 className="font-semibold text-lg mb-2 truncate">{product.title}</h2>

              {/* Product Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Availability:</span>
                  <span className={product.maxQuantity > 0 ? 'text-green-500' : 'text-red-500'}>
                    {product.maxQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Lead Time:</span>
                  <span>13 Days</span>
                </div>

                {/* Origin Dropdown */}
                <div className="relative">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Origin:</span>
                    <button
                      onClick={() => toggleDropdown(product.id)}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded hover:bg-gray-100"
                    >
                      {selectedOrigins[product.id]}
                      {openDropdowns[product.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                  {openDropdowns[product.id] && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border rounded-md shadow-lg z-10">
                      {origins.map((origin) => (
                        <button
                          key={origin}
                          onClick={() => selectOrigin(product.id, origin)}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                        >
                          {origin}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">MOQ:</span>
                  <span>9 kg/bag</span>
                </div>

                {/* Quantity Selector */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Quantity:</span>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                    <button
                      onClick={() => handleQuantityChange(product.id, -1)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      value={quantities[product.id]}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          setQuantities(prev => ({
                            ...prev,
                            [product.id]: Math.max(1, Math.min(value, 99))
                          }));
                        }
                      }}
                      className="w-12 text-center bg-transparent"
                      min="1"
                      max="99"
                    />
                    <button
                      onClick={() => handleQuantityChange(product.id, 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Sub-Total */}
                <div className="flex justify-between items-center font-semibold">
                  <span>Sub-Total:</span>
                  <span>${(product.price * quantities[product.id]).toFixed(2)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm">
                    Make Offer
                  </button>
                  <button 
                    onClick={() => addToCart({ ...product, quantity: quantities[product.id] })}
                    className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                  >
                    Add to Cart
                  </button>
                </div>

                {/* Customer Service Button */}
                <button className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors">
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

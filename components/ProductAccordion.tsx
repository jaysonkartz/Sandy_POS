'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

interface ProductAccordionProps {
  categories: Category[];
}

export default function ProductAccordion({ categories }: ProductAccordionProps) {
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    // Simulate API call - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button 
          onClick={handleRefreshPrices}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          <svg 
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          {isRefreshing ? 'Refreshing...' : 'Refresh Prices'}
        </button>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="border rounded-lg overflow-hidden">
            <button
              className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={() => toggleCategory(category.id)}
            >
              <h2 className="text-xl font-semibold">{category.name}</h2>
              <span className="text-2xl">
                {openCategories.includes(category.id) ? '−' : '+'}
              </span>
            </button>
            
            {openCategories.includes(category.id) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {category.products.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <div className="relative w-full h-48 mb-4">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-gray-600 mb-2">${product.price.toFixed(2)}</p>
                    {product.description && (
                      <p className="text-sm text-gray-500 mb-4">{product.description}</p>
                    )}
                    <button className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 
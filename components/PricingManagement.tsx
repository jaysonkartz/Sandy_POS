'use client';

import { useState } from 'react';

interface Product {
  code: string;
  name: string;
  currentPrice: number;
  description: string;
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

// Sample data - replace with your actual data
const categories: Category[] = [
  {
    id: 'cat1',
    name: 'Food',
    products: [
      { code: 'F001', name: 'Burger', currentPrice: 9.99, description: 'Classic beef burger' },
      { code: 'F002', name: 'Pizza', currentPrice: 12.99, description: 'Margherita pizza' },
    ]
  },
  {
    id: 'cat2',
    name: 'Beverages',
    products: [
      { code: 'B001', name: 'Soda', currentPrice: 2.99, description: 'Carbonated drink' },
      { code: 'B002', name: 'Coffee', currentPrice: 3.99, description: 'Fresh brewed coffee' },
    ]
  }
];

export default function PricingManagement() {
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Pricing Management</h2>
      
      {/* Table Headers */}
      <div className="bg-gray-50 p-4 rounded-t-lg font-semibold grid grid-cols-5 gap-4">
        <div>Item Name (Code)</div>
        <div>Current Price</div>
        <div className="text-center">Customers</div>
        <div className="text-center">Price Override</div>
        <div className="text-center">Edit Description</div>
      </div>

      {/* Categories Accordion */}
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex justify-between items-center p-4 bg-white hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold">{category.name}</span>
              <span className="text-xl">{openCategories.includes(category.id) ? '−' : '+'}</span>
            </button>

            {openCategories.includes(category.id) && (
              <div className="border-t">
                {category.products.map((product) => (
                  <div 
                    key={product.code}
                    className="grid grid-cols-5 gap-4 p-4 items-center hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.code}</div>
                    </div>
                    <div className="font-medium">
                      ${product.currentPrice.toFixed(2)}
                    </div>
                    <div className="text-center">
                      <button className="p-2 hover:bg-gray-100 rounded-full" title="View Customers">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-center">
                      <button className="p-2 hover:bg-gray-100 rounded-full" title="Override Price">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-center">
                      <button className="p-2 hover:bg-gray-100 rounded-full" title="Edit Description">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
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
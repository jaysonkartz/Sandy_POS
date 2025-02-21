'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';

interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  category: number;
  maxQuantity: number;
  imagesUrl: string;
  heroImage: string;
}

interface Category {
  id: number;
  name: string;
  imageUrl: string;
  products: Product[];
}

export default function PricingManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchData() {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return;
      }

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) {
        console.error('Error fetching products:', productsError);
        return;
      }

      const categoriesWithProducts = categoriesData.map(category => ({
        ...category,
        products: productsData.filter(product => product.category === category.id)
      }));

      setCategories(categoriesWithProducts);
      console.log(categories)
    }

    fetchData();
  }, []);

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
        <div>Item Name</div>
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
              onClick={() => toggleCategory(category.id.toString())}
              className="w-full flex justify-between items-center p-4 bg-white hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold">{category.name}</span>
              <span className="font-semibold">{category.name}</span>
              <span className="text-xl">{openCategories.includes(category.id.toString()) ? '−' : '+'}</span>
            </button>

            {openCategories.includes(category.id.toString()) && (
              <div className="border-t">
                {category.products.map((product) => (
                  <div 
                    key={product.id}
                    className="grid grid-cols-5 gap-4 p-4 items-center hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <div className="font-medium">{product.title}</div>
                      <div className="text-sm text-gray-500">{product.slug}</div>
                    </div>
                    <div className="font-medium">
                      ${product.price.toFixed(2)}
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
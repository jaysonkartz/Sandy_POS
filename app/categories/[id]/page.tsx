'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

interface Product {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
}

interface Category {
  id: number;
  name: string;
  imageUrl: string;
}

export default function CategoryPage({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch category
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', params.id)
          .single();

        if (categoryError) throw categoryError;
        setCategory(categoryData);

        // Fetch products for this category
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', params.id);

        if (productsError) throw productsError;
        setProducts(productsData || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {category && (
        <div className="mb-8">
          <button 
            onClick={() => router.back()} 
            className="mb-4 text-blue-500 hover:text-blue-700"
          >
            ← Back to Categories
          </button>
          <div className="relative w-[100px] h-[200px] rounded-lg overflow-hidden mb-4">
            <img
              src={category.imageUrl}
              alt={category.name}
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold mb-4">{category.name}</h1>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative w-full h-[150px]">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h2 className="font-bold">{product.title}</h2>
              <p className="text-gray-600">${product.price}</p>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No products found in this category</p>
        </div>
      )}
    </div>
  );
} 
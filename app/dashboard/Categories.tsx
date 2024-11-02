'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import ProductModal from '@/app/components/ProductModal';

interface Category {
  id: number;
  title: string;
  imageUrl: string;
}

export default function Categories() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleViewProducts(categoryId: number) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      localStorage.setItem('intendedCategory', categoryId.toString());
      router.push('/login');
      return;
    }

    setSelectedCategoryId(categoryId);
    setIsModalOpen(true);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Categories</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div 
            key={category.id} 
            className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="relative w-full h-48">
              <img
                src={category.imageUrl}
                alt={category.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{category.title}</h2>
              <button 
                onClick={() => handleViewProducts(category.id)}
                className="text-blue-500 hover:text-blue-700"
              >
                View Products →
              </button>
            </div>
          </div>
        ))}
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCategoryId(null);
        }}
        categoryId={selectedCategoryId!}
      />
    </div>
  );
} 
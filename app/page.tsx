'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import ProductAccordion from '@/components/ProductAccordion';
import Cart from '@/components/Cart';

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
  name: string;
  name_ch: string;
  imageUrl: string;
  products?: Product[];
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchData() {
      // First, let's check what products we have for category 2
      const { data: categoryTwoProducts, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('category', 2);

      console.log('Products in category 2:', categoryTwoProducts);
      
      if (productError) {
        console.error('Error fetching category 2 products:', productError);
      }

      // Fetch all categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return;
      }
      console.log('Categories Data:', categoriesData);

      // Fetch all products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) {
        console.error('Error fetching products:', productsError);
        return;
      }
      console.log('All Products Data:', productsData);

      // Debug the filtering process
      const categoriesWithProducts = categoriesData.map(category => {
        const categoryProducts = productsData.filter(product => {
          console.log(`Comparing product category ${product.category} with category id ${category.id}`);
          return Number(product.category) === Number(category.id);
        });
        
        console.log(`Category ${category.id} (${category.name}) has ${categoryProducts.length} products:`, categoryProducts);
        
        return {
          ...category,
          products: categoryProducts
        };
      });

      setCategories(categoriesWithProducts);
    }

    fetchData();
  }, []);

  // If we have data, let's see what it looks like
  if (categories.length > 0) {
    console.log('Category 2 data:', categories.find(c => c.id === 2));
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <ProductAccordion categories={categories} />
        </div>
        <div className="lg:col-span-1">
          <Cart />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

interface CategoryProps {
  name: string;
  categoryId: number;
  products: Product[];
}

export default function ProductCategory({ name, categoryId, products: initialProducts }: CategoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  console.log("categoryId", categoryId);
  console.log("name", name);
  console.log("products", products);

  useEffect(() => {
    async function fetchProducts() {
      if (!categoryId) {
        console.log('Category ID is undefined');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', categoryId);

        if (error) {
          console.error('Error fetching products:', error);
          return;
        }

        console.log('Fetched products:', data);
        setProducts(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [categoryId, name, supabase]);

  if (loading) {
    return (
      <div className="border rounded-lg mb-4">
        <div className="p-4 bg-gray-50">
          <h2 className="text-xl font-semibold">{name}</h2>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="border rounded-lg mb-4">
        <div className="p-4 bg-gray-50">
          <h2 className="text-xl font-semibold">{name}</h2>
          <p>No products available in this category</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg mb-4">
      <div
        className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-xl font-semibold">{name}</h2>
        <span>{isOpen ? "-" : "+"}</span>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
          {products.map((product) => (
            <div key={product.id} className="border rounded-lg p-4 text-center">
              <div className="relative w-full h-40 mb-2">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-gray-600">${product.price.toFixed(2)}</p>
              <button
                onClick={() => addToCart(product)}
                className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                {isEnglish ? 'Add to Order' : '添加到订单'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabaseClient";

interface Product {
  id: number;
  title: string;
  price: number;
  heroImage?: string;
  imagesUrl: string;
  maxQuantity: number;
  category: number;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: number;
}

export default function ProductModal({ isOpen, onClose, categoryId }: ProductModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      setError(null);

      if (!categoryId) return;

      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("category", categoryId);

        if (error) throw error;

        if (data) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch products");
      } finally {
        setIsLoading(false);
      }
    }

    if (isOpen) {
      fetchProducts();
    }
  }, [categoryId, isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="mx-auto max-w-3xl rounded bg-white p-6 w-full">
          <h2 className="text-xl font-bold mb-4">Products</h2>

          {isLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <img
                    alt={product.title}
                    className="w-full h-48 object-cover rounded mb-2"
                    src={product.heroImage || product.imagesUrl}
                  />
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="text-gray-600">${product.price}</p>
                  <p className="text-sm text-gray-500">Max Quantity: {product.maxQuantity}</p>
                </div>
              ))}
              {products.length === 0 && (
                <div className="col-span-2 text-center text-gray-500">
                  No products found in this category
                </div>
              )}
            </div>
          )}

          <button
            className="mt-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

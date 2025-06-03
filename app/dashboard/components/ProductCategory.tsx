"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface Product {
  id: number;
  title: string;
  price: number;
  imagesUrl: string;
  slug: string;
  category: number;
  maxQuant: number;
}

interface CategoryProps {
  name: string;
  categoryId: number;
  products: Product[];
}

export default function ProductCategory({
  name,
  categoryId,
  products: initialProducts,
}: CategoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!isOpen) return;

    async function fetchProducts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("category", categoryId);

        if (error) return;
        setProducts(data || []);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [categoryId, name, supabase, isOpen]);

  return (
    <div className="border rounded-lg mb-4">
      <div
        className="p-4 bg-gray-50 cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-xl font-semibold">{name}</h2>
        <span>{isOpen ? "▼" : "▶"}</span>
      </div>

      {isOpen && (
        <div className="p-4">
          {loading ? (
            <p>Loading products...</p>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border p-4 rounded">
                  <h3 className="font-semibold">{product.title}</h3>
                  <p>${product.price}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No products in this category</p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

interface Product {
  id: number;
  title: string;
  price: number;
  heroImage?: string;
  imagesUrl: string;
  maxQuantity: number;
  category: number;
}

export default function ProductsPage({ params }: { params: { categoryId: string } }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthAndFetchProducts = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      localStorage.setItem("intendedCategory", params.categoryId);
      router.push("/login");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", params.categoryId);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [params.categoryId, router]);

  useEffect(() => {
    checkAuthAndFetchProducts();
  }, [checkAuthAndFetchProducts]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <button
          className="text-blue-500 hover:text-blue-700"
          onClick={() => router.push("/dashboard")}
        >
          ← Back to Categories
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4">
            <img
              alt={product.title}
              className="w-full h-48 object-cover rounded mb-2"
              src={product.heroImage || product.imagesUrl}
            />
            <h3 className="font-semibold">{product.title}</h3>
            <p className="text-gray-600">S${product.price}</p>
            <p className="text-sm text-gray-500">Max Quantity: {product.maxQuantity}</p>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center text-gray-500">
            No products found in this category
          </div>
        )}
      </div>
    </div>
  );
}

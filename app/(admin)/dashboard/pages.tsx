"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

interface Product {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
}

interface Category {
  name: string;
  imageUrl: string;
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      }
    }

    async function fetchData() {
      try {
        // Replace this with your actual data fetching logic
        const { data, error } = await supabase.from("categories").select("*").single();

        if (error) throw error;

        setCategory(data);

        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*");

        if (productsError) throw productsError;

        setProducts(productsData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
    fetchData();
  }, [router]);

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
        <>
          <div className="relative w-full h-[200px] rounded-lg overflow-hidden mb-4">
            <Image fill alt={category.name} className="object-cover" src={category.imageUrl} />
          </div>
          <h1 className="text-2xl font-bold mb-4">{category.name}</h1>
        </>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg overflow-hidden">
            <div className="relative w-full h-[150px]">
              <Image fill alt={product.title} className="object-cover" src={product.imageUrl} />
            </div>
            <div className="p-4">
              <h2 className="font-bold">{product.title}</h2>
              <p className="text-gray-600">${product.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

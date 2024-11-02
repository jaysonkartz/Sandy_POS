'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

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
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/');
      }
    });

    fetchProducts();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProducts() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        localStorage.setItem('intendedCategory', params.categoryId);
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', params.categoryId);

      if (error) throw error;
      setProducts(data || []);
      
      // Initialize quantities state
      const initialQuantities = (data || []).reduce((acc, product) => ({
        ...acc,
        [product.id]: 0
      }), {});
      setQuantities(initialQuantities);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }

  const handleQuantityChange = (productId: number, newQuantity: number, maxQuantity: number) => {
    // Ensure quantity is within bounds
    const validQuantity = Math.max(0, Math.min(newQuantity, maxQuantity));
    setQuantities(prev => ({
      ...prev,
      [productId]: validQuantity
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <button
          onClick={() => router.push('/')}
          className="text-blue-500 hover:text-blue-700"
        >
          ← Back to Categories
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4">
            <img 
              src={product.heroImage || product.imagesUrl} 
              alt={product.title} 
              className="w-full h-48 object-cover rounded mb-2" 
            />
            <h3 className="font-semibold">{product.title}</h3>
            <p className="text-gray-600">S${product.price.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Max Quantity: {product.maxQuantity}</p>
            
            <div className="mt-4 flex items-center space-x-2">
              <button 
                onClick={() => handleQuantityChange(product.id, quantities[product.id] - 1, product.maxQuantity)}
                className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                disabled={quantities[product.id] <= 0}
              >
                -
              </button>
              
              <input
                type="number"
                value={quantities[product.id]}
                onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0, product.maxQuantity)}
                min="0"
                max={product.maxQuantity}
                className="w-16 text-center border rounded px-2 py-1"
              />
              
              <button 
                onClick={() => handleQuantityChange(product.id, quantities[product.id] + 1, product.maxQuantity)}
                className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                disabled={quantities[product.id] >= product.maxQuantity}
              >
                +
              </button>
            </div>

            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Total: S${(product.price * quantities[product.id]).toFixed(2)}
              </p>
            </div>

            <button
              onClick={() => {/* Add to cart logic here */}}
              disabled={quantities[product.id] === 0}
              className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 
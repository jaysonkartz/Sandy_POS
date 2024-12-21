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
          <div key={product.id} className="bg-red-200 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold text-lg">{product.title}</h3>
            {product.heroImage && (
              <div className="my-2">
                <img 
                  src={product.heroImage} 
                  alt={product.title}
                  className="w-full h-48 object-cover rounded"
                />
              </div>
            )}
            
            <div className="space-y-1.5">
              <div className="text-right font-semibold">
                S${product.price.toFixed(2)}/kg
              </div>
              
              <div className="flex justify-between">
                <span>Availability:</span>
                <span>{product.maxQuantity > 0 ? 'Yes' : 'No'}</span>
              </div>

              <div className="flex justify-between">
                <span>Lead Time:</span>
                <span>13 Days</span>
              </div>

              <div className="flex justify-between">
                <span>Origin:</span>
                <span>Shandong, China</span>
              </div>

              <div className="flex justify-between">
                <span>MOQ:</span>
                <span>9 kg/bag</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Quantity:</span>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleQuantityChange(product.id, quantities[product.id] - 1, product.maxQuantity)}
                    className="px-2 py-0.5 bg-white rounded"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{quantities[product.id]}</span>
                  <button 
                    onClick={() => handleQuantityChange(product.id, quantities[product.id] + 1, product.maxQuantity)}
                    className="px-2 py-0.5 bg-white rounded"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex justify-between">
                <span>Sub-Total:</span>
                <span>{(product.price * quantities[product.id]).toFixed(2)}</span>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-1 bg-green-500 text-white rounded text-sm">
                  Make Offer
                </button>
                <button className="flex-1 px-3 py-1 bg-blue-500 text-white rounded text-sm">
                  Add to Cart
                </button>
              </div>

              <button className="w-full flex items-center justify-center space-x-2 px-3 py-1 bg-green-600 text-white rounded text-sm">
                <span>Customer Service</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
              </button>

              <div className="mt-2">
                <h4 className="font-semibold">Description</h4>
                <p className="text-sm">
                  It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
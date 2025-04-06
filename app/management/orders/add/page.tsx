"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Product {
  id: number;
  price: number;
  "Item Code": string;
  Product: string;
  Product_CH: string;
  Weight: string;
  UOM: string;
  Category: number;
}

interface OrderItem {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export default function AddOrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isEnglish, setIsEnglish] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = new URLSearchParams(window.location.search);
  const productParam = searchParams.get('product');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Handle pre-selected product from URL
    if (productParam) {
      try {
        const product = JSON.parse(decodeURIComponent(productParam));
        if (product && product.id) {
          addProductToOrder(product.id, product.price);
        }
      } catch (error) {
        console.error('Error parsing product from URL:', error);
      }
    }
  }, [productParam]);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('Product');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.Product.toLowerCase().includes(searchLower) ||
      product.Product_CH.includes(searchTerm) ||
      product["Item Code"].toLowerCase().includes(searchLower)
    );
  });

  const addProductToOrder = (productId: number, price: number) => {
    setSelectedProducts(prev => {
      const existing = prev.find(item => item.product_id === productId);
      if (existing) {
        return prev.map(item =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product_id: productId, quantity: 1, unit_price: price }];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) {
      setSelectedProducts(prev => prev.filter(item => item.product_id !== productId));
    } else {
      setSelectedProducts(prev =>
        prev.map(item =>
          item.product_id === productId
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => {
      return total + (item.quantity * item.unit_price);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      alert('Please add at least one product to the order');
      return;
    }

    try {
      // First create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            customer_name: customerName,
            customer_phone: customerPhone,
            total_amount: calculateTotal(),
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Then create the order items
      const orderItems = selectedProducts.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      router.push('/management/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{isEnglish ? 'Add New Order' : '新增订单'}</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEnglish(true)}
            className={`px-3 py-2 rounded-md transition-colors ${
              isEnglish 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            English
          </button>
          <button 
            onClick={() => setIsEnglish(false)}
            className={`px-3 py-2 rounded-md transition-colors ${
              !isEnglish 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            中文
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {isEnglish ? 'Customer Name' : '客户姓名'}
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {isEnglish ? 'Phone Number' : '电话号码'}
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder={isEnglish ? "Search products..." : "搜索产品..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const orderItem = selectedProducts.find(item => item.product_id === product.id);
              
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">
                      {isEnglish ? product.Product : product.Product_CH}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {product["Item Code"]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {product.Weight} {product.UOM}
                  </div>
                  <div className="text-lg font-bold text-green-600 mb-2">
                    ${product.price.toFixed(2)}
                  </div>
                  {orderItem ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, orderItem.quantity - 1)}
                        className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center">{orderItem.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, orderItem.quantity + 1)}
                        className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addProductToOrder(product.id, product.price)}
                      className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      {isEnglish ? 'Add to Order' : '添加到订单'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {selectedProducts.length > 0 && (
          <div className="mt-6 border-t pt-6">
            <h2 className="text-lg font-medium mb-4">
              {isEnglish ? 'Order Summary' : '订单摘要'}
            </h2>
            <div className="space-y-2">
              {selectedProducts.map((item) => {
                const product = products.find(p => p.id === item.product_id);
                return (
                  <div key={item.product_id} className="flex justify-between items-center">
                    <span>
                      {isEnglish ? product?.Product : product?.Product_CH} x {item.quantity}
                    </span>
                    <span>${(item.quantity * item.unit_price).toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="border-t pt-2 font-bold">
                <div className="flex justify-between items-center">
                  <span>{isEnglish ? 'Total' : '总计'}</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            {isEnglish ? 'Cancel' : '取消'}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            disabled={selectedProducts.length === 0}
          >
            {isEnglish ? 'Create Order' : '创建订单'}
          </button>
        </div>
      </form>
    </div>
  );
} 
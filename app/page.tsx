"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useCart } from './contexts/CartContext';
import type { CartItem, Product } from './contexts/CartContext';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { Tag, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

interface Category {
  id: number;
  code: string;
  name: string;
  name_ch?: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEnglish, setIsEnglish] = useState(true);
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<{ product: Product; quantity: number }[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [expandedCountries, setExpandedCountries] = useState<string[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<number[]>([]);
  const supabase = createClientComponentClient();
  const { addToCart, cartItems, updateQuantity } = useCart();
  const [session, setSession] = useState<any>(null);
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch categories first
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Then fetch products
        let query = supabase.from('products').select('*');
        
        if (selectedCategory !== 'all') {
          query = query.eq('Category', parseInt(selectedCategory));
        }

        const { data: productsData, error: productsError } = await query;
        if (productsError) throw productsError;
        
        setProducts(productsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase, selectedCategory]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Get category name by id
  const getCategoryName = (categoryNumber: number) => {
    const category = categories.find(cat => cat.id === categoryNumber);
    return category ? category.name : 'Unknown Category';
  };

  // Get category Chinese name
  const getCategoryChineseName = (categoryNumber: number) => {
    const category = categories.find(cat => cat.id === categoryNumber);
    return category?.name_ch || '';
  };

  //Send Whatsapp enquiry
  const handleCustomerService = () => {
    const phoneNumber = '6587520417'; 
    const message = 'Hi, I would like to inquire about your products.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  //Add to order
  const handleAddToOrder = (product: Product) => {
    const existingProduct = selectedProducts.find(item => item.product.id === product.id);
    if (existingProduct) {
      setSelectedProducts(prev => 
        prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedProducts(prev => [...prev, { product, quantity: 1 }]);
    }
  };

  //Update quantity
  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      setSelectedProducts(prev => prev.filter(item => item.product.id !== productId));
    } else {
      setSelectedProducts(prev =>
        prev.map(item =>
          item.product.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  //Send Whatsapp notification after submit order
  const sendWhatsAppNotification = (orderDetails: {
    orderId: number;
    customerName: string;
    totalAmount: number;
    items: Array<{
      productName: string;
      quantity: number;
      price: number;
    }>;
  }) => {
    // Format the message
    const message = `
🛍️ New Order Notification
Order ID: ${orderDetails.orderId}
Customer: ${orderDetails.customerName}
Total Amount: $${orderDetails.totalAmount.toFixed(2)}

Order Items:
${orderDetails.items.map(item => 
  `- ${item.productName} x ${item.quantity} @ $${item.price.toFixed(2)}`
).join('\n')}

Please check the admin panel for more details.
    `.trim();

    // Create WhatsApp URL (using your business phone number)
    const phoneNumber = '6587520417'; // Replace with your business phone number
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in a new window
    window.open(whatsappUrl, '_blank');
  };

  const handleSubmitOrder = async () => {
    // Check if user is authenticated
    if (!user) {
      alert(isEnglish ? 'Please log in to submit an order' : '请登录以提交订单');
      return;
    }

    if (selectedProducts.length === 0) {
      alert(isEnglish ? 'Please add at least one product to the order' : '请至少添加一个产品到订单');
      return;
    }

    if (!customerName || !customerPhone) {
      alert(isEnglish ? 'Please provide customer name and phone number' : '请提供客户姓名和电话号码');
      return;
    }

    try {
      // Calculate total amount
      const totalAmount = selectedProducts.reduce(
        (sum, item) => sum + (item.product.price * item.quantity),
        0
      );

      // Create order with user_id
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            status: 'pending',
            total_amount: totalAmount,
            created_at: new Date().toISOString(),
            user_id: user.id,
            customer_name: customerName,
            customer_phone: customerPhone
          }
        ])
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      // Create order items
      const orderItems = selectedProducts.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        total_price: item.product.price * item.quantity,
        product_name: isEnglish ? item.product.Product : item.product.Product_CH,
        product_code: item.product["Item Code"] || 'N/A',
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        throw itemsError;
      }

      // Send WhatsApp notification
      sendWhatsAppNotification({
        orderId: order.id,
        customerName,
        totalAmount,
        items: selectedProducts.map(item => ({
          productName: isEnglish ? item.product.Product : item.product.Product_CH,
          quantity: item.quantity,
          price: item.product.price
        }))
      });

      // Reset form and close panel
      setSelectedProducts([]);
      setCustomerName('');
      setCustomerPhone('');
      setIsOrderPanelOpen(false);

      // Show success message
      alert(isEnglish ? 'Order submitted successfully!' : '订单提交成功！');
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(isEnglish ? 'Error submitting order. Please try again.' : '提交订单时出错，请重试。');
    }
  };

  const toggleCountryExpansion = (country: string) => {
    setExpandedCountries(prev => 
      prev.includes(country) 
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  const toggleProductExpansion = (productId: number) => {
    setExpandedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Get unique countries and sort them
  const uniqueCountries = Array.from(new Set(products.map(p => p.Country))).sort();

  return (
    <div className="container mx-auto p-4">
      {/* Category Filter */}
      <div className="mb-6 flex items-center gap-4">
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {isEnglish ? category.name : category.name_ch}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEnglish(true)}
            className={`px-3 py-2 rounded-md flex items-center transition-colors ${
              isEnglish 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span>English</span>
          </button>
          <button 
            onClick={() => setIsEnglish(false)}
            className={`px-3 py-2 rounded-md flex items-center transition-colors ${
              !isEnglish 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span>中文</span>
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => {
          const cartItem = cartItems.find((item: CartItem) => item.product_id === product.id);
          
          return (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Product Image */}
              <div className="relative h-48 bg-gray-200">
                <Image
                  src="/product-placeholder.png"
                  alt={product.Product}
                  layout="fill"
                  objectFit="cover"
                  className="hover:opacity-75 transition-opacity"
                />
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isEnglish ? product.Product : product.Product_CH}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {product["Item Code"]}
                  </p>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600">
                    <span>{isEnglish ? 'Category: ' : '类别：'}</span>
                    <span>{isEnglish ? getCategoryName(product.Category) : getCategoryChineseName(product.Category)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span>{isEnglish ? 'Weight: ' : '重量：'}</span>
                    <span>{product.Weight} {product.UOM}</span>
                  </div>
                  {product.Variation && (
                    <div className="text-sm text-gray-600">
                      <span>{isEnglish ? 'Variation: ' : '规格：'}</span>
                      <span>{isEnglish ? product.Variation : product.Variation_CH}</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    <span>{isEnglish ? 'Origin: ' : '产地：'}</span>
                    <span>{isEnglish ? product.Country : product.Country_CH}</span>
                  </div>
                </div>

                {user ? (
                  <div className="mb-4">
                    <div className="text-lg font-semibold text-green-600">
                      ${product.price.toFixed(2)}/{product.UOM}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mb-4 text-blue-600 hover:text-blue-900"
                  >
                    {isEnglish ? 'Login to see price' : '登录查看价格'}
                  </button>
                )}

                <div className="flex items-center justify-between">
                  {user ? (
                    cartItem ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span>{cartItem.quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToOrder(product)}
                        className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                      >
                        {isEnglish ? 'Add to Order' : '添加到订单'}
                      </button>
                    )
                  ) : null}
                  <button
                    onClick={() => handleCustomerService()}
                    className="ml-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                  >
                    {isEnglish ? 'Inquire' : '询价'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Order Button */}
      {selectedProducts.length > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOrderPanelOpen(true)}
          className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-40"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">
              {isEnglish ? 'View Order' : '查看订单'}
            </span>
            <span className="bg-white text-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              {selectedProducts.length}
            </span>
          </div>
        </motion.button>
      )}

      {/* Order Panel */}
      {isOrderPanelOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOrderPanelOpen(false);
            }
          }}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="w-full max-w-md bg-white h-full p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{isEnglish ? 'Create Order' : '创建订单'}</h2>
              <button
                onClick={() => setIsOrderPanelOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Customer Information */}
            <div className="mb-4 space-y-3">
              <h3 className="font-semibold">{isEnglish ? 'Customer Information' : '客户信息'}</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isEnglish ? 'Customer Name' : '客户姓名'}
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder={isEnglish ? 'Enter customer name' : '输入客户姓名'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isEnglish ? 'Phone Number' : '电话号码'}
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder={isEnglish ? 'Enter phone number' : '输入电话号码'}
                    required
                  />
                </div>
              </div>
            </div>

            {selectedProducts.length > 0 && (
              <div className="mb-4 space-y-2">
                <h3 className="font-semibold mb-2">{isEnglish ? 'Selected Products' : '已选产品'}</h3>
                {selectedProducts.map(({ product, quantity }) => (
                  <div key={product.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium">{isEnglish ? product.Product : product.Product_CH}</p>
                      <span className="text-sm text-gray-600">${product.price.toFixed(2)}/{product.UOM}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(product.id, quantity - 1)}
                          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                        >
                          -
                        </button>
                        <span className="text-sm">{quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(product.id, quantity + 1)}
                          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleUpdateQuantity(product.id, 0)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        {isEnglish ? 'Remove' : '移除'}
                      </button>
                    </div>
                  </div>
                ))}
                <div className="text-right font-semibold mt-2">
                  {isEnglish ? 'Total:' : '总计:'} $
                  {selectedProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}
                </div>
              </div>
            )}

            <button
              onClick={handleSubmitOrder}
              disabled={selectedProducts.length === 0}
              className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
            >
              {isEnglish ? 'Submit Order' : '提交订单'}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

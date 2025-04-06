"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useCart } from './contexts/CartContext';
import type { CartItem, Product } from './contexts/CartContext';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
    switch (categoryNumber) {
      case 1:
        return 'Dried Chilli';
      case 2:
        return 'Beans & Legumes';
      case 3:
        return 'Nuts & Seeds';
      case 4:
        return 'Herbs and Spices';
      case 5:
        return 'Grains';
      case 6:
        return 'Dried Seafood';
      case 7:
        return 'Vegetables';
      case 8:
        return 'Dried Mushroom & Fungus';
      default:
        return 'Unknown Category';
    }
  };

  // Get category Chinese name
  const getCategoryChineseName = (categoryNumber: number) => {
    switch (categoryNumber) {
      case 1:
        return '干辣椒';
      case 2:
        return '豆类';
      case 3:
        return '坚果和种子';
      case 4:
        return '香料';
      case 5:
        return '谷物';
      case 6:
        return '海鲜干货';
      case 7:
        return '蔬菜';
      case 8:
        return '菇类和菌类';
      default:
        return '';
    }
  };

  const handleCustomerService = () => {
    const phoneNumber = '6587520417'; 
    const message = 'Hi, I would like to inquire about your products.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

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
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      // Create order items with user_id
      const orderItems = selectedProducts.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        total_price: item.product.price * item.quantity,
        product_name: isEnglish ? item.product.Product : item.product.Product_CH,
        product_code: item.product["Item Code"] || 'N/A',
        user_id: user.id,  // Add user_id to order items
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        throw itemsError;
      }

      // Reset form and close panel
      setSelectedProducts([]);
      setIsOrderPanelOpen(false);

      // Show success message
      alert(isEnglish ? 'Order submitted successfully!' : '订单提交成功！');
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(isEnglish ? 'Error submitting order. Please try again.' : '提交订单时出错，请重试。');
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

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {products.map((product) => {
          const cartItem = cartItems.find((item: CartItem) => item.product_id === product.id);
          
          return (
            <motion.div
              key={product.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-1">
                <h2 className="font-semibold text-base">{isEnglish ? product.Product : product.Product_CH}</h2>
                <span className="text-xs text-gray-500">{product["Item Code"]}</span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">{isEnglish ? 'Category:' : '类别:'}</span>
                  <div className="text-gray-600">
                    {isEnglish ? getCategoryName(product.Category) : getCategoryChineseName(product.Category)}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">{isEnglish ? 'Weight:' : '重量:'}</span>
                  <span className="text-gray-600">{product.Weight} {product.UOM}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">{isEnglish ? 'Origin:' : '产地:'}</span>
                  <span className="text-gray-600">{isEnglish ? product.Country : product.Country_CH}</span>
                </div>

                {product.Variation && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{isEnglish ? 'Variation:' : '规格:'}</span>
                    <span className="text-gray-600">{isEnglish ? product.Variation : product.Variation_CH}</span>
                  </div>
                )}

                {user ? (
                  <div className="text-right font-semibold text-base text-green-600">
                    ${product.price.toFixed(2)}/{product.UOM}
                  </div>
                ) : (
                  <div className="text-right font-medium text-sm text-blue-600">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="hover:underline"
                    >
                      {isEnglish ? 'Login to see price' : '登录查看价格'}
                    </button>
                  </div>
                )}

                {user && (
                  cartItem ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center text-sm">{cartItem.quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToOrder(product)}
                        className="flex-1 px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                      >
                        {isEnglish ? 'Add to Order' : '添加到订单'}
                      </button>
                      <button
                        onClick={() => handleCustomerService()}
                        className="flex-1 px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
                      >
                        {isEnglish ? 'Make Offer' : '询价'}
                      </button>
                    </div>
                  )
                )}

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCustomerService}
                  className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs mt-1 transition-colors"
                >
                  <span>{isEnglish ? 'Customer Service' : '客服'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

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

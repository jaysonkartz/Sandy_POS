"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

interface Order {
  id: number;
  status: string;
  total_amount: number;
  created_at: string;
  user_id: string;
}

interface OrderItem {
  id: number;
  order_id: number;
  product_name: string;
  quantity: number;
  price: number;
  total_price: number;
  product_code: string;
  user_id: string;
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<{ [key: number]: OrderItem[] }>({});
  const [loading, setLoading] = useState(true);
  const [isEnglish, setIsEnglish] = useState(true);
  const supabase = createClientComponentClient();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  async function fetchOrders() {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch orders for the current user
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        setOrders([]);
        setOrderItems({});
        return;
      }

      setOrders(ordersData || []);

      // Fetch order items for each order
      if (ordersData && ordersData.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', ordersData.map(order => order.id))
          .eq('user_id', user.id);

        if (itemsError) {
          console.error('Error fetching order items:', itemsError);
          setOrderItems({});
          return;
        }

        // Group items by order_id
        const itemsByOrder = (itemsData || []).reduce((acc, item) => {
          if (!acc[item.order_id]) {
            acc[item.order_id] = [];
          }
          acc[item.order_id].push(item);
          return acc;
        }, {} as { [key: number]: OrderItem[] });

        setOrderItems(itemsByOrder);
      } else {
        setOrderItems({});
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      setOrderItems({});
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-gray-600">
          {isEnglish ? 'Please log in to view your order history' : '请登录以查看您的订单历史'}
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-gray-600">
          {isEnglish ? 'No orders found' : '未找到订单'}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isEnglish ? 'Order History' : '订单历史'}
        </h1>
        <button
          onClick={() => setIsEnglish(!isEnglish)}
          className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          {isEnglish ? '中文' : 'English'}
        </button>
      </div>

      <div className="space-y-4">
        {Array.isArray(orders) && orders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-4 mb-4"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg">
                  {isEnglish ? 'Order' : '订单'} #{order.id}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDate(order.created_at)}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-sm ${
                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {isEnglish ? order.status : 
                  order.status === 'pending' ? '待处理' :
                  order.status === 'completed' ? '已完成' : '已取消'
                }
              </span>
            </div>

            {orderItems[order.id] && Array.isArray(orderItems[order.id]) && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">
                  {isEnglish ? 'Order Items' : '订单项目'}
                </h4>
                <div className="space-y-2">
                  {orderItems[order.id].map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-gray-500">{item.product_code}</p>
                      </div>
                      <div className="text-right">
                        <p>{item.quantity} x ${item.price.toFixed(2)}</p>
                        <p className="font-medium">${item.total_price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="font-medium">
                {isEnglish ? 'Total Amount' : '总金额'}
              </span>
              <span className="font-semibold">
                ${order.total_amount.toFixed(2)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 
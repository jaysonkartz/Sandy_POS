"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type Order = {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  user_id: string;
};

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
};

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<{ [key: string]: OrderItem[] }>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/");
          return;
        }

        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(ordersData || []);

        // Fetch items for each order
        if (ordersData && ordersData.length > 0) {
          const { data: itemsData, error: itemsError } = await supabase
            .from("order_items")
            .select("*")
            .in(
              "order_id",
              ordersData.map((order) => order.id)
            );

          if (itemsError) throw itemsError;

          // Group items by order_id
          const itemsByOrder = (itemsData || []).reduce(
            (acc, item) => {
              if (!acc[item.order_id]) {
                acc[item.order_id] = [];
              }
              acc[item.order_id].push(item);
              return acc;
            },
            {} as { [key: string]: OrderItem[] }
          );

          setOrderItems(itemsByOrder);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router, supabase]);

  // Add new function to process data for charts
  const prepareChartData = () => {
    // Monthly sales data
    const monthlyData = orders.reduce((acc: { [key: string]: number }, order) => {
      const month = new Date(order.created_at).toLocaleString("default", { month: "short" });
      acc[month] = (acc[month] || 0) + order.total_amount;
      return acc;
    }, {});

    // Order status distribution
    const statusData = orders.reduce((acc: { [key: string]: number }, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    return {
      monthly: monthlyData,
      status: statusData,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const chartData = prepareChartData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button
          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          onClick={() => router.push("/")}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
          Back to Main Page
        </button>
        <h1 className="text-2xl font-bold">Order History</h1>
      </div>

      {/* Charts Section */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Sales Chart */}
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-lg font-medium mb-4">Monthly Sales</h2>
          <Line
            data={{
              labels: Object.keys(chartData.monthly),
              datasets: [
                {
                  label: "Sales ($)",
                  data: Object.values(chartData.monthly),
                  borderColor: "rgb(75, 192, 192)",
                  tension: 0.1,
                  fill: false,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "top",
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-lg font-medium mb-4">Order Status Distribution</h2>
          <Doughnut
            data={{
              labels: Object.keys(chartData.status),
              datasets: [
                {
                  data: Object.values(chartData.status),
                  backgroundColor: [
                    "rgba(75, 192, 192, 0.8)",
                    "rgba(255, 206, 86, 0.8)",
                    "rgba(255, 99, 132, 0.8)",
                  ],
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "top",
                },
              },
            }}
          />
        </div>

        {/* Summary Cards */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <p className="text-2xl font-bold text-gray-900">
              ${orders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-sm font-medium text-gray-500">Average Order Value</h3>
            <p className="text-2xl font-bold text-gray-900">
              $
              {(
                orders.reduce((sum, order) => sum + order.total_amount, 0) / orders.length || 0
              ).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Order #{order.id}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : order.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <span className="text-lg font-medium text-gray-900">
                    ${order.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {orderItems[order.id] && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Items</h4>
                  <div className="space-y-2">
                    {orderItems[order.id].map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-900">
                          {item.product_name} x {item.quantity}
                        </span>
                        <span className="text-gray-500">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

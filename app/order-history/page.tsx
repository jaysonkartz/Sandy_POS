"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Database } from "@/types/supabase";
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
import { Line, Doughnut } from "react-chartjs-2";

// Register ChartJS modules
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

export default function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [itemsData, setItemsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/");
          return;
        }

        const { data: ordersData = [] } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        const { data: itemsDataResult = [] } = await supabase
          .from("order_items")
          .select("*")
          .in(
            "order_id",
            ordersData?.map((o) => o.id) || []
          );

        setOrders(ordersData || []);
        setItemsData(itemsDataResult || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!orders || !itemsData) {
    return <div>No orders found</div>;
  }

  const orderItems = itemsData.reduce((acc: Record<string, typeof itemsData>, item: { order_id: string }) => {
    if (!acc[item.order_id]) acc[item.order_id] = [];
    acc[item.order_id].push(item);
    return acc;
  }, {} as Record<string, typeof itemsData>);

  const monthlyData = orders.reduce((acc: Record<string, number>, order: { created_at: string; total_amount: number }) => {
    const month = new Date(order.created_at).toLocaleString("default", { month: "short" });
    acc[month] = (acc[month] || 0) + order.total_amount;
    return acc;
  }, {} as Record<string, number>);

  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const sortedMonthlyData = monthOrder.reduce((acc: Record<string, number>, month: string) => {
    if (monthlyData[month]) acc[month] = monthlyData[month];
    return acc;
  }, {} as Record<string, number>);

  const statusData = orders.reduce((acc: Record<string, number>, order: { status: string }) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
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
        </a>
        <h1 className="text-2xl font-bold">Order History</h1>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-lg font-medium mb-4">Monthly Spend</h2>
          <Line
            data={{
              labels: Object.keys(sortedMonthlyData),
              datasets: [
                {
                  label: "Spend ($)",
                  data: Object.values(sortedMonthlyData),
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

        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-lg font-medium mb-4">Order Status Distribution</h2>
          <Doughnut
            data={{
              labels: Object.keys(statusData),
              datasets: [
                {
                  data: Object.values(statusData),
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

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-sm font-medium text-gray-500">Total Spent</h3>
            <p className="text-2xl font-bold text-gray-900">
              ${orders.reduce((sum: number, order: { total_amount: number }) => sum + order.total_amount, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-sm font-medium text-gray-500">Average Order Value</h3>
            <p className="text-2xl font-bold text-gray-900">
              $
              {(
                orders.reduce((sum: number, order: { total_amount: number }) => sum + order.total_amount, 0) / orders.length || 0
              ).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {orders.map((order: { id: string; created_at: string; total_amount: number; status: string }) => (
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
                    {orderItems[order.id].map((item: { product_name: string; quantity: number; price: number }, index: number) => (
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

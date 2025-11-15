"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Database } from "@/types/supabase";
import { useOrder } from "@/app/hooks/useOrder";
import { ShoppingBag } from "lucide-react";
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
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const ordersPerPage = 5;
  const router = useRouter();
  const { addToOrder, updateQuantity, setCustomerName, setCustomerPhone, setCustomerAddress } = useOrder();

  const handleReorder = async (orderId: string) => {
    try {
      setReorderingId(orderId);
      console.log("Starting reorder for order ID:", orderId);
      console.log("ItemsData available:", itemsData.length);
      
      // Convert orderId to both string and number for comparison (order_id might be stored as either)
      const orderIdStr = String(orderId);
      const orderIdNum = Number(orderId);
      
      // Get items for this specific order from itemsData
      const items = itemsData.filter((item: any) => {
        const itemOrderId = String(item.order_id);
        return itemOrderId === orderIdStr || item.order_id === orderIdNum;
      });
      
      console.log("Filtered items:", items);
      
      if (!items || items.length === 0) {
        console.error("No items found for order", orderId, "Available order_ids:", itemsData.map((i: any) => i.order_id));
        alert("No items found for this order. Please try refreshing the page.");
        setReorderingId(null);
        return;
      }

      // Get the order details
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("customer_name, customer_phone, customer_address")
        .eq("id", orderId)
        .single();
        
      if (orderError) {
        console.error("Error fetching order data:", orderError);
      }

      console.log("Order data:", orderData);
      console.log("Reordering items:", items);

      // First, add all items to the order (with quantity 1 initially)
      for (const item of items) {
        console.log("Processing item:", item);

        // Get the actual product details from the database
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", item.product_id)
          .single();

        if (productError) {
          console.error("Error fetching product:", productError, "for product_id:", item.product_id);
        }

        console.log("Product data from DB:", productData);

        if (productData) {
          const orderItem = {
            id: productData.id,
            "Item Code": productData["Item Code"] || "",
            Product: productData.Product || item.product_name,
            Category: productData.Category || "",
            weight: productData.weight || "",
            UOM: productData.UOM || "",
            Country: productData.Country || "",
            Product_CH: productData.Product_CH,
            Category_CH: productData.Category_CH,
            Country_CH: productData.Country_CH,
            Variation: productData.Variation,
            Variation_CH: productData.Variation_CH,
            price: productData.price || item.price,
            uom: productData.uom || "",
            stock_quantity: productData.stock_quantity || 0,
            image_url: productData.image_url || item.image_url || "/product-placeholder.svg",
          };

          console.log("Adding to order:", orderItem);
          addToOrder(orderItem);
        } else {
          console.warn("Product not found in DB, using original item data. Product ID:", item.product_id);
          // Fallback to original item data if product not found
          addToOrder({
            id: item.product_id,
            "Item Code": "",
            Product: item.product_name || "Unknown Product",
            Category: "",
            weight: "",
            UOM: "",
            Country: "",
            price: item.price || 0,
            uom: "",
            stock_quantity: 0,
            image_url: item.image_url || "/product-placeholder.svg",
          });
        }
      }
      
      console.log("All items added to order");

      // Set customer info if available
      if (orderData) {
        setCustomerName(orderData.customer_name || "");
        setCustomerPhone(orderData.customer_phone || "");
        setCustomerAddress(orderData.customer_address || "");
        console.log("Customer info set:", {
          name: orderData.customer_name,
          phone: orderData.customer_phone,
          address: orderData.customer_address
        });
      }

      // Wait a brief moment for state updates, then update quantities
      console.log("Waiting for state updates...");
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Now update quantities to match the original order
      console.log("Updating quantities for", items.length, "items");
      for (const item of items) {
        if (item.quantity && item.quantity > 0) {
          console.log(`Updating quantity for product ${item.product_id} to ${item.quantity}`);
          updateQuantity(item.product_id, item.quantity);
        }
      }

      // Wait a bit more for quantity updates
      await new Promise(resolve => setTimeout(resolve, 100));

      // Prepare items for localStorage
      const itemsToStore = items.map((item: any) => ({
        product: {
          id: item.product_id,
          "Item Code": "",
          Product: item.product_name,
          Category: "",
          weight: "",
          UOM: "",
          Country: "",
          price: item.price,
          uom: "",
          stock_quantity: 0,
          image_url: item.image_url || "/product-placeholder.svg",
        },
        quantity: item.quantity,
      }));

      // Store customer details and order items in localStorage for persistence
      if (orderData) {
        localStorage.setItem("reorder_customer_name", orderData.customer_name || "");
        localStorage.setItem("reorder_customer_phone", orderData.customer_phone || "");
        localStorage.setItem("reorder_customer_address", orderData.customer_address || "");
      }

      // Store order items in localStorage
      localStorage.setItem("reorder_items", JSON.stringify(itemsToStore));

      console.log("Redirecting to main page with order panel");
      // Redirect to main page with order panel and customer info
      router.push("/?order=true&reorder=true");
    } catch (error) {
      console.error("Error reordering items:", error);
      alert("Failed to add items to cart. Please try again.");
    } finally {
      setReorderingId(null);
    }
  };

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchOrders = async (page: number, isLoadMore = false) => {
    try {
      const loadingState = isLoadMore ? setLoadingMore : setLoading;
      loadingState(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      // Calculate pagination range
      const from = (page - 1) * ordersPerPage;
      const to = from + ordersPerPage - 1;

      // Fetch orders with count
      const { data: ordersData = [], count } = await supabase
        .from("orders")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      // Fetch items for these orders
      const { data: itemsDataResult = [] } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", ordersData?.map((o) => o.id) || []);

      if (isLoadMore) {
        setOrders((prev) => [...prev, ...(ordersData || [])]);
        setItemsData((prev) => [...prev, ...(itemsDataResult || [])]);
      } else {
        setOrders(ordersData || []);
        setItemsData(itemsDataResult || []);
      }

      // Update hasMore based on count
      setHasMore(count ? from + ordersPerPage < count : false);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      const loadingState = isLoadMore ? setLoadingMore : setLoading;
      loadingState(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchOrders(nextPage, true);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

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

  const orderItems = itemsData.reduce(
    (acc: Record<string, typeof itemsData>, item: { order_id: string }) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push(item);
      return acc;
    },
    {} as Record<string, typeof itemsData>
  );

  const monthlyData = orders.reduce(
    (acc: Record<string, number>, order: { created_at: string; total_amount: number }) => {
      const month = new Date(order.created_at).toLocaleString("default", { month: "short" });
      acc[month] = (acc[month] || 0) + order.total_amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const monthOrder = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const sortedMonthlyData = monthOrder.reduce(
    (acc: Record<string, number>, month: string) => {
      if (monthlyData[month]) acc[month] = monthlyData[month];
      return acc;
    },
    {} as Record<string, number>
  );

  const statusData = orders.reduce(
    (acc: Record<string, number>, order: { status: string }) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <a
          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          href="/"
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
              $
              {orders
                .reduce(
                  (sum: number, order: { total_amount: number }) => sum + order.total_amount,
                  0
                )
                .toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-sm font-medium text-gray-500">Average Order Value</h3>
            <p className="text-2xl font-bold text-gray-900">
              $
              {(
                orders.reduce(
                  (sum: number, order: { total_amount: number }) => sum + order.total_amount,
                  0
                ) / orders.length || 0
              ).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {orders.length === 0 && !loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          orders.map(
            (order: { id: string; created_at: string; total_amount: number; status: string }) => (
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
                      <button
                        onClick={() => handleReorder(order.id)}
                        disabled={reorderingId === order.id}
                        className={`ml-4 inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          reorderingId === order.id
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        {reorderingId === order.id ? "Adding to Cart..." : "Reorder"}
                      </button>
                    </div>
                  </div>

                  {orderItems[order.id] && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Items</h4>
                      <div className="space-y-2">
                        {orderItems[order.id].map(
                          (
                            item: { product_name: string; quantity: number; price: number },
                            index: number
                          ) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-900">
                                {item.product_name} x {item.quantity}
                              </span>
                              <span className="text-gray-500">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          )
        )}

        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className={`px-6 py-3 text-sm font-medium rounded-md transition-colors ${
                loadingMore
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {loadingMore ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </div>
              ) : (
                "Load More Orders"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

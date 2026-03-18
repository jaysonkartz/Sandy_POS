"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";

const OrderHistoryAnalytics = dynamic(() => import("@/app/components/OrderHistoryAnalytics"), {
  ssr: false,
  loading: () => (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-xl h-[280px] animate-pulse" />
      <div className="bg-white p-6 rounded-lg shadow-xl h-[280px] animate-pulse" />
    </div>
  ),
});

export default function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [itemsData, setItemsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const ordersPerPage = 5;
  const router = useRouter();

  const handleReorder = async (orderId: string) => {
    try {
      setReorderingId(orderId);

      // Convert orderId to both string and number for comparison (order_id might be stored as either)
      const orderIdStr = String(orderId);
      const orderIdNum = Number(orderId);
      
      // Get items for this specific order from itemsData
      const items = itemsData.filter((item: any) => {
        const itemOrderId = String(item.order_id);
        return itemOrderId === orderIdStr || item.order_id === orderIdNum;
      });
      

      if (!items || items.length === 0) {
        alert("No items found for this order. Please try refreshing the page.");
        setReorderingId(null);
        return;
      }
      const selectedOrder = orders.find((order) => String(order.id) === orderIdStr);

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
      if (selectedOrder) {
        localStorage.setItem("reorder_customer_name", selectedOrder.customer_name || "");
        localStorage.setItem("reorder_customer_phone", selectedOrder.customer_phone || "");
        localStorage.setItem("reorder_customer_address", selectedOrder.customer_address || "");
      }

      // Store order items in localStorage
      localStorage.setItem("reorder_items", JSON.stringify(itemsToStore));

      // Redirect to main page with order panel and customer info
      router.push("/?order=true&reorder=true");
    } catch (error) {
      alert("Failed to add items to cart. Please try again.");
    } finally {
      setReorderingId(null);
    }
  };
  const fetchOrders = async (page: number, isLoadMore = false) => {
    try {
      const loadingState = isLoadMore ? setLoadingMore : setLoading;
      loadingState(true);

      if (!userIdRef.current) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/");
          return;
        }

        userIdRef.current = user.id;
      }

      // Calculate pagination range
      const from = (page - 1) * ordersPerPage;
      const to = from + ordersPerPage - 1;

      // Fetch orders with count
      const { data: ordersData = [], count } = await (supabase
        .from("orders") as any)
        .select(
          "id, created_at, total_amount, status, customer_name, customer_phone, customer_address",
          { count: "planned" }
        )
        .eq("user_id", userIdRef.current)
        .order("created_at", { ascending: false })
        .range(from, to);

      const orderIds = (ordersData as any[])?.map((o: any) => o.id) || [];

      let itemsDataResult: any[] = [];
      if (orderIds.length > 0) {
        const { data = [] } = await (supabase
          .from("order_items") as any)
          .select("order_id, product_id, quantity, price, product_name, image_url")
          .in("order_id", orderIds);
        itemsDataResult = data;
      }

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

  const orderItems = useMemo(
    () =>
      itemsData.reduce(
        (acc: Record<string, typeof itemsData>, item: { order_id: string }) => {
          if (!acc[item.order_id]) acc[item.order_id] = [];
          acc[item.order_id].push(item);
          return acc;
        },
        {} as Record<string, typeof itemsData>
      ),
    [itemsData]
  );

  const chartOrders = useMemo(
    () =>
      orders.map((order: { created_at: string; total_amount: number; status: string }) => ({
        created_at: order.created_at,
        total_amount: Number(order.total_amount || 0),
        status: order.status,
      })),
    [orders]
  );

  const hasChartsData = chartOrders.length > 0;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

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

      {hasChartsData && <OrderHistoryAnalytics orders={chartOrders} />}

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
                        ${Number(order.total_amount || 0).toFixed(2)}
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

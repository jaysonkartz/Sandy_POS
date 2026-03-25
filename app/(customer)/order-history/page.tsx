"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";

const OrderHistoryAnalytics = dynamic(() => import("@/app/components/OrderHistoryAnalytics"), {
  ssr: false,
  loading: () => (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="h-[280px] animate-pulse rounded-lg bg-white p-6 shadow-xl" />
      <div className="h-[280px] animate-pulse rounded-lg bg-white p-6 shadow-xl" />
    </div>
  ),
});

const REORDER_PAYLOAD_KEY = "reorder_payload_v2";

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

  const handleReorder = async (orderId: string | number) => {
    try {
      const orderIdStr = String(orderId);
      setReorderingId(orderIdStr);

      const selectedOrder = orders.find((o) => String(o.id) === orderIdStr);

      const { data: items, error } = await (supabase.from("order_items") as any)
        .select("product_id, quantity, price, product_name")
        .eq("order_id", orderId);

      if (error) {
        console.error("Error fetching reorder items:", error);
        alert("Failed to load order items.");
        return;
      }

      if (!items || items.length === 0) {
        alert("No items found for this order.");
        return;
      }

      const productIds = items.map((i: any) => i.product_id);

      const { data: products, error: productsError } = await (supabase.from("products") as any)
        .select(
          `
          id,
          "Item Code",
          Product,
          Product_CH,
          Category,
          weight,
          UOM,
          Country,
          price,
          uom,
          stock_quantity,
          image_url
        `
        )
        .in("id", productIds);

      if (productsError) {
        console.error("Error fetching product details for reorder:", productsError);
      }

      const productMap = new Map((products || []).map((p: any) => [p.id, p]));

      const reorderItems = items.map((item: any) => {
        const product = productMap.get(item.product_id);

        return {
          product: product || {
            id: item.product_id,
            "Item Code": "",
            Product: item.product_name,
            Category: "",
            weight: "",
            UOM: "",
            Country: "",
            price: Number(item.price || 0),
            uom: "",
            stock_quantity: 0,
            image_url: "/product-placeholder.svg",
          },
          quantity: Number(item.quantity || 0),
        };
      });

      const reorderPayload = {
        sourceOrderId: orderIdStr,
        createdAt: new Date().toISOString(),
        customerName: selectedOrder?.customer_name || "",
        customerPhone: selectedOrder?.customer_phone || "",
        customerAddress: selectedOrder?.customer_address || "",
        items: reorderItems,
      };

      localStorage.setItem(REORDER_PAYLOAD_KEY, JSON.stringify(reorderPayload));

      router.push("/?order=true&reorder=true");
    } catch (err) {
      console.error("Reorder failed:", err);
      alert("Reorder failed.");
    } finally {
      setReorderingId(null);
    }
  };

  const fetchOrders = useCallback(
    async (page: number, isLoadMore = false) => {
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

        const from = (page - 1) * ordersPerPage;
        const to = from + ordersPerPage - 1;

        const { data: ordersData = [], count } = await (supabase.from("orders") as any)
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
          const { data = [] } = await (supabase.from("order_items") as any)
            .select("order_id, product_id, quantity, price, product_name")
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

        setHasMore(count ? from + ordersPerPage < count : false);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        const loadingState = isLoadMore ? setLoadingMore : setLoading;
        loadingState(false);
      }
    },
    [ordersPerPage, router]
  );

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchOrders(nextPage, true);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

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
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <a
          className="inline-flex items-center rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          href="/"
        >
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="py-8 text-center">
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          orders.map(
            (order: {
              id: string | number;
              created_at: string;
              total_amount: number;
              status: string;
              customer_name?: string;
              customer_phone?: string;
              customer_address?: string;
            }) => (
              <div key={order.id} className="overflow-hidden rounded-lg bg-white shadow-xl">
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Order #{order.id}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
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
                        className={`ml-4 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
                          reorderingId === String(order.id)
                            ? "cursor-not-allowed bg-gray-200 text-gray-500"
                            : "bg-green-500 text-white shadow hover:-translate-y-0.5 hover:bg-green-600 hover:shadow-md"
                        }`}
                        disabled={reorderingId === String(order.id)}
                        onClick={() => handleReorder(order.id)}
                      >
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        {reorderingId === String(order.id) ? "Preparing..." : "Reorder"}
                      </button>
                    </div>
                  </div>

                  {orderItems[String(order.id)] && (
                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-medium text-gray-500">Items</h4>
                      <div className="space-y-2">
                        {orderItems[String(order.id)].map(
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
          <div className="mt-8 flex justify-center">
            <button
              className={`rounded-md px-6 py-3 text-sm font-medium transition-colors ${
                loadingMore
                  ? "cursor-not-allowed bg-gray-200 text-gray-500"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              disabled={loadingMore}
              onClick={loadMore}
            >
              {loadingMore ? (
                <div className="flex items-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
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

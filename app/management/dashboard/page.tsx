"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
//import PricingManagement from "@/components/PricingManagement";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { supabase } from "@/app/lib/supabaseClient";
import EditUserModal from "@/components/EditUserModal";
import CustomerManagement from "@/components/CustomerManagement";
import { CATEGORY_ID_NAME_MAP } from "@/app/(admin)/const/category";
//import ProductListTable from "@/components/ProductListTable";
import React from "react";
import { useRouter } from "next/navigation";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardSection {
  id: string;
  title: string;
  icon: JSX.Element;
  description: string;
}

interface User {
  id: string;
  email: string;
  role: string;
  avatar_url: string;
  created_at: string;
}

interface Product {
  id: number;
  Product: string;
  price: number;
  Category: string;
  priceHistory?: {
    previous_price: number;
    last_price_update: string;
  }[];
  order_items?: {
    order_id: number;
    price?: number;
    orders?: {
      customer_name: string;
      customer_phone: string;
      customer_id?: string;
    }[];
  }[];
}

interface Category {
  id: string;
  name: string;
  chineseName?: string;
  products: Product[];
}

interface OrderDetail {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  status: string;
}

export default function ManagementDashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Number of orders per page
  const [totalOrders, setTotalOrders] = useState(0);
  const [editingCustomer, setEditingCustomer] = useState<{
    orderItemId: number;
    price: number;
  } | null>(null);
  const [newCustomerPrice, setNewCustomerPrice] = useState<number | null>(null);
  // Track offer prices for each customer-product combination
  const [offerPrices, setOfferPrices] = useState<{
    [key: string]: number | null;
  }>({});
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [topSellingProducts, setTopSellingProducts] = useState<{
    byQuantity: Array<{
      category: string;
      product: string;
      variation: string;
      quantity: number;
    }>;
    byPrice: Array<{
      product: string;
      variation: string;
      value: number;
    }>;
  }>({ byQuantity: [], byPrice: [] });
  const [selectedMonth, setSelectedMonth] = useState("September");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [monthYearMap, setMonthYearMap] = useState<Map<string, number>>(new Map());
  const [recentOrders, setRecentOrders] = useState<Array<{
    id: number;
    created_at: string;
    customer_name: string;
    customer_phone: string;
    total_amount: number;
    status: string;
  }>>([]);

  const priceHistoryMap: Record<number, { previous_price: number; last_price_update: string }[]> =
    {};

  // Clear all offer prices
  const clearOfferPrices = () => {
    setOfferPrices({});
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Clear offer prices when switching products
  useEffect(() => {
    clearOfferPrices();
  }, [selectedProduct]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "users") {
      fetchUsers();
    }
  }, [activeSection]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const { data: products, error } = await supabase
        .from("products")
        .select(
          `
          id,
          Product,
          price,
          Category,
          order_items (
            order_id,
            price,
            orders (
              customer_name,
              customer_phone,
              customer_id
            )
          )
        `
        )
        .order("Category", { ascending: true });

      if (error) throw error;
      const { data: priceHistories, error: priceHistoryError } = await supabase
        .from("product_price_history")
        .select("product_id, previous_price, original_price, last_price_update")
        .order("last_price_update", { ascending: false });

      if (priceHistoryError) {
        console.error("Failed to fetch price history:", priceHistoryError);
      }

      // Group price histories by product_id
      const priceHistoryMap: { [key: number]: any[] } = {};
      (priceHistories || []).forEach((ph: any) => {
        if (!priceHistoryMap[ph.product_id]) priceHistoryMap[ph.product_id] = [];
        priceHistoryMap[ph.product_id].push(ph);
      });

      // Group products by category
      const categoryGroups: { [key: string]: Product[] } = {};
      (products || []).forEach((product: any) => {
        // Get category name from ID, fallback to ID if not found
        const categoryId = product.Category;
        const categoryName = CATEGORY_ID_NAME_MAP[categoryId] || categoryId || "Uncategorized";

        if (!categoryGroups[categoryName]) {
          categoryGroups[categoryName] = [];
        }
        categoryGroups[categoryName].push({
          ...product,
          priceHistory: (priceHistoryMap[product.id] || []).slice(0, 3),
        });
      });

      // Convert to array format
      const categoriesArray = Object.entries(categoryGroups).map(([name, products]) => ({
        id: name,
        name: name,
        products: products.sort((a: Product, b: Product) => a.Product.localeCompare(b.Product)),
      }));

      setCategories(categoriesArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchTopSellingProducts();
    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, customer_name, customer_phone, total_amount, status")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentOrders(data || []);
    } catch (error) {
      console.error("Error fetching recent orders:", error);
    }
  };

  const fetchTopSellingProducts = async (month?: string) => {
    try {
      // First, get all available months from orders
      const { data: allOrders, error: monthsError } = await supabase
        .from("orders")
        .select("created_at")
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (monthsError) throw monthsError;

      // Extract unique months with year
      const monthYearMap = new Map<string, number>();
      allOrders?.forEach((order: any) => {
        const date = new Date(order.created_at);
        const monthName = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        monthYearMap.set(monthName, year);
      });
      
      const monthsArray = Array.from(monthYearMap.keys());
      setAvailableMonths(monthsArray);
      setMonthYearMap(monthYearMap);

      // If no month specified, use the first available month or current month
      const targetMonth = month || monthsArray[0] || new Date().toLocaleString('default', { month: 'long' });
      setSelectedMonth(targetMonth);

      // Get the actual year for the selected month from the data
      const targetYear = monthYearMap.get(targetMonth) || new Date().getFullYear();
      const monthNumber = new Date(`${targetMonth} 1, ${targetYear}`).getMonth() + 1;
      
      // Fetch order items filtered by month and year
      const startDate = new Date(targetYear, monthNumber - 1, 1).toISOString();
      const endDate = new Date(targetYear, monthNumber, 0, 23, 59, 59).toISOString();
      
      console.log('Month detection debug:', {
        allOrdersCount: allOrders?.length,
        monthYearMap: Object.fromEntries(monthYearMap),
        monthsArray,
        targetMonth,
        targetYear,
        monthNumber,
        startDate,
        endDate
      });

      const { data: orderItems, error } = await supabase
        .from("order_items")
        .select(`
          quantity,
          price,
          product_name,
          product_code,
          orders!inner(
            created_at,
            status
          )
        `)
        .eq("orders.status", "completed")
        .gte("orders.created_at", startDate)
        .lte("orders.created_at", endDate);

      if (error) throw error;

      // Process data to get top selling products by quantity
      const productQuantityMap = new Map<string, {
        category: string;
        product: string;
        variation: string;
        quantity: number;
      }>();

      const productValueMap = new Map<string, {
        product: string;
        variation: string;
        value: number;
      }>();

      orderItems?.forEach((item: any) => {
        const productName = item.product_name || "Unknown Product";
        const variation = "small"; // You can extract this from product data if available
        const category = "Chilli"; // You can extract this from product data if available
        const quantity = item.quantity || 0;
        const value = (item.price || 0) * quantity;

        // Group by product name for quantity
        const quantityKey = `${productName}-${variation}`;
        if (productQuantityMap.has(quantityKey)) {
          const existing = productQuantityMap.get(quantityKey)!;
          existing.quantity += quantity;
        } else {
          productQuantityMap.set(quantityKey, {
            category,
            product: productName,
            variation,
            quantity
          });
        }

        // Group by product name for value
        const valueKey = `${productName}-${variation}`;
        if (productValueMap.has(valueKey)) {
          const existing = productValueMap.get(valueKey)!;
          existing.value += value;
        } else {
          productValueMap.set(valueKey, {
            product: productName,
            variation,
            value
          });
        }
      });

      // Sort and get top 3 for each category
      const topByQuantity = Array.from(productQuantityMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 3);

      const topByValue = Array.from(productValueMap.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);

      setTopSellingProducts({
        byQuantity: topByQuantity,
        byPrice: topByValue
      });
    } catch (error) {
      console.error("Error fetching top selling products:", error);
    }
  };

  const fetchOrderDetails = async (page = 1) => {
    setIsLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Fetch paginated orders
      const { data, error, count } = await supabase
        .from("orders")
        .select("id, created_at, customer_name, customer_phone, total_amount, status", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setOrderDetails(data || []);
      setTotalOrders(count || 0);
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "history") {
      fetchOrderDetails(currentPage);
    }
  }, [activeSection, currentPage]);

  const sections: DashboardSection[] = [
    {
      id: "overview",
      title: "Overview",
      description: "",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      ),
    },
    {
      id: "pricing",
      title: "Product List",
      description: "",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      ),
    },

    // {
    //   id: "inventory",
    //   title: "Inventory",
    //   description: "Manage your stock",
    //   icon: (
    //     <svg
    //       className="w-6 h-6"
    //       fill="none"
    //       stroke="currentColor"
    //       viewBox="0 0 24 24"
    //     >
    //       <path
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeWidth={2}
    //         d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    //       />
    //     </svg>
    //   ),
    // },
    {
      id: "history",
      title: "History",
      description: "",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      ),
    },
    {
      id: "customers",
      title: "Customers",
      description: "",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      ),
    },
    // {
    //   id: "suppliers",
    //   title: "Suppliers",
    //   description: "Manage your supplier relationships",
    //   icon: (
    //     <svg
    //       className="w-6 h-6"
    //       fill="none"
    //       stroke="currentColor"
    //       viewBox="0 0 24 24"
    //     >
    //       <path
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeWidth={2}
    //         d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    //       />
    //     </svg>
    //   ),
    // },
    {
      id: "users",
      title: "Users",
      description: "",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      ),
    },
  ];

  const renderOverview = () => {
    const salesData = {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Monthly Sales",
          data: [12, 19, 3, 5, 2, 3],
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };


    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
      >
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { title: "Total Products", value: "150", change: "+12%" },
            { title: "Total Sales", value: "$15,234", change: "+23%" },
            { title: "Active Customers", value: "1,234", change: "+5%" },
            { title: "Suppliers", value: "45", change: "0%" },
            { title: "Pending Orders", value: "23", change: "-2%" },
          ].map((stat, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-gray-500 text-sm">{stat.title}</h3>
              <p className="text-2xl font-bold">{stat.value}</p>
              <span
                className={`text-sm ${
                  stat.change.startsWith("+")
                    ? "text-green-500"
                    : stat.change.startsWith("-")
                      ? "text-red-500"
                      : "text-gray-500"
                }`}
              >
                {stat.change} from last month
              </span>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
            <Bar data={salesData} options={{ responsive: true }} />
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products by Quantity */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Top Selling Products (by Qty)</h3>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  fetchTopSellingProducts(e.target.value);
                }}
                className="px-3 py-1 pr-8 bg-blue-100 text-blue-600 rounded text-sm font-medium border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-no-repeat bg-right bg-[length:16px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzM3NDE1MSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')]"
              >
                {availableMonths.map((month) => {
                  const year = monthYearMap.get(month);
                  return (
                    <option key={month} value={month}>
                      {month} {year}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Variation
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantity (unit)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topSellingProducts.byQuantity.length > 0 ? (
                    topSellingProducts.byQuantity.map((product, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.category}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.product}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.variation}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.quantity.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Selling Products by Price */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Top Selling Products (by Price)</h3>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  fetchTopSellingProducts(e.target.value);
                }}
                className="px-3 py-1 pr-8 bg-blue-100 text-blue-600 rounded text-sm font-medium border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-no-repeat bg-right bg-[length:16px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzM3NDE1MSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')]"
              >
                {availableMonths.map((month) => {
                  const year = monthYearMap.get(month);
                  return (
                    <option key={month} value={month}>
                      {month} {year}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Variation
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Value (SGD)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topSellingProducts.byPrice.length > 0 ? (
                    topSellingProducts.byPrice.map((product, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.product}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.variation}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          ${product.value.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order, index) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.customer_name} - ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderUsers = () => {
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">User Management</h2>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            onClick={fetchUsers}
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img alt="" className="h-8 w-8 rounded-full" src={user.avatar_url} />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === "ADMIN"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditModalOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => {
                            // Delete user functionality can be implemented here
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add the EditUserModal */}
        <EditUserModal
          isOpen={isEditModalOpen}
          user={selectedUser}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          onUpdate={() => {
            fetchUsers();
          }}
        />
      </motion.div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return renderOverview();
      case "pricing":
        return (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Product List</h2>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                onClick={() => fetchCategories()}
              >
                Refresh
              </button>
            </div>

            <div>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              {categories.length === 0 && !error && !isLoading && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                  No categories found.
                </div>
              )}
              {isLoading && (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}

              {!isLoading && categories.length > 0 && (
                <div className="space-y-6">
                  {categories.map((category) => (
                    <div key={category.id} className="bg-white rounded-lg shadow p-4 mb-4">
                      <div
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() =>
                          setExpandedCategory(expandedCategory === category.id ? null : category.id)
                        }
                      >
                        <div>
                          <span className="text-lg font-bold">{category.name}</span>
                          <span className="ml-2 text-gray-500">{category.chineseName}</span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            category.products.length > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {category.products.length > 0
                            ? `${category.products.length} Products`
                            : "No Products"}
                        </span>
                      </div>
                      {expandedCategory === category.id && (
                        <div className="mt-4">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Product Name
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Price
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Previous Prices
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {category.products
                                .sort((a, b) => a.Product.localeCompare(b.Product))
                                .map((product) => (
                                  <React.Fragment key={product.id}>
                                    <tr>
                                      <td className="px-4 py-2">
                                        <div className="flex items-center space-x-2">
                                          <button
                                            className="text-blue-600 hover:text-blue-800"
                                            onClick={() =>
                                              setSelectedProduct(
                                                selectedProduct === product.id ? null : product.id
                                              )
                                            }
                                          >
                                            {selectedProduct === product.id ? "▼" : "▶"}{" "}
                                            {product.Product}
                                          </button>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2 flex items-center space-x-2">
                                        {(() => {
                                          const isEditing = editingProductId === product.id;
                                          if (isEditing) {
                                            // Editing mode - no additional logic needed
                                          }
                                          return isEditing;
                                        })() ? (
                                          <>
                                            <input
                                              className="border rounded px-2 py-1 w-20"
                                              type="number"
                                              value={editingPrice ?? product.price}
                                              onChange={(e) =>
                                                setEditingPrice(Number(e.target.value))
                                              }
                                            />
                                            <button
                                              className="text-green-600 font-bold"
                                              title="Save"
                                              onClick={async () => {
                                                if (editingPrice === null || isNaN(editingPrice)) {
                                                  alert("Please enter a valid price.");
                                                  return;
                                                }
                                                setIsLoading(true);

                                                const { data: orderItems, error: orderItemsError } =
                                                  await supabase
                                                    .from("order_items")
                                                    .select("order_id, orders(customer_id)")
                                                    .eq("product_id", product.id);

                                                if (orderItemsError) {
                                                  alert(
                                                    "Failed to fetch order items: " +
                                                      orderItemsError.message
                                                  );
                                                  setIsLoading(false);
                                                  return;
                                                }

                                                const uniqueCustomerIds = [
                                                  ...new Set(
                                                    (orderItems || [])
                                                      .map((oi: any) => {
                                                        const orders = oi.orders as
                                                          | { customer_id?: string }
                                                          | { customer_id?: string }[]
                                                          | undefined;
                                                        if (!orders) return null;
                                                        if (Array.isArray(orders)) {
                                                          return orders[0]?.customer_id ?? null;
                                                        }
                                                        return orders.customer_id ?? null;
                                                      })
                                                      .filter((cid: any) => !!cid)
                                                  ),
                                                ];

                                                if (uniqueCustomerIds.length === 0) {
                                                  await supabase
                                                    .from("product_price_history")
                                                    .insert([
                                                      {
                                                        product_id: product.id,
                                                        previous_price: product.price,
                                                        original_price: editingPrice,
                                                        last_price_update: new Date().toISOString(),
                                                        customer_id: null,
                                                      },
                                                    ]);
                                                } else {
                                                  for (const customerId of uniqueCustomerIds) {
                                                    const { error: insertError } = await supabase
                                                      .from("product_price_history")
                                                      .insert([
                                                        {
                                                          product_id: product.id,
                                                          previous_price: product.price,
                                                          original_price: editingPrice,
                                                          last_price_update:
                                                            new Date().toISOString(),
                                                          customer_id: customerId,
                                                        },
                                                      ]);
                                                    if (insertError) {
                                                      alert(
                                                        "Failed to insert price history: " +
                                                          insertError.message
                                                      );
                                                    }
                                                  }
                                                }

                                                // Now update the product price
                                                const { error: updateError } = await supabase
                                                  .from("products")
                                                  .update({ price: editingPrice })
                                                  .eq("id", product.id);

                                                if (updateError) {
                                                  alert(
                                                    "Failed to update product price: " +
                                                      updateError.message
                                                  );
                                                  setIsLoading(false);
                                                  return;
                                                }

                                                setEditingProductId(null);
                                                setEditingPrice(null);
                                                setIsLoading(false);
                                                fetchCategories();
                                              }}
                                            >
                                              ✔
                                            </button>
                                            <button
                                              className="text-gray-400 font-bold"
                                              title="Cancel"
                                              onClick={() => {
                                                setEditingProductId(null);
                                                setEditingPrice(null);
                                              }}
                                            >
                                              ✖
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            <span>${product.price.toFixed(2)}</span>
                                            <button
                                              className="ml-2 text-blue-600 underline"
                                              title="Edit Price"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // Ensure only one product can be edited at a time
                                                if (editingProductId !== product.id) {
                                                  setEditingProductId(null);
                                                  setEditingPrice(null);
                                                }
                                                setEditingProductId(product.id);
                                                setEditingPrice(product.price);
                                              }}
                                            >
                                              Edit
                                            </button>
                                            {(() => {
                                              // Find all customers for this product
                                              const allCustomers = product.order_items
                                                ?.flatMap((oiRaw) => {
                                                  const oi = oiRaw as {
                                                    price?: number;
                                                    orders?: {
                                                      customer_name: string;
                                                      customer_phone: string;
                                                    }[];
                                                  };
                                                  return Array.isArray(oi.orders)
                                                    ? oi.orders
                                                    : oi.orders
                                                      ? [oi.orders]
                                                      : [];
                                                })
                                                .filter((order) => order.customer_phone);
                                              const hasCustomers =
                                                allCustomers && allCustomers.length > 0;
                                              const waText = hasCustomers
                                                ? allCustomers
                                                    .map(
                                                      (order) =>
                                                        `Hi ${order.customer_name}, the price for ${product.Product} has changed. Please check the latest update!`
                                                    )
                                                    .join("%0A")
                                                : "";
                                              return (
                                                <a
                                                  aria-disabled={!hasCustomers}
                                                  className={`inline-flex items-center px-2 py-1 ${
                                                    hasCustomers
                                                      ? "bg-green-500 hover:bg-green-600 cursor-pointer"
                                                      : "bg-gray-400 cursor-not-allowed opacity-60"
                                                  } text-white rounded transition ml-2`}
                                                  href={
                                                    hasCustomers
                                                      ? `https://wa.me/?text=${waText}`
                                                      : undefined
                                                  }
                                                  rel="noopener noreferrer"
                                                  tabIndex={hasCustomers ? 0 : -1}
                                                  target="_blank"
                                                  title={
                                                    hasCustomers
                                                      ? "Notify all customers via WhatsApp"
                                                      : "No customer to notify"
                                                  }
                                                >
                                                  <svg
                                                    className="w-4 h-4 mr-1"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path d="M20.52 3.48A12.07 12.07 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.18-1.62A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22c-1.85 0-3.68-.5-5.26-1.44l-.38-.22-3.67.96.98-3.58-.25-.37A9.94 9.94 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.2-7.8c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.34-.01-.52-.01-.18 0-.48.07-.73.34-.25.28-.97.95-.97 2.3 0 1.35.99 2.65 1.13 2.83.14.18 1.95 2.98 4.74 4.06.66.28 1.18.45 1.58.58.66.21 1.26.18 1.73.11.53-.08 1.65-.67 1.88-1.32.23-.65.23-1.21.16-1.32-.07-.11-.25-.18-.53-.32z" />
                                                  </svg>
                                                  Notify all
                                                </a>
                                              );
                                            })()}
                                          </>
                                        )}
                                      </td>
                                      <td className="px-4 py-2">
                                        {product.priceHistory && product.priceHistory.length > 0 ? (
                                          <div className="flex flex-col space-y-1">
                                            {product.priceHistory.map((ph, idx) => (
                                              <span key={idx} className="text-xs text-gray-500">
                                                ${ph.previous_price?.toFixed(2)}{" "}
                                                <span className="text-gray-400">
                                                  (
                                                  {ph.last_price_update
                                                    ? new Date(
                                                        ph.last_price_update
                                                      ).toLocaleDateString()
                                                    : "No date"}
                                                  )
                                                </span>
                                              </span>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-xs text-gray-400">No history</span>
                                        )}
                                      </td>
                                    </tr>
                                    {selectedProduct === product.id && (
                                      <tr>
                                        <td className="px-4 py-2 bg-gray-50" colSpan={3}>
                                          <div className="pl-8">
                                            <div className="flex justify-between items-center mb-2">
                                              <h4 className="font-medium text-gray-700">
                                                Customers:
                                              </h4>
                                              {Object.keys(offerPrices).some((key) =>
                                                key.startsWith(`${product.id}-`)
                                              ) && (
                                                <button
                                                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-500 rounded"
                                                  title="Clear all offer prices for this product"
                                                  type="button"
                                                  onClick={() => {
                                                    const keysToClear = Object.keys(
                                                      offerPrices
                                                    ).filter((key) =>
                                                      key.startsWith(`${product.id}-`)
                                                    );
                                                    const newOfferPrices = { ...offerPrices };
                                                    keysToClear.forEach((key) => {
                                                      delete newOfferPrices[key];
                                                    });
                                                    setOfferPrices(newOfferPrices);
                                                  }}
                                                >
                                                  Clear All
                                                </button>
                                              )}
                                            </div>
                                            {product.order_items?.map((oiRaw, idx) => {
                                              const oi = oiRaw as {
                                                order_id: number;
                                                price?: number;
                                                orders?: {
                                                  customer_name: string;
                                                  customer_phone: string;
                                                  customer_id?: string;
                                                }[];
                                              };
                                              return (
                                                Array.isArray(oi.orders)
                                                  ? oi.orders
                                                  : oi.orders
                                                    ? [oi.orders]
                                                    : []
                                              ).map((order, oidx) => {
                                                // Use oi.price as the past price for this customer
                                                return (
                                                  <div
                                                    key={`${product.id}-${order.customer_id}-${oi.order_id}-${oidx}`}
                                                    className="mb-3 p-2 bg-gray-50 rounded"
                                                  >
                                                    <div className="mb-2">
                                                      <span className="font-medium">
                                                        {order.customer_name}
                                                      </span>
                                                      <span className="text-xs text-gray-400 ml-2">
                                                        (ID: {order.customer_id || "N/A"})
                                                      </span>
                                                      {oi.price !== undefined && (
                                                        <span className="text-xs text-gray-500 ml-2">
                                                          Past price: ${oi.price?.toFixed(2)}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                      <input
                                                      min="0"
                                                      placeholder="Offer new price"
                                                      step="0.01"
                                                      type="number"
                                                      value={
                                                        offerPrices[
                                                          `${product.id}-${order.customer_id}-${oi.order_id}-${oidx}`
                                                        ] || ""
                                                      }
                                                      onBlur={(e) => {
                                                        // Validate and clean up on blur
                                                        const key = `${product.id}-${order.customer_id}-${oi.order_id}-${oidx}`;
                                                        const value = e.target.value;
                                                        if (
                                                          value === "" ||
                                                          value === "0" ||
                                                          isNaN(Number(value))
                                                        ) {
                                                          setOfferPrices((prev) => {
                                                            const newState = { ...prev };
                                                            delete newState[key];
                                                            return newState;
                                                          });
                                                        }
                                                      }}
                                                      onChange={(e) => {
                                                        const key = `${product.id}-${order.customer_id}-${oi.order_id}-${oidx}`;
                                                        const value = e.target.value;

                                                        if (
                                                          value === "" ||
                                                          value === null ||
                                                          value === undefined
                                                        ) {
                                                          // Clear the value when input is empty
                                                          setOfferPrices((prev) => {
                                                            const newState = { ...prev };
                                                            delete newState[key];
                                                            return newState;
                                                          });
                                                        } else {
                                                          const numValue = Number(value);
                                                          if (!isNaN(numValue)) {
                                                            setOfferPrices((prev) => ({
                                                              ...prev,
                                                              [key]: numValue,
                                                            }));
                                                          }
                                                        }
                                                      }}
                                                      onFocus={(e) => {
                                                        // Select all text when focused
                                                        e.target.select();
                                                      }}
                                                    />
                                                    {offerPrices[
                                                      `${product.id}-${order.customer_id}-${oi.order_id}-${oidx}`
                                                    ] && (
                                                      <button
                                                        className="px-2 py-1 text-xs text-red-600 hover:text-red-800 border border-red-300 hover:border-red-500 rounded"
                                                        title="Clear offer price"
                                                        type="button"
                                                        onClick={() => {
                                                          const key = `${product.id}-${order.customer_id}-${oi.order_id}-${oidx}`;
                                                          setOfferPrices((prev) => {
                                                            const newState = { ...prev };
                                                            delete newState[key];
                                                            return newState;
                                                          });
                                                        }}
                                                      >
                                                        ✕
                                                      </button>
                                                    )}
                                                    <button
                                                      onClick={async () => {
                                                        if (!order.customer_id) {
                                                          alert("Customer ID not found!");
                                                          return;
                                                        }
                                                        const key = `${product.id}-${order.customer_id}-${oi.order_id}-${oidx}`;
                                                        const currentOfferPrice = offerPrices[key];
                                                        if (!currentOfferPrice) {
                                                          alert("Please enter an offer price");
                                                          return;
                                                        }
                                                        try {
                                                          const { error } = await supabase
                                                            .from("price_offers")
                                                            .insert([
                                                              {
                                                                customer_id: order.customer_id,
                                                                product_id: product.id,
                                                                offered_price: currentOfferPrice,
                                                                status: "pending",
                                                                created_at:
                                                                  new Date().toISOString(),
                                                              },
                                                            ]);

                                                          if (error) {
                                                            alert(
                                                              "Failed to send offer: " +
                                                                error.message
                                                            );
                                                            return;
                                                          }

                                                          // Clear the offer price after sending successfully
                                                          setOfferPrices((prev) => {
                                                            const newState = { ...prev };
                                                            delete newState[key];
                                                            return newState;
                                                          });

                                                          alert(
                                                            `Offer sent successfully to ${order.customer_name} for $${currentOfferPrice}`
                                                          );
                                                        } catch (err) {
                                                          alert(
                                                            "Failed to send offer. Please try again."
                                                          );
                                                        }
                                                      }}
                                                    >
                                                      Send Offer
                                                    </button>
                                                    </div>
                                                  </div>
                                                );
                                              });
                                            })}
                                            {(!product.order_items ||
                                              product.order_items.length === 0) && (
                                              <span className="text-gray-500">
                                                No customers found
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );
      case "inventory":
        return <div>Inventory Management</div>;
      case "history":
        return (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Transaction History</h2>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                onClick={() => fetchOrderDetails(currentPage)}
              >
                Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderDetails.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{order.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order.customer_name}
                            {order.customer_phone ? ` (${order.customer_phone})` : ""}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            ${order.total_amount?.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                order.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : order.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              } ${updatingStatus === order.id ? "opacity-50 cursor-not-allowed" : ""}`}
                              disabled={updatingStatus === order.id}
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            {updatingStatus === order.id && (
                              <span className="ml-2 text-xs text-gray-500">Updating...</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-4">
              <button
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {Math.ceil(totalOrders / pageSize)}
              </span>
              <button
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                disabled={currentPage * pageSize >= totalOrders}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </motion.div>
        );
      case "customers":
        return <CustomerManagement />;
      case "users":
        return renderUsers();
      default:
        return renderOverview();
    }
  };

  // Enhanced function to handle status update
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);

      // Validate status
      if (!["pending", "completed", "cancelled"].includes(newStatus)) {
        throw new Error("Invalid status value");
      }

      // Update status in database
      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(), // Add timestamp for when status was updated
        })
        .eq("id", orderId);

      if (error) throw error;

      // Update local state
      setOrderDetails((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      );
      
      // Update recent orders as well
      setRecentOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === parseInt(orderId) ? { ...order, status: newStatus } : order))
      );

      // Show success message
      alert(`Order status updated to ${newStatus}`);
    } catch (error) {
      alert("Failed to update order status. Please try again.");

      // Refresh the order details to ensure UI is in sync with database
      fetchOrderDetails(currentPage);
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-2 sm:p-4">
        <button
          className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition mb-4"
          onClick={() => router.push("/")}
        >
          ← Back to Homepage
        </button>
      </div>
      {/* Horizontal Top Navigation Bar */}
      <div className="bg-white shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="py-4">
            <h1 className="text-2xl font-bold mb-2">Management Portal</h1>
            {/* Burger menu button for mobile */}
            <button
              aria-label="Open navigation menu"
              className="md:hidden flex items-center px-3 py-2 border rounded text-gray-600 border-gray-400 hover:text-blue-600 hover:border-blue-600 mb-2"
              onClick={() => setIsNavOpen((open) => !open)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
            {/* Mobile vertical menu */}
            {isNavOpen && (
              <nav className="flex flex-col gap-2 md:hidden bg-white rounded shadow p-2 absolute z-50 w-11/12 left-1/2 -translate-x-1/2 mt-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all w-full text-left ${
                      activeSection === section.id
                        ? "bg-blue-100 text-blue-600"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      setActiveSection(section.id);
                      setIsNavOpen(false);
                    }}
                  >
                    {section.icon}
                    <div className="text-left">
                      <span className="block font-medium">{section.title}</span>
                      <span className="text-xs text-gray-500">{section.description}</span>
                    </div>
                  </button>
                ))}
              </nav>
            )}
            {/* Desktop horizontal menu */}
            <nav className="hidden md:flex flex-row flex-wrap gap-2 overflow-x-auto">
              {sections.map((section) => (
                <motion.button
                  key={section.id}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    activeSection === section.id ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.icon}
                  <div className="text-left">
                    <span className="block font-medium">{section.title}</span>
                    <span className="text-xs text-gray-500">{section.description}</span>
                  </div>
                </motion.button>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex-1 p-2 sm:p-4 md:p-8 max-w-7xl mx-auto w-full">{renderContent()}</div>
    </div>
  );
}

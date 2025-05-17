"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
//import PricingManagement from "@/components/PricingManagement";
import Image from "next/image";
import { Bar, Line, Pie } from "react-chartjs-2";
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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import EditUserModal from "@/components/EditUserModal";
import CustomerManagement from "@/components/CustomerManagement";
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
  priceHistory?: {
    previous_price: number;
    last_price_update: string;
  }[];
  order_items?: {
    order_id: number;
    orders?: {
      customer_name: string;
      customer_phone: string;
    }[];
  }[];
}

interface Country {
  id: number;
  country: string;
  is_active: boolean;
  chineseName: string;
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
  const [countries, setCountries] = useState<Country[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const supabase = createClientComponentClient();
  const [expandedCountry, setExpandedCountry] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Number of orders per page
  const [totalOrders, setTotalOrders] = useState(0);
  const [editingCustomer, setEditingCustomer] = useState<{orderItemId: number, price: number} | null>(null);
  const [newCustomerPrice, setNewCustomerPrice] = useState<number | null>(null);
  const [offerPrice, setOfferPrice] = useState<number | null>(null);

  const priceHistoryMap: Record<number, { previous_price: number; last_price_update: string }[]> = {};

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const fetchCountries = async () => {
    setIsLoading(true);
    try {
      const { data: countries, error } = await supabase
        .from('countries')
        .select(`
          id,
          country,
          is_active,
          chineseName,
          products_Country_fkey (
            id,
            Product,
            price,
            order_items (
              order_id,
              price,
              orders (
                customer_name,
                customer_phone
              )
            )
          )
        `)
        .order('country', { ascending: true });
    
      console.log(countries)
    
      if (error) throw error;
      const { data: priceHistories, error: priceHistoryError } = await supabase
        .from('product_price_history')
        .select('product_id, previous_price, original_price, last_price_update')
        .order('last_price_update', { ascending: false });

      if (priceHistoryError) {
        console.error('Failed to fetch price history:', priceHistoryError);
      }

      // Group price histories by product_id
      (priceHistories || []).forEach(ph => {
        if (!priceHistoryMap[ph.product_id]) priceHistoryMap[ph.product_id] = [];
        priceHistoryMap[ph.product_id].push(ph);
      });

      // Attach last 3 previous prices to each product
      setCountries(
        (countries || []).map(country => ({
          ...country,
          products: (country.products_Country_fkey || []).map(product => ({
            ...product,
            priceHistory: (priceHistoryMap[product.id] || []).slice(0, 3)
          })) as (Product & { priceHistory: { previous_price: number; last_price_update: string }[] })[]
        }))
      );
      // Log all products for debugging
      console.log(
        (countries || []).flatMap(country => country.products_Country_fkey || [])
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch countries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchOrderDetails = async (page = 1) => {
    setIsLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Fetch paginated orders
      const { data, error, count } = await supabase
        .from('orders')
        .select('id, created_at, customer_name, customer_phone, total_amount, status', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setOrderDetails(data || []);
      setTotalOrders(count || 0);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'history') {
      fetchOrderDetails(currentPage);
    }
  }, [activeSection, currentPage]);

  const sections: DashboardSection[] = [
    {
      id: "overview",
      title: "Overview",
      description: "Dashboard overview and statistics",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      id: "pricing",
      title: "Product List",
      description: "Manage product prices and discounts",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "countries",
      title: "Countries",
      description: "Manage countries and view products by country",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
      description: "View your transaction history",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "customers",
      title: "Customers",
      description: "Manage your customer relationships",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
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
      description: "Manage system users",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
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

    const inventoryData = {
      labels: ["In Stock", "Low Stock", "Out of Stock"],
      datasets: [
        {
          data: [300, 50, 20],
          backgroundColor: [
            "rgba(75, 192, 192, 0.5)",
            "rgba(255, 206, 86, 0.5)",
            "rgba(255, 99, 132, 0.5)",
          ],
          borderColor: [
            "rgba(75, 192, 192, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(255, 99, 132, 1)",
          ],
        },
      ],
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
            <Bar data={salesData} options={{ responsive: true }} />
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Inventory Status</h3>
            <Pie data={inventoryData} options={{ responsive: true }} />
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
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
                {[
                  {
                    date: "2024-03-15",
                    type: "Order",
                    description: "New order #1234",
                    status: "Pending",
                  },
                  {
                    date: "2024-03-14",
                    type: "Inventory",
                    description: "Stock update: +50 items",
                    status: "Completed",
                  },
                  {
                    date: "2024-03-14",
                    type: "Customer",
                    description: "New customer registration",
                    status: "Completed",
                  },
                  {
                    date: "2024-03-13",
                    type: "Supplier",
                    description: "Payment processed",
                    status: "Completed",
                  },
                ].map((activity, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activity.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activity.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activity.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          activity.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {activity.status}
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">User Management</h2>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
                          <img
                            className="h-8 w-8 rounded-full"
                            src={user.avatar_url}
                            alt=""
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.email}
                            </div>
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
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditModalOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            console.log("Delete user:", user);
                          }}
                          className="text-red-600 hover:text-red-900"
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
          user={selectedUser}
          isOpen={isEditModalOpen}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Product Lists</h2>
            </div>
            <div>
              {error && <div style={{ color: 'red' }}>{error}</div>}
              {countries.length === 0 && !error && (
                <div>No countries found.</div>
              )}
              <div className="space-y-6">
                {countries.map((country) => (
                  <div
                    key={country.id}
                    className="bg-white rounded-lg shadow p-4 mb-4"
                  >
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => setExpandedCountry(expandedCountry === country.id ? null : country.id)}
                    >
                      <div>
                        <span className="text-lg font-bold">{country.country}</span>
                        <span className="ml-2 text-gray-500">{country.chineseName}</span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          country.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {country.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {expandedCountry === country.id && (
                      <div className="mt-4">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Previous Prices</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {country.products.map((product) => (
                              <React.Fragment key={product.id}>
                                <tr>
                                  <td className="px-4 py-2">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => setSelectedProduct(selectedProduct === product.id ? null : product.id)}
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        {selectedProduct === product.id ? '▼' : '▶'} {product.Product}
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 flex items-center space-x-2">
                                    {editingProductId === product.id ? (
                                      <>
                                        <input
                                          type="number"
                                          value={editingPrice ?? product.price}
                                          onChange={e => setEditingPrice(Number(e.target.value))}
                                          className="border rounded px-2 py-1 w-20"
                                        />
                                        <button
                                          className="text-green-600 font-bold"
                                          onClick={async () => {
                                            if (editingPrice === null || isNaN(editingPrice)) {
                                              alert("Please enter a valid price.");
                                              return;
                                            }
                                            setIsLoading(true);

                                            const { data: orderItems, error: orderItemsError } = await supabase
                                              .from('order_items')
                                              .select('order_id, orders(customer_id)')
                                              .eq('product_id', product.id);

                                            if (orderItemsError) {
                                              alert("Failed to fetch order items: " + orderItemsError.message);
                                              setIsLoading(false);
                                              return;
                                            }

                                            console.log("orderItems", orderItems);

                                            const uniqueCustomerIds = [
                                              ...new Set(
                                                (orderItems || [])
                                                  .map(oi => {
                                                    const orders = oi.orders as { customer_id?: string } | { customer_id?: string }[] | undefined;
                                                    if (!orders) return null;
                                                    if (Array.isArray(orders)) {
                                                      return orders[0]?.customer_id ?? null;
                                                    }
                                                    return orders.customer_id ?? null;
                                                  })
                                                  .filter(cid => !!cid)
                                              ),
                                            ];

                                            if (uniqueCustomerIds.length === 0) {
                                              await supabase.from('product_price_history').insert([
                                                {
                                                  product_id: product.id,
                                                  previous_price: product.price,
                                                  original_price: editingPrice,
                                                  last_price_update: new Date().toISOString(),
                                                  customer_id: null,
                                                }
                                              ]);
                                            } else {
                                              for (const customerId of uniqueCustomerIds) {
                                                const { error: insertError } = await supabase.from('product_price_history').insert([
                                                  {
                                                    product_id: product.id,
                                                    previous_price: product.price,
                                                    original_price: editingPrice,
                                                    last_price_update: new Date().toISOString(),
                                                    customer_id: customerId,
                                                  }
                                                ]);
                                                if (insertError) {
                                                  alert("Failed to insert price history: " + insertError.message);
                                                }
                                              }
                                            }

                                            // Now update the product price
                                            const { error: updateError } = await supabase
                                              .from('products')
                                              .update({ price: editingPrice })
                                              .eq('id', product.id);

                                            if (updateError) {
                                              alert("Failed to update product price: " + updateError.message);
                                              setIsLoading(false);
                                              return;
                                            }

                                            setEditingProductId(null);
                                            setEditingPrice(null);
                                            setIsLoading(false);
                                            fetchCountries();
                                          }}
                                          title="Save"
                                        >
                                          ✔
                                        </button>
                                        <button
                                          className="text-gray-400 font-bold"
                                          onClick={() => {
                                            setEditingProductId(null);
                                            setEditingPrice(null);
                                          }}
                                          title="Cancel"
                                        >
                                          ✖
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <span>${product.price.toFixed(2)}</span>
                                        <button
                                          className="ml-2 text-blue-600 underline"
                                          onClick={() => {
                                            setEditingProductId(product.id);
                                            setEditingPrice(product.price);
                                          }}
                                          title="Edit Price"
                                        >
                                          Edit
                                        </button>
                                        {(() => {
                                          // Find all customers for this product
                                          const allCustomers = product.order_items
                                            ?.flatMap(oiRaw => {
                                              const oi = oiRaw as { price?: number; orders?: { customer_name: string; customer_phone: string }[] };
                                              return Array.isArray(oi.orders) ? oi.orders : oi.orders ? [oi.orders] : [];
                                            })
                                            .filter(order => order.customer_phone);
                                          const hasCustomers = allCustomers && allCustomers.length > 0;
                                          const waText = hasCustomers
                                            ? allCustomers
                                                .map(
                                                  order =>
                                                    `Hi ${order.customer_name}, the price for ${product.Product} has changed. Please check the latest update!`
                                                )
                                                .join("%0A")
                                            : '';
                                          return (
                                            <a
                                              href={hasCustomers ? `https://wa.me/?text=${waText}` : undefined}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className={`inline-flex items-center px-2 py-1 ${
                                                hasCustomers
                                                  ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                                                  : 'bg-gray-400 cursor-not-allowed opacity-60'
                                              } text-white rounded transition ml-2`}
                                              title={hasCustomers ? 'Notify all customers via WhatsApp' : 'No customer to notify'}
                                              tabIndex={hasCustomers ? 0 : -1}
                                              aria-disabled={!hasCustomers}
                                            >
                                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M20.52 3.48A12.07 12.07 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.18-1.62A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22c-1.85 0-3.68-.5-5.26-1.44l-.38-.22-3.67.96.98-3.58-.25-.37A9.94 9.94 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.2-7.8c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.34-.01-.52-.01-.18 0-.48.07-.73.34-.25.28-.97.95-.97 2.3 0 1.35.99 2.65 1.13 2.83.14.18 1.95 2.98 4.74 4.06.66.28 1.18.45 1.58.58.66.21 1.26.18 1.73.11.53-.08 1.65-.67 1.88-1.32.23-.65.23-1.21.16-1.32-.07-.11-.25-.18-.53-.32z"/>
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
                                              ({ph.last_price_update ? new Date(ph.last_price_update).toLocaleDateString() : "No date"})
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
                                    <td colSpan={3} className="px-4 py-2 bg-gray-50">
                                      <div className="pl-8">
                                        <h4 className="font-medium text-gray-700 mb-2">Customers:</h4>
                                        {product.order_items?.map((oiRaw, idx) => {
                                          const oi = oiRaw as { order_id: number; price?: number; orders?: { customer_name: string; customer_phone: string; customer_id?: string }[] };
                                          return (Array.isArray(oi.orders) ? oi.orders : oi.orders ? [oi.orders] : []).map((order, oidx) => {
                                            // Use oi.price as the past price for this customer
                                            return (
                                              <div key={oidx} className="flex items-center space-x-2 mb-1">
                                                <span>{order.customer_name}</span>
                                                {oi.price !== undefined && (
                                                  <span className="text-xs text-gray-500">
                                                    Past price: ${oi.price?.toFixed(2)}
                                                  </span>
                                                )}
                                                <input
                                                  type="number"
                                                  value={offerPrice ?? ''}
                                                  onChange={e => setOfferPrice(Number(e.target.value))}
                                                  placeholder="Offer new price"
                                                />
                                                <button
                                                  onClick={async () => {
                                                    if (!order.customer_id) {
                                                      alert('Customer ID not found!');
                                                      return;
                                                    }
                                                    await supabase.from('price_offers').insert([
                                                      {
                                                        customer_id: order.customer_id,
                                                        product_id: product.id,
                                                        offered_price: offerPrice,
                                                        status: 'pending',
                                                        created_at: new Date().toISOString(),
                                                      }
                                                    ]);
                                                  }}
                                                >
                                                  Send Offer
                                                </button>
                                              </div>
                                            );
                                          });
                                        })}
                                        {(!product.order_items || product.order_items.length === 0) && (
                                          <span className="text-gray-500">No customers found</span>
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
            </div>
          </motion.div>
        );
      case "inventory":
        return <div>Inventory Management</div>;
      case "history":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Transaction History</h2>
              <button
                onClick={() => fetchOrderDetails(currentPage)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order.customer_name}
                            {order.customer_phone ? ` (${order.customer_phone})` : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            ${order.total_amount?.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                order.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : order.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {order.status}
                            </span>
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
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {Math.ceil(totalOrders / pageSize)}
              </span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage * pageSize >= totalOrders}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </motion.div>
        );
      case "customers":
        return <CustomerManagement />;
      case "suppliers":
        return <div>Supplier Management</div>;
      case "users":
        return renderUsers();
      case "countries":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Countries Management</h2>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chinese Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {countries.map((country) => (
                      <tr key={country.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{country.country}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{country.chineseName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            country.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {country.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition mb-4"
        >
          ← Back to Homepage
        </button>
      </div>
      <div className="flex">
        <motion.div
          initial={false}
          animate={{ width: sidebarOpen ? "auto" : "0px" }}
          className={`${isMobile ? "fixed z-50" : ""} bg-white h-screen shadow-lg`}
        >
          <div className="w-64">
            <div className="p-4 border-b flex items-center justify-between">
              <h1 className="text-xl font-bold">Management Portal</h1>
              {isMobile && (
                <button onClick={() => setSidebarOpen(false)} className="p-2">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            <nav className="p-4">
              {sections.map((section) => (
                <motion.button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                    activeSection === section.id
                      ? "bg-blue-100 text-blue-600"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {section.icon}
                  <div className="text-left">
                    <span className="block font-medium">{section.title}</span>
                    <span className="text-xs text-gray-500">
                      {section.description}
                    </span>
                  </div>
                </motion.button>
              ))}
            </nav>
          </div>
        </motion.div>

        <div className="flex-1">
          {isMobile && (
            <div className="p-4 bg-white shadow-sm flex items-center">
              <button onClick={() => setSidebarOpen(true)} className="p-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 className="ml-4 text-xl font-bold">
                {sections.find((s) => s.id === activeSection)?.title}
              </h1>
            </div>
          )}

          <motion.div
            layout
            className="p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

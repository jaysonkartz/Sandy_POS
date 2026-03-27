"use client";

import React from "react";
import { motion } from "framer-motion";
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

export type OverviewTabProps = {
  dashboardStats: {
    totalProducts: number;
    totalSales: number;
    activeCustomers: number;
    pendingOrders: number;
  };
  salesChartData: { labels: string[]; sales: number[] };
  isLoadingSalesChart: boolean;
  selectedMonthQuantity: string;
  setSelectedMonthQuantity: React.Dispatch<React.SetStateAction<string>>;
  selectedMonthPrice: string;
  setSelectedMonthPrice: React.Dispatch<React.SetStateAction<string>>;
  availableMonths: string[];
  topSellingProductsByQuantity: Array<{
    category: string;
    product: string;
    variation: string;
    quantity: number;
  }>;
  topSellingProductsByPrice: Array<{
    product: string;
    variation: string;
    value: number;
  }>;
  isLoadingTopProducts: boolean;
  fetchTopSellingProducts: (month?: string, type?: string) => Promise<void>;
  recentOrders: Array<{
    id: number;
    created_at: string;
    customer_name: string;
    customer_phone: string;
    total_amount: number;
    status: string;
  }>;
  isLoadingRecentOrders: boolean;
};

export default function OverviewTab(props: OverviewTabProps) {
  const {
    dashboardStats,
    salesChartData,
    isLoadingSalesChart,
    selectedMonthQuantity,
    setSelectedMonthQuantity,
    selectedMonthPrice,
    setSelectedMonthPrice,
    availableMonths,
    topSellingProductsByQuantity,
    topSellingProductsByPrice,
    isLoadingTopProducts,
    fetchTopSellingProducts,
    recentOrders,
    isLoadingRecentOrders,
  } = props;

  const salesData = {
    labels: salesChartData.labels.length > 0 ? salesChartData.labels : ["No data available"],
    datasets: [
      {
        label: "Total Sales",
        data: salesChartData.sales.length > 0 ? salesChartData.sales : [0],
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            title: "Total Products",
            value: dashboardStats.totalProducts.toLocaleString(),
            change: "",
          },
          {
            title: "Total Sales",
            value: `$${dashboardStats.totalSales.toLocaleString()}`,
            change: "",
          },
          {
            title: "Active Customers",
            value: dashboardStats.activeCustomers.toLocaleString(),
            change: "",
          },
          {
            title: "Pending Orders",
            value: dashboardStats.pendingOrders.toLocaleString(),
            change: "",
          },
        ].map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-gray-500 text-sm">{stat.title}</h3>
            <p className="text-2xl font-bold">{stat.value}</p>
            {stat.change && (
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
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Sales Overview - Total Sales by Month</h3>
          {isLoadingSalesChart ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading sales data...</div>
            </div>
          ) : salesChartData.labels.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">No sales data available</div>
            </div>
          ) : (
            <Bar
              data={salesData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    display: true,
                    position: "top" as const,
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context: { parsed: { y: number | null } }) {
                        const value = context.parsed.y;
                        return `Sales: $${value !== null ? value.toFixed(2) : "0.00"}`;
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function (value: number | string) {
                        if (typeof value === "number") {
                          return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                        return value;
                      },
                    },
                    title: {
                      display: true,
                      text: "Total Sales ($)",
                    },
                  },
                  x: {
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45,
                    },
                    title: {
                      display: true,
                      text: "Month",
                    },
                  },
                },
              }}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Top Selling Products (by Qty)</h3>
            <select
              className="px-3 py-1 pr-8 bg-blue-100 text-blue-600 rounded text-sm font-medium border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-no-repeat bg-right bg-[length:16px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzM3NDE1MSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')]"
              value={selectedMonthQuantity}
              onChange={(e) => {
                setSelectedMonthQuantity(e.target.value);
                fetchTopSellingProducts(e.target.value, "quantity");
              }}
            >
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
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
                {isLoadingTopProducts ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={4}>
                      Loading top selling products...
                    </td>
                  </tr>
                ) : topSellingProductsByQuantity.length > 0 ? (
                  topSellingProductsByQuantity.map((product, index) => (
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
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={4}>
                      No sales data available for {selectedMonthQuantity}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Top Selling Products (by Price)</h3>
            <select
              className="px-3 py-1 pr-8 bg-blue-100 text-blue-600 rounded text-sm font-medium border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-no-repeat bg-right bg-[length:16px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzM3NDE1MSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')]"
              value={selectedMonthPrice}
              onChange={(e) => {
                setSelectedMonthPrice(e.target.value);
                fetchTopSellingProducts(e.target.value, "price");
              }}
            >
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
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
                {isLoadingTopProducts ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={3}>
                      Loading top selling products...
                    </td>
                  </tr>
                ) : topSellingProductsByPrice.length > 0 ? (
                  topSellingProductsByPrice.map((product, index) => (
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
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={3}>
                      No sales data available for {selectedMonthPrice}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
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
              {isLoadingRecentOrders ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={4}>
                    Loading recent orders...
                  </td>
                </tr>
              ) : recentOrders.length > 0 ? (
                recentOrders.map((order, index) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.customer_name} - $
                      {order.total_amount ? order.total_amount.toFixed(2) : "0.00"}
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
                ))
              ) : (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={4}>
                    No recent orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

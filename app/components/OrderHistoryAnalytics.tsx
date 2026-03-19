"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useMemo } from "react";
import { Doughnut, Line } from "react-chartjs-2";

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

type OrderSummary = {
  created_at: string;
  status: string;
  total_amount: number;
};

interface OrderHistoryAnalyticsProps {
  orders: OrderSummary[];
}

export default function OrderHistoryAnalytics({ orders }: OrderHistoryAnalyticsProps) {
  const { sortedMonthlyData, statusData, totalSpent } = useMemo(() => {
    const monthlyData = orders.reduce(
      (acc: Record<string, number>, order) => {
        const month = new Date(order.created_at).toLocaleString("default", { month: "short" });
        acc[month] = (acc[month] || 0) + Number(order.total_amount || 0);
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

    const sorted = monthOrder.reduce(
      (acc: Record<string, number>, month: string) => {
        if (monthlyData[month]) acc[month] = monthlyData[month];
        return acc;
      },
      {} as Record<string, number>
    );

    const status = orders.reduce(
      (acc: Record<string, number>, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const total = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

    return {
      sortedMonthlyData: sorted,
      statusData: status,
      totalSpent: total,
    };
  }, [orders]);

  const averageOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;

  return (
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
          <p className="text-2xl font-bold text-gray-900">${totalSpent.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h3 className="text-sm font-medium text-gray-500">Average Order Value</h3>
          <p className="text-2xl font-bold text-gray-900">${averageOrderValue.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

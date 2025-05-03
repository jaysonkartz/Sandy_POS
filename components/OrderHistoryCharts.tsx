"use client";
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
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

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

interface Order {
  created_at: string;
  total_amount: number;
  status: string;
  // Add other fields as needed
}

interface OrderHistoryChartsProps {
  orders: Order[];
}

export default function OrderHistoryCharts({ orders }: OrderHistoryChartsProps) {
  // Process data for monthly sales
  const monthlySales = orders.reduce((acc: { [key: string]: number }, order) => {
    const month = new Date(order.created_at).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + order.total_amount;
    return acc;
  }, {});

  // Process data for order status
  const orderStatus = orders.reduce((acc: { [key: string]: number }, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  // Monthly Sales Line Chart
  const salesData = {
    labels: Object.keys(monthlySales),
    datasets: [
      {
        label: 'Monthly Sales',
        data: Object.values(monthlySales),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  // Order Status Pie Chart
  const statusData = {
    labels: Object.keys(orderStatus),
    datasets: [
      {
        data: Object.values(orderStatus),
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)',
        ],
      },
    ],
  };

  // Daily Orders Bar Chart
  const dailyOrders = orders.reduce((acc: { [key: string]: number }, order) => {
    const date = new Date(order.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const ordersData = {
    labels: Object.keys(dailyOrders),
    datasets: [
      {
        label: 'Daily Orders',
        data: Object.values(dailyOrders),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Sales Line Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Sales</h3>
          <Line
            data={salesData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
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

        {/* Order Status Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status Distribution</h3>
          <Pie
            data={statusData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
            }}
          />
        </div>

        {/* Daily Orders Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Orders</h3>
          <Bar
            data={ordersData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Orders</h3>
          <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Sales</h3>
          <p className="text-3xl font-bold text-green-600">
            ${orders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Average Order Value</h3>
          <p className="text-3xl font-bold text-purple-600">
            ${(orders.reduce((sum, order) => sum + order.total_amount, 0) / orders.length).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
} 
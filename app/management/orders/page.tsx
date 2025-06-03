import OrderHistoryCharts from "@/components/OrderHistoryCharts";

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  total_amount: number;
  status: "completed" | "pending" | "cancelled";
  customer_email: string;
}

export default function OrderHistoryPage() {
  // Fetch your orders data here
  const orders: Order[] = [
    // Your orders data
  ];

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Order History</h1>

        <div className="mt-6">
          <OrderHistoryCharts orders={orders} />
        </div>

        {/* Your existing order table or other components */}
      </div>
    </div>
  );
}

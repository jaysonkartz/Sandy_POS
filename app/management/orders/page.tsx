import OrderHistoryCharts from '@/components/OrderHistoryCharts';

export default function OrderHistoryPage() {
  // Fetch your orders data here
  const orders = [
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
"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { OrderDetail, OrderItemRow } from "../../types";

export type HistoryTabProps = {
  isLoading: boolean;
  orderDetails: OrderDetail[];
  orderItems: Record<string, OrderItemRow[]>;
  updatingStatus: string | null;
  handleStatusChange: (orderId: string, newStatus: string) => Promise<void>;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalOrders: number;
  pageSize: number;
};

export default function HistoryTab(props: HistoryTabProps) {
  const {
    isLoading,
    orderDetails,
    orderItems,
    updatingStatus,
    handleStatusChange,
    currentPage,
    setCurrentPage,
    totalOrders,
    pageSize,
  } = props;

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    setExpandedOrderId(null);
  }, [currentPage]);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Transaction History</h2>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
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
                {orderDetails.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const items = orderItems[order.id] || [];
                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            className="text-gray-500 hover:text-gray-700 focus:outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedOrderId(isExpanded ? null : order.id);
                            }}
                          >
                            <svg
                              className={`w-5 h-5 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M19 9l-7 7-7-7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                              />
                            </svg>
                          </button>
                        </td>
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
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
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
                      {isExpanded && (
                        <tr>
                          <td className="px-6 py-4 bg-gray-50" colSpan={6}>
                            <div className="mt-2">
                              <div className="mb-4 pb-3 border-b border-gray-200">
                                <div className="flex items-center space-x-4">
                                  <div>
                                    <span className="text-xs font-medium text-gray-500 uppercase">
                                      Purchase Date:
                                    </span>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">
                                      {new Date(order.created_at).toLocaleString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                Order Items
                              </h4>
                              {items.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                          Product Name
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                          Product Code
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                          Quantity
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                          Unit Price
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                          Total Price
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                          <td className="px-4 py-2 text-sm text-gray-900">
                                            {item.product_name}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-600">
                                            {item.product_code || "N/A"}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-600">
                                            {item.quantity}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-600">
                                            ${item.price.toFixed(2)}
                                          </td>
                                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                            ${item.total_price.toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="bg-gray-100">
                                      <tr>
                                        <td
                                          className="px-4 py-2 text-sm font-semibold text-gray-700 text-right"
                                          colSpan={4}
                                        >
                                          Order Total:
                                        </td>
                                        <td className="px-4 py-2 text-sm font-bold text-gray-900">
                                          ${order.total_amount.toFixed(2)}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">
                                  No items found for this order.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && orderDetails.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <button
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage >= Math.ceil(totalOrders / pageSize)}
              onClick={() =>
                setCurrentPage((prev) => Math.min(Math.ceil(totalOrders / pageSize), prev + 1))
              }
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-medium">{Math.min(currentPage * pageSize, totalOrders)}</span>{" "}
                of <span className="font-medium">{totalOrders}</span> results
              </p>
            </div>
            <div>
              <nav
                aria-label="Pagination"
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              >
                <button
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      clipRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      fillRule="evenodd"
                    />
                  </svg>
                </button>
                {Array.from({ length: Math.ceil(totalOrders / pageSize) }, (_, i) => i + 1)
                  .filter((page) => {
                    const totalPages = Math.ceil(totalOrders / pageSize);
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                    return false;
                  })
                  .map((page, index, array) => {
                    const totalPages = Math.ceil(totalOrders / pageSize);
                    const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                    const showEllipsisAfter =
                      index < array.length - 1 && array[index + 1] !== page + 1;

                    return (
                      <div key={page} className="flex items-center">
                        {showEllipsisBefore && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        )}
                        <button
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                        {showEllipsisAfter && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        )}
                      </div>
                    );
                  })}
                <button
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage >= Math.ceil(totalOrders / pageSize)}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(Math.ceil(totalOrders / pageSize), prev + 1))
                  }
                >
                  <span className="sr-only">Next</span>
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      clipRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      fillRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

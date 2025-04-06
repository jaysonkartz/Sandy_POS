"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  lastUpdated: string;
}

// Sample data
const sampleProducts: Product[] = [
  {
    id: 1,
    name: "Premium Dried Chilli",
    category: "Dried Chilli",
    price: 15.99,
    stock: 150,
    status: "In Stock",
    lastUpdated: "2024-03-15",
  },
  {
    id: 2,
    name: "Organic Black Beans",
    category: "Beans & Legumes",
    price: 8.99,
    stock: 75,
    status: "In Stock",
    lastUpdated: "2024-03-14",
  },
  {
    id: 3,
    name: "Raw Cashews",
    category: "Nuts & Seeds",
    price: 24.99,
    stock: 5,
    status: "Low Stock",
    lastUpdated: "2024-03-13",
  },
  {
    id: 4,
    name: "Ground Cinnamon",
    category: "Herbs and Spices",
    price: 12.99,
    stock: 0,
    status: "Out of Stock",
    lastUpdated: "2024-03-12",
  },
];

export default function ProductListTable() {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [products] = useState<Product[]>(sampleProducts);

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <>
                <tr
                  key={product.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleRow(product.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {product.name.charAt(0)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.category}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${product.price.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.stock}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        product.status === "In Stock"
                          ? "bg-green-100 text-green-800"
                          : product.status === "Low Stock"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.lastUpdated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(product.id);
                      }}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      {expandedRow === product.id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                </tr>
                <AnimatePresence>
                  {expandedRow === product.id && (
                    <motion.tr
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="bg-gray-50"
                    >
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Product Details
                            </h4>
                            <div className="space-y-2 text-sm text-gray-600">
                              <p>
                                <span className="font-medium">SKU:</span> PRD-
                                {product.id.toString().padStart(4, "0")}
                              </p>
                              <p>
                                <span className="font-medium">Supplier:</span>{" "}
                                Global Spices Inc.
                              </p>
                              <p>
                                <span className="font-medium">
                                  Minimum Stock:
                                </span>{" "}
                                10 units
                              </p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Pricing History
                            </h4>
                            <div className="space-y-2 text-sm text-gray-600">
                              <p>
                                <span className="font-medium">
                                  Original Price:
                                </span>{" "}
                                ${(product.price * 1.2).toFixed(2)}
                              </p>
                              <p>
                                <span className="font-medium">Discount:</span>{" "}
                                20%
                              </p>
                              <p>
                                <span className="font-medium">
                                  Last Price Update:
                                </span>{" "}
                                2024-03-01
                              </p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Customer Pricing
                            </h4>
                            <div className="space-y-2 text-sm text-gray-600">
                              <p>
                                <span className="font-medium">Customer A:</span>{" "}
                                ${(product.price * 0.9).toFixed(2)}
                              </p>
                              <p>
                                <span className="font-medium">Customer B:</span>{" "}
                                ${(product.price * 0.95).toFixed(2)}
                              </p>
                              <p>
                                <span className="font-medium">Customer C:</span>{" "}
                                ${(product.price * 0.85).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Stock History
                            </h4>
                            <div className="space-y-2 text-sm text-gray-600">
                              <p>
                                <span className="font-medium">
                                  Last Restock:
                                </span>{" "}
                                2024-03-10
                              </p>
                              <p>
                                <span className="font-medium">
                                  Restock Quantity:
                                </span>{" "}
                                50 units
                              </p>
                              <p>
                                <span className="font-medium">
                                  Next Restock:
                                </span>{" "}
                                2024-03-25
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

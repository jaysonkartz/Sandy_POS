"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import React from "react";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  lastUpdated: string;
}

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
              {["Product", "Category", "Price", "Stock", "Status", "Last Updated", "Actions"].map(
                (header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <React.Fragment key={product.id}>
                <tr
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
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{product.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{product.stock}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                  <td className="px-6 py-4 text-sm text-gray-500">{product.lastUpdated}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <button
                      className="text-gray-400 hover:text-gray-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(product.id);
                      }}
                    >
                      {expandedRow === product.id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                </tr>
                {expandedRow === product.id && (
                  <motion.tr
                    animate={{ height: "auto", opacity: 1 }}
                    className="bg-gray-50"
                    exit={{ height: 0, opacity: 0 }}
                    initial={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <td className="px-6 py-4" colSpan={7}>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <h4 className="text-gray-900 font-medium mb-2">Product Details</h4>
                          <p>
                            <span className="font-medium">SKU:</span> PRD-
                            {product.id.toString().padStart(4, "0")}
                          </p>
                          <p>
                            <span className="font-medium">Supplier:</span> Global Spices Inc.
                          </p>
                          <p>
                            <span className="font-medium">Minimum Stock:</span> 10 units
                          </p>
                        </div>
                        <div>
                          <h4 className="text-gray-900 font-medium mb-2">Pricing History</h4>
                          <p>
                            <span className="font-medium">Original Price:</span> $
                            {(product.price * 1.2).toFixed(2)}
                          </p>
                          <p>
                            <span className="font-medium">Discount:</span> 20%
                          </p>
                          <p>
                            <span className="font-medium">Last Price Update:</span> 2024-03-01
                          </p>
                        </div>
                        <div>
                          <h4 className="text-gray-900 font-medium mb-2">Customer Pricing</h4>
                          <p>
                            <span className="font-medium">Customer A:</span> $
                            {(product.price * 0.9).toFixed(2)}
                          </p>
                          <p>
                            <span className="font-medium">Customer B:</span> $
                            {(product.price * 0.95).toFixed(2)}
                          </p>
                          <p>
                            <span className="font-medium">Customer C:</span> $
                            {(product.price * 0.85).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-gray-900 font-medium mb-2">Stock History</h4>
                          <p>
                            <span className="font-medium">Last Restock:</span> 2024-03-10
                          </p>
                          <p>
                            <span className="font-medium">Restock Quantity:</span> 50 units
                          </p>
                          <p>
                            <span className="font-medium">Next Restock:</span> 2024-03-25
                          </p>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

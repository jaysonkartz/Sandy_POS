"use client";

import { useState, Fragment, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface Product {
  id: number;
  Item_Code: string;
  Category: string;
  Weight: string;
  UOM: string;
  country_of_price: string;
  stock_quantity: number;
  Product_C: string;
  Country: string;
  created_at: string;
  updated_at: string;
}

export default function ProductListTable() {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id');

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock: number): "In Stock" | "Low Stock" | "Out of Stock" => {
    if (stock <= 0) return "Out of Stock";
    if (stock <= 10) return "Low Stock";
    return "In Stock";
  };

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Weight/UOM
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Country
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <Fragment key={product.id}>
                <tr
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleRow(product.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {product.Item_Code ? product.Item_Code.charAt(0) : '-'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.Item_Code || 'No Code'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.Category}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.Weight} / {product.UOM}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.stock_quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.Country}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        getStockStatus(product.stock_quantity) === "In Stock"
                          ? "bg-green-100 text-green-800"
                          : getStockStatus(product.stock_quantity) === "Low Stock"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {getStockStatus(product.stock_quantity)}
                    </span>
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
                                <span className="font-medium">Product Code:</span>{" "}
                                {product.Product_C}
                              </p>
                              <p>
                                <span className="font-medium">Category:</span>{" "}
                                {product.Category}
                              </p>
                              <p>
                                <span className="font-medium">Country of Origin:</span>{" "}
                                {product.Country}
                              </p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Stock Information
                            </h4>
                            <div className="space-y-2 text-sm text-gray-600">
                              <p>
                                <span className="font-medium">Current Stock:</span>{" "}
                                {product.stock_quantity} {product.UOM}
                              </p>
                              <p>
                                <span className="font-medium">Last Updated:</span>{" "}
                                {new Date(product.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

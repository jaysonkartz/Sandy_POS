"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import React from "react";

interface Product {
  Product: string;
  Product_CH: string;
  Variation: string;
  Variation_CH: string;
  weight: string;
  UOM: string;
  Country: string;
  Country_CH: string;
  availability: boolean;
  max_quantity: number;
  Weight_KG: string;
}

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: productsData, error } = await supabase
        .from("products")
        .select("*")
        .order("Product");

      if (error) throw error;
      setProducts(productsData || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setExpandedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
    setTimeout(() => setIsAnimating(false), 300);
  };

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.Product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.Product_CH.includes(searchTerm) ||
        product.Country.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesActive = filterActive === null || product.availability === filterActive;
      return matchesSearch && matchesActive;
    })
    .sort((a, b) => a.Product.trim().toLowerCase().localeCompare(b.Product.trim().toLowerCase()));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Product List</h1>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="relative">
            <input
              className="w-full sm:w-64 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="Search products..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute right-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <select
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            value={filterActive === null ? "all" : filterActive.toString()}
            onChange={(e) =>
              setFilterActive(e.target.value === "all" ? null : e.target.value === "true")
            }
          >
            <option value="all">All Status</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                  Product
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                  Chinese Product Name
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                  Variation
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                  Weight/UOM
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product, index) => (
                <React.Fragment key={product.Product}>
                  <motion.tr
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 cursor-pointer"
                    initial={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => toggleProduct(product.Product)}
                  >
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap w-1/5">
                      <div className="flex items-center">
                        <svg
                          className={`w-4 h-4 sm:w-5 sm:h-5 transform transition-transform ${
                            expandedProducts.has(product.Product) ? "rotate-180" : ""
                          } mr-2`}
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
                        <div className="text-sm font-medium text-gray-900 truncate">{product.Product}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap w-1/5">
                      <div className="text-sm text-gray-500 truncate">{product.Product_CH}</div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap w-1/5">
                      {product.Variation ? (
                        <div>
                          <div className="text-sm text-gray-900 truncate">{product.Variation}</div>
                          <div className="text-sm text-gray-500 truncate">{product.Variation_CH}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap w-1/5">
                      <div className="text-sm text-gray-900">
                        {product.weight} {product.UOM}
                      </div>
                      {product.Weight_KG && (
                        <div className="text-sm text-gray-500">({product.Weight_KG} KG)</div>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap w-1/5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.availability
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.availability ? "Available" : "Unavailable"}
                      </span>
                    </td>
                  </motion.tr>
                  {expandedProducts.has(product.Product) && (
                    <motion.tr
                      animate={{ opacity: 1, height: "auto" }}
                      className="bg-gray-50"
                      exit={{ opacity: 0, height: 0 }}
                      initial={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <td className="px-3 sm:px-4 py-4" colSpan={5}>
                        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">
                                Product Information
                              </h4>
                              <dl className="space-y-1">
                                <div className="flex justify-between">
                                  <dt className="text-sm text-gray-500">Product Code:</dt>
                                  <dd className="text-sm text-gray-900 truncate">{product.Product}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-sm text-gray-500">Chinese Name:</dt>
                                  <dd className="text-sm text-gray-900 truncate">{product.Product_CH}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-sm text-gray-500">Category:</dt>
                                  <dd className="text-sm text-gray-900">-</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-sm text-gray-500">Status:</dt>
                                  <dd className="text-sm text-gray-900">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                        product.availability
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {product.availability ? "Available" : "Unavailable"}
                                    </span>
                                  </dd>
                                </div>
                              </dl>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">
                                Specifications
                              </h4>
                              <dl className="space-y-1">
                                <div className="flex justify-between">
                                  <dt className="text-sm text-gray-500">Weight:</dt>
                                  <dd className="text-sm text-gray-900">
                                    {product.weight} {product.UOM}
                                  </dd>
                                </div>
                                {product.Weight_KG && (
                                  <div className="flex justify-between">
                                    <dt className="text-sm text-gray-500">Weight (KG):</dt>
                                    <dd className="text-sm text-gray-900">{product.Weight_KG}</dd>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <dt className="text-sm text-gray-500">Max Quantity:</dt>
                                  <dd className="text-sm text-gray-900">
                                    {product.max_quantity || "-"}
                                  </dd>
                                </div>
                              </dl>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Variations</h4>
                              <dl className="space-y-1">
                                <div className="flex justify-between">
                                  <dt className="text-sm text-gray-500">Variation:</dt>
                                  <dd className="text-sm text-gray-900">
                                    {product.Variation || "-"}
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-sm text-gray-500">Chinese Variation:</dt>
                                  <dd className="text-sm text-gray-900">
                                    {product.Variation_CH || "-"}
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-sm text-gray-500">Origin:</dt>
                                  <dd className="text-sm text-gray-900">{product.Country}</dd>
                                </div>
                              </dl>
                            </div>
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
    </div>
  );
}

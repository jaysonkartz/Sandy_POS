"use client";

import { useState, Fragment, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Check, X, Plus } from "lucide-react";
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
  Product?: string;
  price?: number;
}

interface AddProductFormData {
  item_code: string;
  Category: string;
  Weight: string;
  uom: string;
  Country: string;
  stock_quantity: number;
  Product: string;
  price: number;
}

export default function ProductListTable() {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState<AddProductFormData>({
    item_code: "",
    Category: "",
    Weight: "",
    uom: "",
    Country: "",
    stock_quantity: 0,
    Product: "",
    price: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Handle numeric fields
    if (name === 'stock_quantity' || name === 'price') {
      processedValue = parseFloat(value) || 0;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([formData])
        .select();

      if (error) throw error;

      // Refresh the products list
      fetchProducts();
      
      // Reset form and close modal
      setFormData({
        item_code: "",
        Product: "",
        Category: "",
        Weight: "",
        uom: "",
        Country: "",
        stock_quantity: 0,
        price: 0,
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = 
        product.Item_Code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.Product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.Category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = 
        !categoryFilter || 
        product.Category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(products.map(product => product.Category));
    return Array.from(uniqueCategories).filter(Boolean);
  }, [products]);

  if (loading) {
    return <div className="flex justify-center p-4">Loading...</div>;
  }

  return (
    <div>
      {/* Add Product Button */}
      <div className="mb-4">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Product
        </button>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Product</h2>
            <form onSubmit={handleAddProduct}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item Code</label>
                  <input
                    type="text"
                    name="item_code"
                    value={formData.item_code}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Product</label>
                  <input
                    type="text"
                    name="Product"
                    value={formData.Product}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    name="Category"
                    value={formData.Category}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Weight</label>
                  <input
                    type="text"
                    name="Weight"
                    value={formData.Weight}
                    placeholder="e.g., 15kg x 2"
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">UOM</label>
                  <input
                    type="text"
                    name="uom"
                    value={formData.uom}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <input
                    type="text"
                    name="Country"
                    value={formData.Country}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-4 flex gap-4">
        {/* Search input */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category filter */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
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
              {filteredProducts.map((product) => (
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
                        {product.Product || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${product.price?.toFixed(2) || '0.00'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.Category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.Weight}
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
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

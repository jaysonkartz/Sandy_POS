'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import React from 'react';

interface Country {
  id: number;
  country: string;
  country_ch: string;
  active: boolean;
}

interface Product {
  id: number;
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

interface ProductDetail {
  id: string;
  product_id: string;
  description: string;
  description_ch: string;
  created_at: string;
}

interface PricingHistory {
  id: string;
  product_id: string;
  price: number;
  effective_date: string;
  created_at: string;
}

interface CustomerPurchase {
  customer: {
    name: string;
    email: string;
  };
  last_purchase_date: string;
  total_purchases: number;
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [products, setProducts] = useState<{ [key: string]: Product[] }>({});
  const [expandedCountry, setExpandedCountry] = useState<number | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDetails, setProductDetails] = useState<ProductDetail | null>(null);
  const [pricingHistory, setPricingHistory] = useState<PricingHistory[]>([]);
  const [customerPurchases, setCustomerPurchases] = useState<CustomerPurchase[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch countries
      const { data: countriesData, error: countriesError } = await supabase
        .from('countries')
        .select('*')
        .order('country');

      if (countriesError) throw countriesError;
      setCountries(countriesData || []);

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('Product');

      if (productsError) throw productsError;

      // Group products by country
      const groupedProducts = productsData?.reduce((acc: { [key: string]: Product[] }, product) => {
        if (!acc[product.Country]) {
          acc[product.Country] = [];
        }
        acc[product.Country].push(product);
        return acc;
      }, {}) || {};

      setProducts(groupedProducts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCountry = (countryId: number) => {
    setExpandedCountry(expandedCountry === countryId ? null : countryId);
  };

  const toggleProduct = async (product: Product) => {
    if (selectedProduct?.id === product.id) {
      setSelectedProduct(null);
      setProductDetails(null);
      setPricingHistory([]);
      setCustomerPurchases([]);
    } else {
      setSelectedProduct(product);
      await fetchProductDetails(product.id.toString());
    }
  };

  const fetchProductDetails = async (productId: string) => {
    try {
      // Fetch product details
      const { data: details, error: detailsError } = await supabase
        .from('products')  // or your actual table name
        .select(`
          id,
          description,
          description_ch
        `)
        .eq('id', productId)
        .single();
      
      if (detailsError) {
        console.log('Product details error:', detailsError);
      } else {
        setProductDetails(details);
      }

      // Fetch pricing history
      const { data: pricing, error: pricingError } = await supabase
        .from('product_pricing')  // or your actual table name
        .select(`
          id,
          price,
          created_at,
          updated_by
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      
      if (pricingError) {
        console.log('Pricing history error:', pricingError);
      } else {
        setPricingHistory(pricing || []);
      }

      // Fetch customer purchases
      const { data: orders, error: ordersError } = await supabase
        .from('orders')  // adjust table name as needed
        .select(`
          id,
          created_at,
          customers (
            id,
            name,
            email
          )
        `)
        .eq('product_id', productId);
      
      if (ordersError) {
        console.log('Customer purchases error:', ordersError);
      } else {
        // Process orders into customer purchase summary
        const customerMap = new Map();
        orders?.forEach(order => {
          if (!order.customers) return;
          
          const customer = order.customers;
          const key = customer.email;
          
          if (!customerMap.has(key)) {
            customerMap.set(key, {
              customer: {
                name: customer.name,
                email: customer.email
              },
              last_purchase_date: order.created_at,
              total_purchases: 1
            });
          } else {
            const existing = customerMap.get(key);
            existing.total_purchases += 1;
            if (new Date(order.created_at) > new Date(existing.last_purchase_date)) {
              existing.last_purchase_date = order.created_at;
            }
          }
        });
        
        setCustomerPurchases(Array.from(customerMap.values()));
      }

    } catch (error) {
      console.error('Error in fetchProductDetails:', error);
    }
  };

  const filteredCountries = countries.filter(country =>
    country.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.country_ch.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Countries Management</h1>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredCountries.map((country) => (
          <div key={country.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div
              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => toggleCountry(country.id)}
            >
              <div className="flex items-center space-x-4">
                <svg
                  className={`w-5 h-5 transform transition-transform ${
                    expandedCountry === country.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {country.country} {country.country_ch}
                  </h3>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500">
                  {products[country.country]?.length || 0} Products
                </span>
              </div>
            </div>

            {expandedCountry === country.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="border-t border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chinese Product Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variation</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight/UOM</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products[country.country]?.map((product, index) => (
                        <React.Fragment key={`${product.Product}-${index}`}>
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => toggleProduct(product)}
                            className={`hover:bg-gray-50 cursor-pointer ${
                              selectedProduct?.id === product.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <svg
                                  className={`w-5 h-5 transform transition-transform ${
                                    expandedProducts.has(`${country.id}-${product.Product}`) ? 'rotate-180' : ''
                                  } mr-2`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                <div className="text-sm font-medium text-gray-900">{product.Product}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{product.Product_CH}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {product.Variation ? (
                                <div>
                                  <div className="text-sm text-gray-900">{product.Variation}</div>
                                  <div className="text-sm text-gray-500">{product.Variation_CH}</div>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {product.weight} {product.UOM}
                              </div>
                              {product.Weight_KG && (
                                <div className="text-sm text-gray-500">({product.Weight_KG} KG)</div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                product.availability ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {product.availability ? 'Available' : 'Unavailable'}
                              </span>
                            </td>
                          </motion.tr>
                          {selectedProduct?.id === product.id && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-gray-50"
                            >
                              <td colSpan={6} className="px-4 py-4">
                                <div className="bg-white rounded-lg shadow-sm p-4">
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div className="space-y-4">
                                      <div>
                                        <h3 className="text-lg font-semibold mb-2">Product Details</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                          <div>
                                            <span className="text-gray-600">Product ID:</span>
                                            <span className="ml-2 font-medium">{selectedProduct.id}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Name:</span>
                                            <span className="ml-2 font-medium">{selectedProduct.Product}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Chinese Name:</span>
                                            <span className="ml-2 font-medium">{selectedProduct.Product_CH}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Category:</span>
                                            <span className="ml-2 font-medium">{selectedProduct.category}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Weight:</span>
                                            <span className="ml-2 font-medium">{selectedProduct.weight} {selectedProduct.UOM}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-4">
                                      <div>
                                        <h3 className="text-lg font-semibold mb-2">Customer History</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                          <div className="overflow-y-auto max-h-48">
                                            {customerPurchases && customerPurchases.length > 0 ? (
                                              <table className="min-w-full">
                                                <thead>
                                                  <tr>
                                                    <th className="text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                                    <th className="text-left text-xs font-medium text-gray-500 uppercase">Last Purchase</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {customerPurchases.map((purchase, index) => (
                                                    <tr key={index} className="border-b border-gray-200">
                                                      <td className="py-2 text-sm">{purchase.customer.name}</td>
                                                      <td className="py-2 text-sm">
                                                        {new Date(purchase.last_purchase_date).toLocaleDateString()}
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            ) : (
                                              <p className="text-sm text-gray-500">No purchase history available</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-4">
                                      <div>
                                        <h3 className="text-lg font-semibold mb-2">Price History</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                          <div className="overflow-y-auto max-h-48">
                                            {pricingHistory && pricingHistory.length > 0 ? (
                                              <table className="min-w-full">
                                                <thead>
                                                  <tr>
                                                    <th className="text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                    <th className="text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {pricingHistory.map((price) => (
                                                    <tr key={price.id} className="border-b border-gray-200">
                                                      <td className="py-2 text-sm">
                                                        {new Date(price.created_at).toLocaleDateString()}
                                                      </td>
                                                      <td className="py-2 text-sm">${price.price.toFixed(2)}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            ) : (
                                              <p className="text-sm text-gray-500">No price history available</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex justify-end space-x-2 mt-6">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Add edit functionality
                                      }}
                                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    >
                                      Edit Product
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedProduct(null);
                                      }}
                                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                    >
                                      Close
                                    </button>
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
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 
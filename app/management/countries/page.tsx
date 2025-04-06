'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Country {
  id: number;
  country: string;
  is_active: boolean;
  chineseName: string;
}

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

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [products, setProducts] = useState<{ [key: string]: Product[] }>({});
  const [expandedCountry, setExpandedCountry] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'country' | 'chineseName'>('country');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const { data: countriesData, error: countriesError } = await supabase
        .from('countries')
        .select('*')
        .order('country');

      if (countriesError) throw countriesError;
      setCountries(countriesData || []);

      console.log('Countries Data:', countriesData);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) throw productsError;

      console.log('Products Data:', productsData);

      // Create a mapping of country names, handling spaces and casing
      const countryMapping = countriesData.reduce((acc: { [key: string]: string }, country: Country) => {
        // Add the exact match
        acc[country.country] = country.country;
        // Add a version with trimmed spaces
        acc[country.country.trim()] = country.country;
        // Add a version with extra space
        acc[country.country + ' '] = country.country;
        return acc;
      }, {});

      console.log('Country Mapping:', countryMapping);

      const productsByCountry = (productsData || []).reduce((acc: { [key: string]: Product[] }, product: Product) => {
        // Clean up the country name from the product
        const cleanCountry = product.Country.trim();
        // Get the standardized country name from our mapping
        const countryKey = countryMapping[cleanCountry] || cleanCountry;
        
        if (!acc[countryKey]) {
          acc[countryKey] = [];
        }
        acc[countryKey].push(product);
        return acc;
      }, {});

      console.log('Products by Country:', productsByCountry);
      setProducts(productsByCountry);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCountry = (countryId: number) => {
    setExpandedCountry(expandedCountry === countryId ? null : countryId);
  };

  const handleSort = (field: 'country' | 'chineseName') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedCountries = countries
    .filter(country => {
      const matchesSearch = country.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          country.chineseName.includes(searchTerm);
      const matchesActive = filterActive === null || country.is_active === filterActive;
      return matchesSearch && matchesActive;
    })
    .sort((a, b) => {
      const compareValue = sortOrder === 'asc' ? 1 : -1;
      return a[sortBy] > b[sortBy] ? compareValue : -compareValue;
    });

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
          <select
            value={filterActive === null ? 'all' : filterActive.toString()}
            onChange={(e) => setFilterActive(e.target.value === 'all' ? null : e.target.value === 'true')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex items-center px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex-[2] flex items-center">
            <button
              onClick={() => handleSort('country')}
              className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span>Country Name</span>
              {sortBy === 'country' && (
                <svg
                  className={`w-4 h-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''} ml-1`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex-[2] flex items-center justify-center">
            <button
              onClick={() => handleSort('chineseName')}
              className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span>Chinese Name</span>
              {sortBy === 'chineseName' && (
                <svg
                  className={`w-4 h-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''} ml-1`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          </div>
          <div className="w-32 text-right">Products</div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredAndSortedCountries.map((country) => (
            <motion.div
              key={country.id}
              initial={false}
              animate={{ backgroundColor: expandedCountry === country.id ? '#f9fafb' : '#ffffff' }}
              className="border-b last:border-b-0"
            >
              <button
                onClick={() => toggleCountry(country.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex-[2]">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      country.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {country.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-lg font-medium text-gray-900">{country.country}</span>
                  </div>
                </div>
                <div className="flex-[2] flex justify-center">
                  <span className="text-lg text-gray-500">{country.chineseName}</span>
                </div>
                <div className="flex items-center space-x-4 w-32 justify-end">
                  <span className="text-sm text-gray-500">
                    {products[country.country]?.length || 0} Products
                  </span>
                  <svg
                    className={`w-5 h-5 transform transition-transform ${expandedCountry === country.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              <AnimatePresence>
                {expandedCountry === country.id && products[country.country] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 py-4 bg-gray-50">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chinese Product Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variation</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chinese Variation</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UOM</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {products[country.country]?.map((product, index) => (
                              <motion.tr
                                key={index}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{product.Product}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{product.Product_CH}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{product.Variation || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{product.Variation_CH || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{product.weight}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{product.UOM}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    product.availability ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {product.availability ? 'Available' : 'Unavailable'}
                                  </span>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 
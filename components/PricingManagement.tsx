'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  category: number;
  maxQuantity: number;
  imagesUrl: string;
  heroImage: string;
  availability: boolean;
  leadTime: number;
  origin: string;
  moq: number;
}

interface Category {
  id: number;
  name: string;
  imageUrl: string;
}

export default function PricingManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    price: '',
    slug: '',
    category: 2,
    maxQuantity: 0,
    imagesUrl: '',
    heroImage: '',
    origin: '',
    moq: 1,
    availability: false
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchData() {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return;
      }

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) {
        console.error('Error fetching products:', productsError);
        return;
      }

      const categoriesWithProducts = categoriesData.map(category => ({
        ...category,
        products: productsData.filter(product => product.category === category.id)
      }));

      setCategories(categoriesWithProducts);
      console.log(categories)
    }

    fetchData();
  }, []);

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the first available category ID or show error if none exist
    if (categories.length === 0) {
      console.error('No categories available. Please create a category first.');
      return;
    }
    
    if (newProduct.title && newProduct.price) {
      const product = {
        title: newProduct.title,
        price: parseInt(newProduct.price),
        slug: newProduct.title.toLowerCase().replace(/\s+/g, '-'),
        category: categories[0].id, 
        imagesUrl: '',
        heroImage: '',
        maxQuantity: 0,
        origin: '',
        moq: 1,
        availability: false
      };

      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select();
        
      if (error) {
        console.error('Error adding product:', error);
        return;
      }

      setNewProduct({ title: '', price: '' });
      setShowAddForm(false);
    }
  };

  const handleUpdateProduct = async (productId: number, newPrice: number) => {
    const { error } = await supabase
      .from('products')
      .update({ price: newPrice })
      .eq('id', productId);

    if (error) {
      console.error('Error updating product:', error);
      return;
    }

    setProducts(prev => prev.map(product => 
      product.id === productId ? { ...product, price: newPrice } : product
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Pricing Management</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Product
        </motion.button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-lg shadow mb-6"
          >
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Product Name
                </label>
                <input
                  type="text"
                  id="title"
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price
                </label>
                <input
                  type="number"
                  id="price"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <input
                  type="number"
                  id="category"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="maxQuantity" className="block text-sm font-medium text-gray-700">
                  Max Quantity
                </label>
                <input
                  type="number"
                  id="maxQuantity"
                  value={newProduct.maxQuantity}
                  onChange={(e) => setNewProduct({ ...newProduct, maxQuantity: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="imagesUrl" className="block text-sm font-medium text-gray-700">
                  Images URL
                </label>
                <input
                  type="text"
                  id="imagesUrl"
                  value={newProduct.imagesUrl}
                  onChange={(e) => setNewProduct({ ...newProduct, imagesUrl: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="heroImage" className="block text-sm font-medium text-gray-700">
                  Hero Image
                </label>
                <input
                  type="text"
                  id="heroImage"
                  value={newProduct.heroImage}
                  onChange={(e) => setNewProduct({ ...newProduct, heroImage: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="origin" className="block text-sm font-medium text-gray-700">
                  Origin
                </label>
                <input
                  type="text"
                  id="origin"
                  value={newProduct.origin}
                  onChange={(e) => setNewProduct({ ...newProduct, origin: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="moq" className="block text-sm font-medium text-gray-700">
                  MOQ (Minimum Order Quantity)
                </label>
                <input
                  type="number"
                  id="moq"
                  value={newProduct.moq}
                  onChange={(e) => setNewProduct({ ...newProduct, moq: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
                  Availability
                </label>
                <input
                  type="checkbox"
                  id="availability"
                  checked={newProduct.availability}
                  onChange={(e) => setNewProduct({ ...newProduct, availability: e.target.checked })}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Product
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Max Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                MOQ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Origin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Availability
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <motion.tr
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${product.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {categories.find(c => c.id === product.category)?.name || product.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.maxQuantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.moq}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.origin}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.availability ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.availability ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button 
                    onClick={() => handleUpdateProduct(product.id, product.price)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => {/* Add delete handler */}}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
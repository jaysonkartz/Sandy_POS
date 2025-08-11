"use client";

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createBrowserClient } from "@supabase/ssr";
import { Edit3, Save, X, Camera, Image as ImageIcon } from 'lucide-react';
import ProductPhotoEditor from './ProductPhotoEditor';

interface Product {
  id: number;
  Product: string;
  Product_CH?: string;
  Category: string;
  "Item Code": string;
  price: number;
  UOM: string;
  Country: string;
  Variation?: string;
  weight?: string;
  stock_quantity?: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
  onUpdate: (productId: number, updatedData: Partial<Product>) => Promise<void>;
}

export default function EditProductModal({ product, onClose, onUpdate }: EditProductModalProps) {
  const [editedProduct, setEditedProduct] = useState({ ...product });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(product.image_url || '');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onUpdate(product.id, editedProduct);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpdate = useCallback((imageUrl: string) => {
    setCurrentImageUrl(imageUrl);
    setEditedProduct(prev => ({ ...prev, image_url: imageUrl }));
  }, []);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Edit Product</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Image Section */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Product Image
                </h3>
                <button
                  type="button"
                  onClick={() => setIsPhotoEditorOpen(true)}
                  className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  {currentImageUrl ? 'Edit Photo' : 'Add Photo'}
                </button>
              </div>

              {/* Current Image Preview */}
              {currentImageUrl ? (
                <div className="relative inline-block">
                  <img
                    src={currentImageUrl}
                    alt={editedProduct.Product}
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                    <Edit3 className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No image</p>
                  </div>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-product-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name (English)
                </label>
                <input
                  type="text"
                  id="edit-product-name"
                  value={editedProduct.Product}
                  onChange={(e) => setEditedProduct({ ...editedProduct, Product: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-product-name-ch" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name (Chinese)
                </label>
                <input
                  type="text"
                  id="edit-product-name-ch"
                  value={editedProduct.Product_CH || ''}
                  onChange={(e) => setEditedProduct({ ...editedProduct, Product_CH: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="edit-item-code" className="block text-sm font-medium text-gray-700 mb-1">
                  Item Code
                </label>
                <input
                  type="text"
                  id="edit-item-code"
                  value={editedProduct["Item Code"]}
                  onChange={(e) => setEditedProduct({ ...editedProduct, "Item Code": e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  id="edit-category"
                  value={editedProduct.Category}
                  onChange={(e) => setEditedProduct({ ...editedProduct, Category: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  id="edit-price"
                  step="0.01"
                  min="0"
                  value={editedProduct.price}
                  onChange={(e) => setEditedProduct({ ...editedProduct, price: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-uom" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit of Measure
                </label>
                <input
                  type="text"
                  id="edit-uom"
                  value={editedProduct.UOM}
                  onChange={(e) => setEditedProduct({ ...editedProduct, UOM: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country of Origin
                </label>
                <input
                  type="text"
                  id="edit-country"
                  value={editedProduct.Country}
                  onChange={(e) => setEditedProduct({ ...editedProduct, Country: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="edit-variation" className="block text-sm font-medium text-gray-700 mb-1">
                  Variation
                </label>
                <input
                  type="text"
                  id="edit-variation"
                  value={editedProduct.Variation || ''}
                  onChange={(e) => setEditedProduct({ ...editedProduct, Variation: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="edit-weight" className="block text-sm font-medium text-gray-700 mb-1">
                  Weight
                </label>
                <input
                  type="text"
                  id="edit-weight"
                  value={editedProduct.weight || ''}
                  onChange={(e) => setEditedProduct({ ...editedProduct, weight: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="edit-stock" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  id="edit-stock"
                  min="0"
                  value={editedProduct.stock_quantity || 0}
                  onChange={(e) => setEditedProduct({ ...editedProduct, stock_quantity: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Photo Editor Modal */}
      <ProductPhotoEditor
        productId={product.id}
        productName={editedProduct.Product}
        currentImageUrl={currentImageUrl}
        onImageUpdate={handleImageUpdate}
        onClose={() => setIsPhotoEditorOpen(false)}
        isOpen={isPhotoEditorOpen}
      />
    </>
  );
}

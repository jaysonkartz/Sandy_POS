"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { Plus, Edit3, Trash2, Save, X, Camera, Image as ImageIcon } from "lucide-react";

interface ProductVariant {
  id: number;
  Variation: string;
  Variation_CH?: string;
  price: number;
  weight?: string;
  stock_quantity: number;
  image_url?: string;
  Product: string;
  Product_CH?: string;
  "Item Code": string;
  Category: number;
  Country: number;
  UOM: string;
}

interface VariantExtractorProps {
  productId: number;
  productName: string;
  onVariantsChange?: (variants: ProductVariant[]) => void;
}

export default function VariantExtractor({ productId, productName, onVariantsChange }: VariantExtractorProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [isAddingVariant, setIsAddingVariant] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch variants from the products table
  const fetchVariants = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all products that have the same base product name but different variations
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('Product', productName)
        .order('Variation', { ascending: true });

      if (error) throw error;

      setVariants(data || []);
      onVariantsChange?.(data || []);
    } catch (err) {
      console.error('Error fetching variants:', err);
      setError(err instanceof Error ? err.message : 'Failed to load variants');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, productName, onVariantsChange]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  // Update variant
  const handleUpdateVariant = useCallback(async (variantId: number, updatedData: Partial<ProductVariant>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', variantId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        
        if (error.code === '42501') {
          alert('Permission denied. Please contact your administrator to update database permissions.');
        } else {
          alert(`Failed to update variant: ${error.message}`);
        }
        return;
      }

      setVariants(prev => prev.map(v => v.id === variantId ? data : v));
      setEditingVariant(null);
    } catch (err) {
      console.error('Error updating variant:', err);
      alert('Failed to update variant. Please try again.');
    }
  }, [supabase]);

  // Delete variant
  const handleDeleteVariant = useCallback(async (variantId: number) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', variantId);

      if (error) {
        console.error('Supabase error:', error);
        
        if (error.code === '42501') {
          alert('Permission denied. Please contact your administrator to update database permissions.');
        } else {
          alert(`Failed to delete variant: ${error.message}`);
        }
        return;
      }

      setVariants(prev => prev.filter(v => v.id !== variantId));
    } catch (err) {
      console.error('Error deleting variant:', err);
      alert('Failed to delete variant. Please try again.');
    }
  }, [supabase]);

  // Add new variant
  const handleAddVariant = useCallback(async (variantData: Omit<ProductVariant, 'id'>) => {
    try {
      // First, check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        alert('You must be logged in to add variants. Please sign in and try again.');
        return;
      }

      // Prepare the data for insertion, ensuring no id field is included
      const insertData = {
        Product: variantData.Product,
        Product_CH: variantData.Product_CH || null,
        Variation: variantData.Variation,
        Variation_CH: variantData.Variation_CH || null,
        price: variantData.price,
        weight: variantData.weight || null,
        stock_quantity: variantData.stock_quantity,
        UOM: variantData.UOM,
        Category: variantData.Category,
        Country: variantData.Country,
        "Item Code": variantData["Item Code"] || null,
        image_url: variantData.image_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Inserting variant data:', insertData);

      const { data, error } = await supabase
        .from('products')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        
        // Check for specific error types
        if (error.code === '42501') {
          alert('Permission denied. Please contact your administrator to update database permissions for adding product variants.');
        } else if (error.code === '23502') {
          alert('Database constraint error. The ID sequence may be broken. Please contact your administrator to fix the database sequence.');
        } else if (error.code === '23505') {
          alert('Duplicate entry. A product with this variation already exists.');
        } else {
          alert(`Failed to add variant: ${error.message}`);
        }
        return;
      }

      console.log('Successfully added variant:', data);
      setVariants(prev => [...prev, data]);
      setIsAddingVariant(false);
    } catch (err) {
      console.error('Error adding variant:', err);
      alert('Failed to add variant. Please try again.');
    }
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600 text-sm">{error}</p>
        <button
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          onClick={fetchVariants}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Product Variants ({variants.length})</h3>
        <button
          className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors"
          onClick={() => setIsAddingVariant(true)}
        >
          <Plus className="w-4 h-4" />
          Add Variant
        </button>
      </div>

      {/* Variants List */}
      <div className="space-y-3">
        <AnimatePresence>
          {variants.map((variant) => (
            <motion.div
              key={variant.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Variant Image */}
                  <div className="relative">
                    {variant.image_url ? (
                      <img
                        src={variant.image_url}
                        alt={variant.Variation}
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Variant Details */}
                  <div>
                    <h4 className="font-medium">{variant.Variation}</h4>
                    {variant.Variation_CH && (
                      <p className="text-sm text-gray-600">{variant.Variation_CH}</p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>Price: ${variant.price.toFixed(2)}</span>
                      <span>Stock: {variant.stock_quantity}</span>
                      {variant.weight && <span>Weight: {variant.weight}</span>}
                      <span>UOM: {variant.UOM}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    onClick={() => setEditingVariant(variant)}
                    title="Edit Variant"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    onClick={() => handleDeleteVariant(variant.id)}
                    title="Delete Variant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {variants.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No variants found for this product.</p>
            <p className="text-sm">Click "Add Variant" to create product variations.</p>
          </div>
        )}
      </div>

      {/* Add Variant Modal */}
      {isAddingVariant && (
        <AddVariantModal
          productName={productName}
          onClose={() => setIsAddingVariant(false)}
          onSave={handleAddVariant}
        />
      )}

      {/* Edit Variant Modal */}
      {editingVariant && (
        <EditVariantModal
          variant={editingVariant}
          onClose={() => setEditingVariant(null)}
          onSave={(updatedData) => handleUpdateVariant(editingVariant.id, updatedData)}
        />
      )}
    </div>
  );
}

// Add Variant Modal Component
interface AddVariantModalProps {
  productName: string;
  onClose: () => void;
  onSave: (variantData: Omit<ProductVariant, 'id'>) => void;
}

function AddVariantModal({ productName, onClose, onSave }: AddVariantModalProps) {
  const [variantData, setVariantData] = useState({
    Product: productName,
    Product_CH: '',
    Variation: '',
    Variation_CH: '',
    price: 0,
    weight: '',
    stock_quantity: 0,
    UOM: 'kg',
    Category: 1,
    Country: 1,
    "Item Code": '',
    image_url: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(variantData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add Product Variant</h3>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variation Name (English) *
            </label>
            <input
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={variantData.Variation}
              onChange={(e) => setVariantData({ ...variantData, Variation: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variation Name (Chinese)
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={variantData.Variation_CH}
              onChange={(e) => setVariantData({ ...variantData, Variation_CH: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={variantData.price}
                onChange={(e) => setVariantData({ ...variantData, price: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                required
                type="number"
                min="0"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={variantData.stock_quantity}
                onChange={(e) => setVariantData({ ...variantData, stock_quantity: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={variantData.weight}
                onChange={(e) => setVariantData({ ...variantData, weight: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UOM *
              </label>
              <select
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={variantData.UOM}
                onChange={(e) => setVariantData({ ...variantData, UOM: e.target.value })}
              >
                <option value="kg">kg</option>
                <option value="bag">bag</option>
                <option value="ctn">ctn</option>
                <option value="pcs">pcs</option>
                <option value="box">box</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Code
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={variantData["Item Code"]}
              onChange={(e) => setVariantData({ ...variantData, "Item Code": e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Add Variant
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Edit Variant Modal Component
interface EditVariantModalProps {
  variant: ProductVariant;
  onClose: () => void;
  onSave: (updatedData: Partial<ProductVariant>) => void;
}

function EditVariantModal({ variant, onClose, onSave }: EditVariantModalProps) {
  const [variantData, setVariantData] = useState({
    Variation: variant.Variation,
    Variation_CH: variant.Variation_CH || '',
    price: variant.price,
    weight: variant.weight || '',
    stock_quantity: variant.stock_quantity,
    UOM: variant.UOM,
    "Item Code": variant["Item Code"],
    image_url: variant.image_url || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(variantData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Product Variant</h3>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variation Name (English) *
            </label>
            <input
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={variantData.Variation}
              onChange={(e) => setVariantData({ ...variantData, Variation: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variation Name (Chinese)
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={variantData.Variation_CH}
              onChange={(e) => setVariantData({ ...variantData, Variation_CH: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={variantData.price}
                onChange={(e) => setVariantData({ ...variantData, price: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                required
                type="number"
                min="0"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={variantData.stock_quantity}
                onChange={(e) => setVariantData({ ...variantData, stock_quantity: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={variantData.weight}
                onChange={(e) => setVariantData({ ...variantData, weight: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UOM *
              </label>
              <select
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={variantData.UOM}
                onChange={(e) => setVariantData({ ...variantData, UOM: e.target.value })}
              >
                <option value="kg">kg</option>
                <option value="bag">bag</option>
                <option value="ctn">ctn</option>
                <option value="pcs">pcs</option>
                <option value="box">box</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Code
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={variantData["Item Code"]}
              onChange={(e) => setVariantData({ ...variantData, "Item Code": e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

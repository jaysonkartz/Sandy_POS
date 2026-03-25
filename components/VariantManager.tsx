"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence as FramerAnimatePresence } from "framer-motion";
import { CldImage } from "next-cloudinary";
import { supabase } from "@/app/lib/supabaseClient";
import { Plus, Edit3, Trash2, Save, X, Camera, Image as ImageIcon } from "lucide-react";
import { ProductVariant } from "@/app/types/product";
import ProductPhotoEditor from "./ProductPhotoEditor";

const AnimatePresence = FramerAnimatePresence as unknown as React.FC<
  React.PropsWithChildren<Record<string, unknown>>
>;

interface VariantManagerProps {
  productId: number;
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
  onRefetchProducts: () => Promise<void>;
}

export default function VariantManager({
  productId,
  variants,
  onVariantsChange,
  onRefetchProducts,
}: VariantManagerProps) {
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [selectedVariantForPhoto, setSelectedVariantForPhoto] = useState<ProductVariant | null>(
    null
  );

  const handleAddVariant = useCallback(
    async (variantData: Omit<ProductVariant, "id" | "product_id">) => {
      try {
        const { data, error } = await supabase
          .from("product_variants")
          .insert([
            {
              product_id: productId,
              ...variantData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;

        onVariantsChange([...variants, data]);
        setIsAddingVariant(false);
      } catch (err) {
        console.error("Error adding variant:", err);
        alert("Failed to add variant");
      }
    },
    [productId, variants, onVariantsChange]
  );

  const handleUpdateVariant = useCallback(
    async (variantId: number, updatedData: Partial<ProductVariant>) => {
      try {
        const { data, error } = await supabase
          .from("product_variants")
          .update({
            ...updatedData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", variantId)
          .select()
          .single();

        if (error) throw error;

        onVariantsChange(variants.map((v) => (v.id === variantId ? data : v)));
        setEditingVariant(null);
      } catch (err) {
        console.error("Error updating variant:", err);
        alert("Failed to update variant");
      }
    },
    [variants, onVariantsChange]
  );

  const handleDeleteVariant = useCallback(
    async (variantId: number) => {
      if (!confirm("Are you sure you want to delete this variant?")) return;

      try {
        const { error } = await supabase.from("product_variants").delete().eq("id", variantId);

        if (error) throw error;

        onVariantsChange(variants.filter((v) => v.id !== variantId));
      } catch (err) {
        console.error("Error deleting variant:", err);
        alert("Failed to delete variant");
      }
    },
    [variants, onVariantsChange]
  );

  const handleImageUpdate = useCallback(
    (imageUrl: string) => {
      if (editingVariant) {
        setEditingVariant((prev) => (prev ? { ...prev, image_url: imageUrl } : null));
      }
    },
    [editingVariant]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Product Variants</h3>
        <button
          className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors"
          onClick={() => setIsAddingVariant(true)}
        >
          <Plus className="w-4 h-4" />
          Add Variant
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {variants.map((variant) => (
            <motion.div
              key={variant.id}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-lg p-4 bg-gray-50"
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {variant.image_url ? (
                      <CldImage
                        unoptimized
                        alt={variant.variation_name}
                        className="w-16 h-16 object-cover rounded-lg border"
                        height={64}
                        src={variant.image_url}
                        width={64}
                      />
                    ) : (
                      <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium">{variant.variation_name}</h4>
                    {variant.variation_name_ch && (
                      <p className="text-sm text-gray-600">{variant.variation_name_ch}</p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>Price: ${variant.price}</span>
                      <span>Stock: {variant.stock_quantity}</span>
                      {variant.weight && <span>Weight: {variant.weight}</span>}
                      {variant.is_default && (
                        <span className="text-blue-600 font-medium">Default</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit Photo"
                    onClick={() => {
                      setSelectedVariantForPhoto(variant);
                      setIsPhotoEditorOpen(true);
                    }}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    title="Edit Variant"
                    onClick={() => setEditingVariant(variant)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Variant"
                    onClick={() => variant.id && handleDeleteVariant(variant.id)}
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
            <p>No variants added yet.</p>
            <p className="text-sm">Click "Add Variant" to create product variations.</p>
          </div>
        )}
      </div>

      {isAddingVariant && (
        <AddVariantModal onClose={() => setIsAddingVariant(false)} onSave={handleAddVariant} />
      )}

      {editingVariant && (
        <EditVariantModal
          variant={editingVariant}
          onClose={() => setEditingVariant(null)}
          onSave={(updatedData) =>
            editingVariant.id && handleUpdateVariant(editingVariant.id, updatedData)
          }
        />
      )}

      <ProductPhotoEditor
        currentImageUrl={selectedVariantForPhoto?.image_url || ""}
        isOpen={isPhotoEditorOpen}
        productId={productId}
        productName={selectedVariantForPhoto?.variation_name || ""}
        onClose={() => {
          setIsPhotoEditorOpen(false);
          setSelectedVariantForPhoto(null);
        }}
        onImageUpdate={(imageUrl) => {
          handleImageUpdate(imageUrl);
          if (selectedVariantForPhoto?.id) {
            handleUpdateVariant(selectedVariantForPhoto.id, { image_url: imageUrl });
          }
        }}
        onRefetchProducts={onRefetchProducts}
      />
    </div>
  );
}

interface AddVariantModalProps {
  onClose: () => void;
  onSave: (variantData: Omit<ProductVariant, "id" | "product_id">) => void;
}

function AddVariantModal({ onClose, onSave }: AddVariantModalProps) {
  const [variantData, setVariantData] = useState({
    variation_name: "",
    variation_name_ch: "",
    price: 0,
    weight: "",
    stock_quantity: 0,
    image_url: "",
    is_default: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(variantData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full"
        initial={{ opacity: 0, y: -20 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add Product Variant</h3>
          <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant Name (English) *
            </label>
            <input
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={variantData.variation_name}
              onChange={(e) => setVariantData({ ...variantData, variation_name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant Name (Chinese)
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={variantData.variation_name_ch}
              onChange={(e) =>
                setVariantData({ ...variantData, variation_name_ch: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
                type="number"
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
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                type="number"
                value={variantData.stock_quantity}
                onChange={(e) =>
                  setVariantData({ ...variantData, stock_quantity: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={variantData.weight}
              onChange={(e) => setVariantData({ ...variantData, weight: e.target.value })}
            />
          </div>

          <div className="flex items-center">
            <input
              checked={variantData.is_default}
              className="mr-2"
              id="is-default"
              type="checkbox"
              onChange={(e) => setVariantData({ ...variantData, is_default: e.target.checked })}
            />
            <label className="text-sm text-gray-700" htmlFor="is-default">
              Set as default variant
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              type="submit"
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

interface EditVariantModalProps {
  variant: ProductVariant;
  onClose: () => void;
  onSave: (updatedData: Partial<ProductVariant>) => void;
}

function EditVariantModal({ variant, onClose, onSave }: EditVariantModalProps) {
  const [variantData, setVariantData] = useState({
    variation_name: variant.variation_name,
    variation_name_ch: variant.variation_name_ch || "",
    price: variant.price,
    weight: variant.weight || "",
    stock_quantity: variant.stock_quantity,
    image_url: variant.image_url || "",
    is_default: variant.is_default || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(variantData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full"
        initial={{ opacity: 0, y: -20 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Product Variant</h3>
          <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant Name (English) *
            </label>
            <input
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={variantData.variation_name}
              onChange={(e) => setVariantData({ ...variantData, variation_name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant Name (Chinese)
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={variantData.variation_name_ch}
              onChange={(e) =>
                setVariantData({ ...variantData, variation_name_ch: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
                type="number"
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
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                type="number"
                value={variantData.stock_quantity}
                onChange={(e) =>
                  setVariantData({ ...variantData, stock_quantity: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={variantData.weight}
              onChange={(e) => setVariantData({ ...variantData, weight: e.target.value })}
            />
          </div>

          <div className="flex items-center">
            <input
              checked={variantData.is_default}
              className="mr-2"
              id="is-default-edit"
              type="checkbox"
              onChange={(e) => setVariantData({ ...variantData, is_default: e.target.checked })}
            />
            <label className="text-sm text-gray-700" htmlFor="is-default-edit">
              Set as default variant
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              type="submit"
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

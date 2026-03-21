"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { CldImage } from "next-cloudinary";
import { supabase } from "@/app/lib/supabaseClient";
import { Edit3, Save, X, Camera, Image as ImageIcon } from "lucide-react";
import ProductPhotoEditor from "./ProductPhotoEditor";
import VariantManager from "./VariantManager";
import { ProductVariant } from "@/app/types/product";

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
  variants?: ProductVariant[];
}

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
  onUpdate: (productId: number, updatedData: Partial<Product>) => Promise<void>;
  onRefetchProducts: () => Promise<void>;
}

export default function EditProductModal({
  product,
  onClose,
  onUpdate,
  onRefetchProducts,
}: EditProductModalProps) {
  const [editedProduct, setEditedProduct] = useState({ ...product });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(product.image_url || "");
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants || []);

  useEffect(() => {
    const fetchVariants = async () => {
      try {
        const { data, error } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", product.id)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setVariants(data || []);
      } catch (err) {
        console.error("Error fetching variants:", err);
      }
    };

    fetchVariants();
  }, [product.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onUpdate(product.id, editedProduct);
      await onRefetchProducts();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpdate = useCallback((imageUrl: string) => {
    setCurrentImageUrl(imageUrl);
    setEditedProduct((prev) => ({ ...prev, image_url: imageUrl }));
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">Edit Product</h2>
            <button
              className="text-gray-400 transition-colors hover:text-gray-600"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-lg border p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <ImageIcon className="h-5 w-5" />
                  Product Image
                </h3>
                <button
                  className="flex items-center gap-2 rounded-md bg-blue-500 px-3 py-2 text-white transition-colors hover:bg-blue-600"
                  type="button"
                  onClick={() => setIsPhotoEditorOpen(true)}
                >
                  <Camera className="h-4 w-4" />
                  {currentImageUrl ? "Edit Photo" : "Add Photo"}
                </button>
              </div>

              {currentImageUrl ? (
                <div className="relative inline-block">
                  <CldImage
                    unoptimized
                    alt={editedProduct.Product}
                    className="h-32 w-32 rounded-lg border object-cover"
                    src={currentImageUrl}
                    width={128}
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black bg-opacity-0 transition-all hover:bg-opacity-20">
                    <Edit3 className="h-6 w-6 text-white opacity-0 transition-opacity hover:opacity-100" />
                  </div>
                </div>
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <ImageIcon className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-500">No image</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="edit-product-name"
                >
                  Product Name (English)
                </label>
                <input
                  required
                  id="edit-product-name"
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  value={editedProduct.Product}
                  onChange={(e) => setEditedProduct({ ...editedProduct, Product: e.target.value })}
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="edit-product-name-ch"
                >
                  Product Name (Chinese)
                </label>
                <input
                  id="edit-product-name-ch"
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  value={editedProduct.Product_CH || ""}
                  onChange={(e) =>
                    setEditedProduct({ ...editedProduct, Product_CH: e.target.value })
                  }
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="edit-item-code"
                >
                  Item Code
                </label>
                <input
                  required
                  id="edit-item-code"
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  value={editedProduct["Item Code"]}
                  onChange={(e) =>
                    setEditedProduct({ ...editedProduct, "Item Code": e.target.value })
                  }
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="edit-category"
                >
                  Category
                </label>
                <input
                  required
                  id="edit-category"
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  value={editedProduct.Category}
                  onChange={(e) => setEditedProduct({ ...editedProduct, Category: e.target.value })}
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="edit-price"
                >
                  Price
                </label>
                <input
                  required
                  id="edit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  value={editedProduct.price}
                  onChange={(e) =>
                    setEditedProduct({ ...editedProduct, price: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="edit-uom">
                  Unit of Measure
                </label>
                <input
                  required
                  id="edit-uom"
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  value={editedProduct.UOM}
                  onChange={(e) => setEditedProduct({ ...editedProduct, UOM: e.target.value })}
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="edit-country"
                >
                  Country of Origin
                </label>
                <input
                  id="edit-country"
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  value={editedProduct.Country}
                  onChange={(e) => setEditedProduct({ ...editedProduct, Country: e.target.value })}
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="edit-variation"
                >
                  Variation
                </label>
                <input
                  id="edit-variation"
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  value={editedProduct.Variation || ""}
                  onChange={(e) =>
                    setEditedProduct({ ...editedProduct, Variation: e.target.value })
                  }
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="edit-weight"
                >
                  Weight
                </label>
                <input
                  id="edit-weight"
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  value={editedProduct.weight || ""}
                  onChange={(e) => setEditedProduct({ ...editedProduct, weight: e.target.value })}
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="edit-stock"
                >
                  Stock Quantity
                </label>
                <input
                  id="edit-stock"
                  type="number"
                  min="0"
                  className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  value={editedProduct.stock_quantity || 0}
                  onChange={(e) =>
                    setEditedProduct({ ...editedProduct, stock_quantity: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <VariantManager
                productId={product.id}
                variants={variants}
                onVariantsChange={setVariants}
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 border-t pt-4">
              <button
                type="button"
                disabled={isLoading}
                onClick={onClose}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      <ProductPhotoEditor
        currentImageUrl={currentImageUrl}
        isOpen={isPhotoEditorOpen}
        productId={product.id}
        productName={product.Product}
        onClose={() => {
          setIsPhotoEditorOpen(false);
        }}
        onImageUpdate={handleImageUpdate}
        onRefetchProducts={onRefetchProducts}
      />
    </>
  );
}
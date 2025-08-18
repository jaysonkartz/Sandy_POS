"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { Plus, Edit3, Trash2, Search, Camera, Image as ImageIcon, Eye, EyeOff } from "lucide-react";
import EditProductModal from "./EditProductModal";
import ProductPhotoEditor from "./ProductPhotoEditor";
import ProductImage from "./ProductImage";

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

interface Category {
  id: number;
  name: string;
  name_ch?: string;
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [selectedProductForPhoto, setSelectedProductForPhoto] = useState<Product | null>(null);
  const [showImages, setShowImages] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from("products").select("*").order("created_at", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.eq("Category", selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedCategory]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filter products based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.Product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.Product_CH && product.Product_CH.toLowerCase().includes(searchTerm.toLowerCase())) ||
      product["Item Code"].toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.Category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle product update
  const handleProductUpdate = useCallback(
    async (productId: number, updatedData: Partial<Product>) => {
      try {
        const { error } = await supabase
          .from("products")
          .update({
            ...updatedData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", productId);

        if (error) throw error;

        // Update local state
        setProducts((prev) =>
          prev.map((product) =>
            product.id === productId ? { ...product, ...updatedData } : product
          )
        );

        setEditingProduct(null);
        setIsEditModalOpen(false);
      } catch (err) {
        throw err;
      }
    },
    [supabase]
  );

  // Handle product deletion
  const handleProductDelete = useCallback(
    async (productId: number) => {
      if (!confirm("Are you sure you want to delete this product?")) return;

      try {
        const { error } = await supabase.from("products").delete().eq("id", productId);

        if (error) throw error;

        setProducts((prev) => prev.filter((product) => product.id !== productId));
      } catch (err) {
        console.error("Error deleting product:", err);
        alert("Failed to delete product");
      }
    },
    [supabase]
  );

  // Handle photo editor
  const handlePhotoEditor = useCallback((product: Product) => {
    setSelectedProductForPhoto(product);
    setIsPhotoEditorOpen(true);
  }, []);

  const handleImageUpdate = useCallback(
    (imageUrl: string) => {
      if (selectedProductForPhoto) {
        setProducts((prev) =>
          prev.map((product) =>
            product.id === selectedProductForPhoto.id
              ? { ...product, image_url: imageUrl }
              : product
          )
        );
      }
    },
    [selectedProductForPhoto]
  );

  // Get image source
  const getImageSource = (product: Product) => {
    if (product.image_url) {
      return product.image_url;
    }

    // Fallback to static image path
    const categoryName = getCategoryName(product.Category);
    const staticImagePath = `/Img/${categoryName}/${product.Product}${product.Variation ? ` (${product.Variation})` : ""}.png`;

    // Return static path, let onError handle fallback to placeholder
    return staticImagePath;
  };

  // Get category name
  const getCategoryName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      "1": "Dried Chilli",
      "2": "Beans & Legumes",
      "3": "Nuts & Seeds",
      "4": "Herbs and Spices",
      "5": "Grains",
      "6": "Dried Seafood",
      "7": "Vegetables",
      "8": "Dried Mushroom & Fungus",
    };
    return categoryMap[category] || "Unknown Category";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600">Manage your product catalog and images</p>
        </div>
        <button
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          onClick={() => {
            setEditingProduct({} as Product);
            setIsEditModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search products..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id.toString()}>
              {category.name}
            </option>
          ))}
        </select>

        <button
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          onClick={() => setShowImages(!showImages)}
        >
          {showImages ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showImages ? "Hide Images" : "Show Images"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              exit={{ opacity: 0, y: -20 }}
              initial={{ opacity: 0, y: 20 }}
            >
              {/* Product Image */}
              {showImages && (
                <div className="relative h-48 bg-gray-100">
                  <ProductImage
                    alt={product.Product}
                    className="w-full h-full object-cover"
                    src={getImageSource(product)}
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      className="bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 transition-colors"
                      title="Edit photo"
                      onClick={() => handlePhotoEditor(product)}
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>
                  {product.image_url && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Custom
                    </div>
                  )}
                </div>
              )}

              {/* Product Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 truncate flex-1">{product.Product}</h3>
                  <div className="flex gap-1 ml-2">
                    <button
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                      title="Edit product"
                      onClick={() => {
                        setEditingProduct(product);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Delete product"
                      onClick={() => handleProductDelete(product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-2">{product["Item Code"]}</p>
                <p className="text-sm text-gray-600 mb-2">{getCategoryName(product.Category)}</p>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    ${product.price?.toFixed(2) || "0.00"}
                  </span>
                  <span className="text-sm text-gray-500">/{product.UOM}</span>
                </div>

                {product.stock_quantity !== undefined && (
                  <p className="text-sm text-gray-500 mt-1">Stock: {product.stock_quantity}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* No Products Message */}
      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">
            {searchTerm || selectedCategory !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Get started by adding your first product"}
          </p>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => {
            setEditingProduct(null);
            setIsEditModalOpen(false);
          }}
          onUpdate={handleProductUpdate}
        />
      )}

      {/* Photo Editor Modal */}
      {selectedProductForPhoto && (
        <ProductPhotoEditor
          currentImageUrl={selectedProductForPhoto.image_url}
          isOpen={isPhotoEditorOpen}
          productId={selectedProductForPhoto.id}
          productName={selectedProductForPhoto.Product}
          onClose={() => {
            setSelectedProductForPhoto(null);
            setIsPhotoEditorOpen(false);
          }}
          onImageUpdate={handleImageUpdate}
        />
      )}
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { CATEGORY_ID_NAME_MAP } from "@/app/(admin)/const/category";

interface Product {
  id: number;
  "Item Code": string;
  Product: string;
  Category: string;
  weight: string;
  UOM: string;
  Country: string;
  Product_CH?: string;
  Category_CH?: string;
  Country_CH?: string;
  Variation?: string;
  Variation_CH?: string;
  price: number;
  uom: string;
  stock_quantity: number;
  image_url?: string;
}

interface ProductGroup {
  title: string;
  products: Product[];
  category: string;
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  productGroups: ProductGroup[];
  filteredProducts: Product[];
  searchTerm: string;
  handleSearchChange: (value: string) => void;
  handleClearSearch: () => void;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  refetchProducts: () => Promise<void>;
}

export const useProducts = (
  selectedCategory: string,
  isEnglish: boolean,
  session: any
): UseProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>();

  // Get category name by id
  const getCategoryName = useCallback((category: string | number) => {
    return CATEGORY_ID_NAME_MAP[String(category)] || "Unknown Category";
  }, []);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value);
    }, 300);
  }, []);

  // Clear search handler
  const handleClearSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setSearchTerm("");
  }, []);

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;

    const searchLower = searchTerm.toLowerCase();
    return products.filter(
      (product) =>
        product.Product.toLowerCase().includes(searchLower) ||
        (product.Product_CH && product.Product_CH.toLowerCase().includes(searchLower)) ||
        product["Item Code"].toLowerCase().includes(searchLower) ||
        product.Category.toLowerCase().includes(searchLower)
    );
  }, [products, searchTerm]);

  const productGroups = useMemo(() => {
    // First, group products by category
    const categoryGroups: { [category: string]: Product[] } = {};
    filteredProducts.forEach((p) => {
      const category = isEnglish
        ? getCategoryName(p.Category)
        : p.Category_CH || getCategoryName(p.Category);
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(p);
    });

    // Then, within each category, group by product name
    const result: ProductGroup[] = [];

    Object.entries(categoryGroups).forEach(([category, categoryProducts]) => {
      const productGroups: { [title: string]: Product[] } = {};

      categoryProducts.forEach((p) => {
        const title = isEnglish ? p.Product : p.Product_CH || p.Product;
        if (!productGroups[title]) {
          productGroups[title] = [];
        }
        productGroups[title].push(p);
      });

      // Add each product group with category info
      Object.values(productGroups).forEach((products) => {
        result.push({
          title: isEnglish ? products[0].Product : products[0].Product_CH || products[0].Product,
          products,
          category: category,
        });
      });
    });

    // Sort by category first, then by product name
    return result.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.title.localeCompare(b.title);
    });
  }, [filteredProducts, isEnglish, getCategoryName]);

  const fetchProducts = useCallback(async () => {
    try {
      setError(null);
      let query = supabase.from("products").select("*");

      if (selectedCategory !== "all") {
        query = query.eq("Category", String(selectedCategory));
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(error instanceof Error ? error.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  const refetchProducts = useCallback(async () => {
    setLoading(true);
    await fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    // Always fetch products, regardless of session state
    fetchProducts();
    
    // Fallback timeout to ensure loading doesn't get stuck
    const fallbackTimeout = setTimeout(() => {
      setLoading(false);
    }, 10000); // 10 second fallback for products
    
    return () => clearTimeout(fallbackTimeout);
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    productGroups,
    filteredProducts,
    searchTerm,
    handleSearchChange,
    handleClearSearch,
    setProducts,
    refetchProducts,
  };
};

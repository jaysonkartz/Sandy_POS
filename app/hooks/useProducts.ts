"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase, supabasePublic } from "@/app/lib/supabaseClient";
import { CATEGORY_ID_NAME_MAP } from "@/app/(admin)/const/category";
import { Session } from "@supabase/supabase-js";

interface ProductImageRow {
  id: number;
  product_id: number;
  image_url: string;
  sort_order: number;
  is_cover: boolean;
}

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
  product_images?: ProductImageRow[];
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
  session: Session | null
): UseProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const getCategoryName = useCallback((category: string | number) => {
    return CATEGORY_ID_NAME_MAP[String(category)] || "Unknown Category";
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter((product) => {
        const productCategory = product.Category;
        const selectedCategoryId = selectedCategory;

        if (!productCategory) return false;

        if (
          productCategory === selectedCategoryId ||
          String(productCategory) === selectedCategoryId ||
          Number(productCategory) === Number(selectedCategoryId)
        ) {
          return true;
        }

        const categoryName = getCategoryName(selectedCategoryId);
        if (productCategory === categoryName) {
          return true;
        }

        return false;
      });
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((product) => {
        return (
          (product.Product &&
            String(product.Product).toLowerCase().includes(searchLower)) ||
          (product.Product_CH &&
            String(product.Product_CH).toLowerCase().includes(searchLower)) ||
          (product["Item Code"] &&
            String(product["Item Code"]).toLowerCase().includes(searchLower)) ||
          (product.Category &&
            String(product.Category).toLowerCase().includes(searchLower))
        );
      });
    }

    return filtered;
  }, [products, selectedCategory, searchTerm, getCategoryName]);

  const productGroups = useMemo(() => {
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

    const result: ProductGroup[] = [];

    Object.entries(categoryGroups).forEach(([category, categoryProducts]) => {
      const groupedByTitle: { [title: string]: Product[] } = {};

      categoryProducts.forEach((p) => {
        const title = isEnglish ? p.Product : p.Product_CH || p.Product;
        if (!groupedByTitle[title]) {
          groupedByTitle[title] = [];
        }
        groupedByTitle[title].push(p);
      });

      Object.values(groupedByTitle).forEach((products) => {
        result.push({
          title: isEnglish ? products[0].Product : products[0].Product_CH || products[0].Product,
          products,
          category,
        });
      });
    });

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

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        setError("Supabase environment variables not configured. Please set up .env.local file.");
        setLoading(false);
        return;
      }

      let query = supabasePublic
        .from("products")
        .select(`
          *,
          product_images (
            id,
            product_id,
            image_url,
            sort_order,
            is_cover
          )
        `);

      if (selectedCategory !== "all") {
        query = query.eq("Category", selectedCategory);
      }

      const { data: productsData, error: productsError } = await query;

      if (productsError) {
        throw productsError;
      }

      const normalizedProducts: Product[] = ((productsData as any[]) || []).map((product) => ({
        ...product,
        product_images: [...(product.product_images || [])].sort((a: ProductImageRow, b: ProductImageRow) => {
          if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
          return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        }),
      }));

      setProducts(normalizedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);

      const mockProducts: Product[] = [
        {
          id: 1,
          "Item Code": "DA001",
          Product: "Dried Anchovy",
          Category: "6",
          weight: "500g",
          UOM: "kg",
          Country: "Malaysia",
          Product_CH: "乾魚仔",
          Category_CH: "乾海產",
          Country_CH: "馬來西亞",
          Variation: "Premium",
          Variation_CH: "優質",
          price: 15.99,
          uom: "kg",
          stock_quantity: 50,
          image_url: "/Img/Dried Seafood/Dried Anchovy.png",
          product_images: [],
        },
        {
          id: 2,
          "Item Code": "DS002",
          Product: "Dried Shrimp",
          Category: "6",
          weight: "300g",
          UOM: "kg",
          Country: "Thailand",
          Product_CH: "乾蝦米",
          Category_CH: "乾海產",
          Country_CH: "泰國",
          Variation: "Large",
          Variation_CH: "大號",
          price: 22.5,
          uom: "kg",
          stock_quantity: 30,
          image_url: "/Img/Dried Seafood/Dried Shrimp.png",
          product_images: [],
        },
        {
          id: 34,
          "Item Code": "DC024",
          Product: "Dried Espelette Pepper",
          Category: "1",
          weight: "160g",
          UOM: "kg",
          Country: "France",
          Product_CH: "乾埃斯佩萊特辣椒",
          Category_CH: "乾辣椒",
          Country_CH: "法國",
          Variation: "Mild",
          Variation_CH: "微辣",
          price: 22.99,
          uom: "kg",
          stock_quantity: 20,
          image_url: "/product-placeholder.png",
          product_images: [],
        },
      ];

      setProducts(mockProducts);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, applyLatestPriceHistory]);

  const refetchProducts = useCallback(async () => {
    setLoading(true);
    await fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        await fetchProducts();
      } catch (error) {
        setLoading(false);
      }
    };

    loadProducts();
  }, [selectedCategory, fetchProducts]);

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
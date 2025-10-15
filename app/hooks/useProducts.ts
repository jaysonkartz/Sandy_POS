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
    let filtered = products;

    // Filter by category first
    if (selectedCategory && selectedCategory !== "all") {
      console.log("🔍 Filtering by category:", selectedCategory);
      console.log("📊 Total products before filtering:", products.length);
      
      // Show all unique category values in the database
      const uniqueCategories = [...new Set(products.map(p => p.Category))];
      console.log("🗂️ Unique categories in database:", uniqueCategories);
      
      filtered = filtered.filter((product) => {
        // Handle both category ID (number/string) and category name (string)
        const productCategory = product.Category;
        const selectedCategoryId = selectedCategory;
        
        // Skip if product category is null/undefined
        if (!productCategory) {
          console.log(`⚠️ Product ${product.Product} has null/undefined category`);
          return false;
        }
        
        // Debug logging
        console.log(`Product: ${product.Product}, Category: "${productCategory}" (${typeof productCategory}), Selected: "${selectedCategoryId}" (${typeof selectedCategoryId})`);
        
        // Check if it matches the category ID directly
        if (productCategory === selectedCategoryId || 
            String(productCategory) === selectedCategoryId ||
            Number(productCategory) === Number(selectedCategoryId)) {
          console.log("✅ Match found by ID");
          return true;
        }
        
        // Check if it matches the category name
        const categoryName = getCategoryName(selectedCategoryId);
        console.log(`Checking category name: "${categoryName}"`);
        if (productCategory === categoryName) {
          console.log("✅ Match found by name");
          return true;
        }
        
        // Additional debug: show what we're comparing
        console.log(`❌ No match: "${productCategory}" !== "${selectedCategoryId}" and "${productCategory}" !== "${categoryName}"`);
        
        return false;
      });
      
      console.log("📊 Products after filtering:", filtered.length);
    }

    // Then filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      console.log("🔍 Searching for:", searchLower);
      filtered = filtered.filter(
        (product) => {
          const matches = 
            (product.Product && String(product.Product).toLowerCase().includes(searchLower)) ||
            (product.Product_CH && String(product.Product_CH).toLowerCase().includes(searchLower)) ||
            (product["Item Code"] && String(product["Item Code"]).toLowerCase().includes(searchLower)) ||
            (product.Category && String(product.Category).toLowerCase().includes(searchLower));
          
          if (matches) {
            console.log(`✅ Search match found in product: ${product.Product}`);
          }
          
          return matches;
        }
      );
      console.log("📊 Products after search filtering:", filtered.length);
    }

    return filtered;
  }, [products, selectedCategory, searchTerm]);

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
      console.log("=== FETCH PRODUCTS START ===");
      console.log("Fetching products with selectedCategory:", selectedCategory);

      // Check if Supabase environment variables are configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.log("❌ Supabase environment variables not configured");
        console.log("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅ Set" : "❌ Missing");
        console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseKey ? "✅ Set" : "❌ Missing");
        console.log("Please set up your Supabase environment variables in .env.local");
        setError("Supabase environment variables not configured. Please set up .env.local file.");
        setLoading(false);
        return;
      }

      console.log("✅ Supabase environment variables configured");
      console.log("🔄 Fetching products from Supabase...");

      let query = supabase.from("products").select("*");

      if (selectedCategory !== "all") {
        query = query.eq("Category", selectedCategory);
      }

      const { data: productsData, error: productsError } = await query;

      if (productsError) {
        console.error("❌ Error fetching products:", productsError);
        throw productsError;
      }

      console.log("✅ Products fetched from Supabase:", productsData?.length || 0);
      setProducts(productsData || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      console.log("Using mock data as fallback due to error...");
      
      // Use mock data when database fails
      const mockProducts = [
        // Dried Seafood (Category ID: 6)
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
          image_url: "/Img/Dried Seafood/Dried Anchovy.png"
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
          price: 22.50,
          uom: "kg",
          stock_quantity: 30,
          image_url: "/Img/Dried Seafood/Dried Shrimp.png"
        },
        {
          id: 3,
          "Item Code": "DS003",
          Product: "Dried Squid",
          Category: "6",
          weight: "400g",
          UOM: "kg",
          Country: "Japan",
          Product_CH: "乾魷魚",
          Category_CH: "乾海產",
          Country_CH: "日本",
          Variation: "Medium",
          Variation_CH: "中號",
          price: 28.99,
          uom: "kg",
          stock_quantity: 25,
          image_url: "/Img/Dried Seafood/Dried Squid.png"
        },
        {
          id: 4,
          "Item Code": "DS004",
          Product: "Dried Silverfish",
          Category: "6",
          weight: "250g",
          UOM: "kg",
          Country: "Malaysia",
          Product_CH: "乾銀魚",
          Category_CH: "乾海產",
          Country_CH: "馬來西亞",
          Variation: "Small",
          Variation_CH: "小號",
          price: 18.50,
          uom: "kg",
          stock_quantity: 40,
          image_url: "/Img/Dried Seafood/Dried Silverfish.png"
        },
        // Dried Chilli (Category ID: 1) - 20+ products
        {
          id: 5,
          "Item Code": "DC001",
          Product: "Dried Red Chilli",
          Category: "1",
          weight: "200g",
          UOM: "kg",
          Country: "China",
          Product_CH: "乾紅辣椒",
          Category_CH: "乾辣椒",
          Country_CH: "中國",
          Variation: "Hot",
          Variation_CH: "辣",
          price: 8.99,
          uom: "kg",
          stock_quantity: 100,
          image_url: "/product-placeholder.png"
        },
        {
          id: 6,
          "Item Code": "DC002",
          Product: "Dried Bird's Eye Chilli",
          Category: "1",
          weight: "150g",
          UOM: "kg",
          Country: "Thailand",
          Product_CH: "乾指天椒",
          Category_CH: "乾辣椒",
          Country_CH: "泰國",
          Variation: "Extra Hot",
          Variation_CH: "超辣",
          price: 12.99,
          uom: "kg",
          stock_quantity: 75,
          image_url: "/product-placeholder.png"
        },
        {
          id: 13,
          "Item Code": "DC003",
          Product: "Dried Green Chilli",
          Category: "1",
          weight: "250g",
          UOM: "kg",
          Country: "India",
          Product_CH: "乾青辣椒",
          Category_CH: "乾辣椒",
          Country_CH: "印度",
          Variation: "Medium",
          Variation_CH: "中辣",
          price: 9.50,
          uom: "kg",
          stock_quantity: 80,
          image_url: "/product-placeholder.png"
        },
        {
          id: 14,
          "Item Code": "DC004",
          Product: "Dried Jalapeño",
          Category: "1",
          weight: "300g",
          UOM: "kg",
          Country: "Mexico",
          Product_CH: "乾墨西哥辣椒",
          Category_CH: "乾辣椒",
          Country_CH: "墨西哥",
          Variation: "Mild",
          Variation_CH: "微辣",
          price: 11.99,
          uom: "kg",
          stock_quantity: 60,
          image_url: "/product-placeholder.png"
        },
        {
          id: 15,
          "Item Code": "DC005",
          Product: "Dried Habanero",
          Category: "1",
          weight: "100g",
          UOM: "kg",
          Country: "Caribbean",
          Product_CH: "乾哈瓦那辣椒",
          Category_CH: "乾辣椒",
          Country_CH: "加勒比海",
          Variation: "Very Hot",
          Variation_CH: "很辣",
          price: 15.99,
          uom: "kg",
          stock_quantity: 40,
          image_url: "/product-placeholder.png"
        },
        {
          id: 16,
          "Item Code": "DC006",
          Product: "Dried Cayenne Pepper",
          Category: "1",
          weight: "180g",
          UOM: "kg",
          Country: "Africa",
          Product_CH: "乾卡宴辣椒",
          Category_CH: "乾辣椒",
          Country_CH: "非洲",
          Variation: "Hot",
          Variation_CH: "辣",
          price: 10.50,
          uom: "kg",
          stock_quantity: 70,
          image_url: "/product-placeholder.png"
        },
        {
          id: 17,
          "Item Code": "DC007",
          Product: "Dried Serrano Chilli",
          Category: "1",
          weight: "220g",
          UOM: "kg",
          Country: "Mexico",
          Product_CH: "乾塞拉諾辣椒",
          Category_CH: "乾辣椒",
          Country_CH: "墨西哥",
          Variation: "Hot",
          Variation_CH: "辣",
          price: 9.99,
          uom: "kg",
          stock_quantity: 55,
          image_url: "/product-placeholder.png"
        },
        {
          id: 18,
          "Item Code": "DC008",
          Product: "Dried Thai Chilli",
          Category: "1",
          weight: "120g",
          UOM: "kg",
          Country: "Thailand",
          Product_CH: "乾泰式辣椒",
          Category_CH: "乾辣椒",
          Country_CH: "泰國",
          Variation: "Very Hot",
          Variation_CH: "很辣",
          price: 13.50,
          uom: "kg",
          stock_quantity: 65,
          image_url: "/product-placeholder.png"
        },
        {
          id: 19,
          "Item Code": "DC009",
          Product: "Dried Chipotle",
          Category: "1",
          weight: "160g",
          UOM: "kg",
          Country: "Mexico",
          Product_CH: "乾奇波雷辣椒",
          Category_CH: "乾辣椒",
          Country_CH: "墨西哥",
          Variation: "Smoky Hot",
          Variation_CH: "煙熏辣",
          price: 14.99,
          uom: "kg",
          stock_quantity: 45,
          image_url: "/product-placeholder.png"
        },
        {
          id: 20,
          "Item Code": "DC010",
          Product: "Dried Ancho Chilli",
          Category: "1",
          weight: "200g",
          UOM: "kg",
          Country: "Mexico",
          Product_CH: "乾安喬辣椒",
          Category_CH: "乾辣椒",
          Country_CH: "墨西哥",
          Variation: "Mild",
          Variation_CH: "微辣",
          price: 11.25,
          uom: "kg",
          stock_quantity: 50,
          image_url: "/product-placeholder.png"
        },
        {
          id: 21,
          "Item Code": "DC011",
          Product: "Dried Guajillo Chilli",
          Category: "1",
          weight: "170g",
          UOM: "kg",
          Country: "Mexico",
          Product_CH: "乾瓜希洛辣椒",
          Category_CH: "乾辣椒",
          Country_CH: "墨西哥",
          Variation: "Medium",
          Variation_CH: "中辣",
          price: 10.75,
          uom: "kg",
          stock_quantity: 60,
          image_url: "/product-placeholder.png"
        },
        {
          id: 22,
          "Item Code": "DC012",
          Product: "Dried Pasilla Chilli",
          Category: "1",
          weight: "190g",
          UOM: "kg",
          Country: "Mexico",
          Product_CH: "乾帕西拉辣椒",
          Category_CH: "乾辣椒",
          Country_CH: "墨西哥",
          Variation: "Mild",
          Variation_CH: "微辣",
          price: 12.50,
          uom: "kg",
          stock_quantity: 35,
          image_url: "/product-placeholder.png"
        },
        {
          id: 23,
          "Item Code": "DC013",
          Product: "Dried Mulato Chilli",
          Category: "1",
          weight: "210g",
          UOM: "kg",
          Country: "Mexico",
          Product_CH: "乾穆拉托辣椒",
          Category_CH: "乾辣椒",
          Country_CH: "墨西哥",
          Variation: "Mild",
          Variation_CH: "微辣",
          price: 13.25,
          uom: "kg",
          stock_quantity: 30,
          image_url: "/product-placeholder.png"
        },
        {
          id: 24,
          "Item Code": "DC014",
          Product: "Dried New Mexico Chilli",
          Category: "1",
          weight: "240g",
          UOM: "kg",
          Country: "USA",
          Product_CH: "乾新墨西哥辣椒",
          Category_CH: "乾辣椒",
          Country_CH: "美國",
          Variation: "Medium",
          Variation_CH: "中辣",
          price: 9.75,
          uom: "kg",
          stock_quantity: 55,
          image_url: "/product-placeholder.png"
        },
        {
          id: 25,
          "Item Code": "DC015",
          Product: "Dried Poblano Chilli",
          Category: "1",
          weight: "280g",
          UOM: "kg",
          Country: "Mexico",
          Product_CH: "乾波布拉諾辣椒",
          Category_CH: "乾辣椒",
          Country_CH: "墨西哥",
          Variation: "Mild",
          Variation_CH: "微辣",
          price: 8.50,
          uom: "kg",
          stock_quantity: 70,
          image_url: "/product-placeholder.png"
        },
        {
          id: 26,
          "Item Code": "DC016",
          Product: "Dried Scotch Bonnet",
          Category: "1",
          weight: "110g",
          UOM: "kg",
          Country: "Jamaica",
          Product_CH: "乾蘇格蘭帽辣椒",
          Category_CH: "乾辣椒",
          Country_CH: "牙買加",
          Variation: "Very Hot",
          Variation_CH: "很辣",
          price: 16.99,
          uom: "kg",
          stock_quantity: 25,
          image_url: "/product-placeholder.png"
        },
        {
          id: 27,
          "Item Code": "DC017",
          Product: "Dried Ghost Pepper",
          Category: "1",
          weight: "80g",
          UOM: "kg",
          Country: "India",
          Product_CH: "乾鬼椒",
          Category_CH: "乾辣椒",
          Country_CH: "印度",
          Variation: "Extreme Hot",
          Variation_CH: "極辣",
          price: 24.99,
          uom: "kg",
          stock_quantity: 15,
          image_url: "/product-placeholder.png"
        },
        {
          id: 28,
          "Item Code": "DC018",
          Product: "Dried Carolina Reaper",
          Category: "1",
          weight: "70g",
          UOM: "kg",
          Country: "USA",
          Product_CH: "乾卡羅來納死神椒",
          Category_CH: "乾辣椒",
          Country_CH: "美國",
          Variation: "Extreme Hot",
          Variation_CH: "極辣",
          price: 29.99,
          uom: "kg",
          stock_quantity: 10,
          image_url: "/product-placeholder.png"
        },
        {
          id: 29,
          "Item Code": "DC019",
          Product: "Dried Trinidad Scorpion",
          Category: "1",
          weight: "90g",
          UOM: "kg",
          Country: "Trinidad",
          Product_CH: "乾千里達毒蠍椒",
          Category_CH: "乾辣椒",
          Country_CH: "千里達",
          Variation: "Extreme Hot",
          Variation_CH: "極辣",
          price: 27.50,
          uom: "kg",
          stock_quantity: 12,
          image_url: "/product-placeholder.png"
        },
        {
          id: 30,
          "Item Code": "DC020",
          Product: "Dried Korean Gochugaru",
          Category: "1",
          weight: "300g",
          UOM: "kg",
          Country: "Korea",
          Product_CH: "乾韓國辣椒粉",
          Category_CH: "乾辣椒",
          Country_CH: "韓國",
          Variation: "Medium",
          Variation_CH: "中辣",
          price: 7.99,
          uom: "kg",
          stock_quantity: 90,
          image_url: "/product-placeholder.png"
        },
        {
          id: 31,
          "Item Code": "DC021",
          Product: "Dried Sichuan Peppercorn",
          Category: "1",
          weight: "150g",
          UOM: "kg",
          Country: "China",
          Product_CH: "乾四川花椒",
          Category_CH: "乾辣椒",
          Country_CH: "中國",
          Variation: "Numbing",
          Variation_CH: "麻",
          price: 18.99,
          uom: "kg",
          stock_quantity: 40,
          image_url: "/product-placeholder.png"
        },
        {
          id: 32,
          "Item Code": "DC022",
          Product: "Dried Aleppo Pepper",
          Category: "1",
          weight: "200g",
          UOM: "kg",
          Country: "Syria",
          Product_CH: "乾阿勒頗辣椒",
          Category_CH: "乾辣椒",
          Country_CH: "敘利亞",
          Variation: "Medium",
          Variation_CH: "中辣",
          price: 14.50,
          uom: "kg",
          stock_quantity: 35,
          image_url: "/product-placeholder.png"
        },
        {
          id: 33,
          "Item Code": "DC023",
          Product: "Dried Urfa Biber",
          Category: "1",
          weight: "180g",
          UOM: "kg",
          Country: "Turkey",
          Product_CH: "乾烏爾法辣椒",
          Category_CH: "乾辣椒",
          Country_CH: "土耳其",
          Variation: "Smoky",
          Variation_CH: "煙熏",
          price: 16.75,
          uom: "kg",
          stock_quantity: 28,
          image_url: "/product-placeholder.png"
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
          image_url: "/product-placeholder.png"
        },
        // Beans & Legumes (Category ID: 2)
        {
          id: 7,
          "Item Code": "BL001",
          Product: "Dried Mung Beans",
          Category: "2",
          weight: "500g",
          UOM: "kg",
          Country: "China",
          Product_CH: "乾綠豆",
          Category_CH: "豆類",
          Country_CH: "中國",
          Variation: "Premium",
          Variation_CH: "優質",
          price: 6.99,
          uom: "kg",
          stock_quantity: 80,
          image_url: "/product-placeholder.png"
        },
        {
          id: 8,
          "Item Code": "BL002",
          Product: "Dried Red Beans",
          Category: "2",
          weight: "400g",
          UOM: "kg",
          Country: "Thailand",
          Product_CH: "乾紅豆",
          Category_CH: "豆類",
          Country_CH: "泰國",
          Variation: "Large",
          Variation_CH: "大號",
          price: 7.50,
          uom: "kg",
          stock_quantity: 65,
          image_url: "/product-placeholder.png"
        },
        // Nuts & Seeds (Category ID: 3)
        {
          id: 9,
          "Item Code": "NS001",
          Product: "Cashew Nuts",
          Category: "3",
          weight: "500g",
          UOM: "kg",
          Country: "Vietnam",
          Product_CH: "腰果",
          Category_CH: "堅果種子",
          Country_CH: "越南",
          Variation: "Roasted",
          Variation_CH: "烤",
          price: 24.99,
          uom: "kg",
          stock_quantity: 35,
          image_url: "/product-placeholder.png"
        },
        {
          id: 10,
          "Item Code": "NS002",
          Product: "Almonds",
          Category: "3",
          weight: "400g",
          UOM: "kg",
          Country: "USA",
          Product_CH: "杏仁",
          Category_CH: "堅果種子",
          Country_CH: "美國",
          Variation: "Raw",
          Variation_CH: "生",
          price: 32.99,
          uom: "kg",
          stock_quantity: 20,
          image_url: "/product-placeholder.png"
        },
        // Grains (Category ID: 5)
        {
          id: 11,
          "Item Code": "GR001",
          Product: "Jasmine Rice",
          Category: "5",
          weight: "1kg",
          UOM: "kg",
          Country: "Thailand",
          Product_CH: "茉莉香米",
          Category_CH: "穀物",
          Country_CH: "泰國",
          Variation: "Premium",
          Variation_CH: "優質",
          price: 6.99,
          uom: "kg",
          stock_quantity: 80,
          image_url: "/product-placeholder.png"
        },
        {
          id: 12,
          "Item Code": "GR002",
          Product: "Black Rice",
          Category: "5",
          weight: "500g",
          UOM: "kg",
          Country: "China",
          Product_CH: "黑米",
          Category_CH: "穀物",
          Country_CH: "中國",
          Variation: "Organic",
          Variation_CH: "有機",
          price: 9.99,
          uom: "kg",
          stock_quantity: 55,
          image_url: "/product-placeholder.png"
        }
      ];
      
      setProducts(mockProducts);
      console.log("✅ Mock products loaded (skipping database queries):", mockProducts.length);
      return;
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
    const loadProducts = async () => {
      try {
        console.log("Starting products load with session:", !!session);
        await fetchProducts();
      } catch (error) {
        console.error("Error loading products:", error);
      setLoading(false);
      }
    };
    
    loadProducts();
  }, [selectedCategory]); // Only depend on selectedCategory, not session or fetchProducts

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

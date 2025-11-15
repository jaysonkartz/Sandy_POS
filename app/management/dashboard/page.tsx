"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
//import PricingManagement from "@/components/PricingManagement";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { supabase } from "@/app/lib/supabaseClient";
import EditUserModal from "@/components/EditUserModal";
import CustomerManagement from "@/components/CustomerManagement";
import { CATEGORY_ID_NAME_MAP } from "@/app/(admin)/const/category";
//import ProductListTable from "@/components/ProductListTable";
import React from "react";
import { useRouter } from "next/navigation";
import QuickSignInCheck from "@/app/components/QuickSignInCheck";
import SignInStats from "@/app/components/SignInStats";
import VariantManager from "@/components/VariantManager";
import VariantExtractor from "@/components/VariantExtractor";
import { ProductVariant } from "@/app/types/product";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardSection {
  id: string;
  title: string;
  icon: JSX.Element;
  description: string;
}

interface User {
  id: string;
  email: string;
  role: string;
  avatar_url: string;
  created_at: string;
  name?: string; // Customer name from customers table
}

interface Product {
  id: number;
  Product: string;
  price: number;
  Category: string;
  "Item Code"?: string;
  Variation?: string;
  UOM?: string;
  Country?: string;
  countryName?: string;
  variants?: ProductVariant[];
  priceHistory?: {
    previous_price: number;
    last_price_update: string;
  }[];
  order_items?: {
    order_id: number;
    price?: number;
    orders?: {
      customer_name: string;
      customer_phone: string;
      customer_id?: string;
    }[];
  }[];
}

interface Category {
  id: string;
  name: string;
  chineseName?: string;
  products: Product[];
}

interface OrderDetail {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  status: string;
}

export default function ManagementDashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Number of orders per page
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const usersPerPage = 10;
  const [totalUsers, setTotalUsers] = useState(0);
  const [editingCustomer, setEditingCustomer] = useState<{
    orderItemId: number;
    price: number;
  } | null>(null);
  const [newCustomerPrice, setNewCustomerPrice] = useState<number | null>(null);
  // Track offer prices for each customer-product combination
  const [offerPrices, setOfferPrices] = useState<{
    [key: string]: number | null;
  }>({});
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [topSellingProductsByQuantity, setTopSellingProductsByQuantity] = useState<Array<{
    category: string;
    product: string;
    variation: string;
    quantity: number;
  }>>([]);
  const [topSellingProductsByPrice, setTopSellingProductsByPrice] = useState<Array<{
    product: string;
    variation: string;
    value: number;
  }>>([]);
  const [isLoadingTopProducts, setIsLoadingTopProducts] = useState(true);
  const [selectedMonthQuantity, setSelectedMonthQuantity] = useState<string>(() => {
    const currentMonth = new Date().toLocaleString("default", { month: "long" });
    const currentYear = new Date().getFullYear();
    return `${currentMonth} ${currentYear}`;
  });
  const [selectedMonthPrice, setSelectedMonthPrice] = useState<string>(() => {
    const currentMonth = new Date().toLocaleString("default", { month: "long" });
    const currentYear = new Date().getFullYear();
    return `${currentMonth} ${currentYear}`;
  });
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [monthYearMap, setMonthYearMap] = useState<Map<string, number>>(new Map());
  const [countryMap, setCountryMap] = useState<{ [key: string]: { name: string; chineseName?: string } }>({});
  const [recentOrders, setRecentOrders] = useState<
    Array<{
      id: number;
      created_at: string;
      customer_name: string;
      customer_phone: string;
      total_amount: number;
      status: string;
    }>
  >([]);
  const [isLoadingRecentOrders, setIsLoadingRecentOrders] = useState(true);
  const [showVariantManager, setShowVariantManager] = useState<number | null>(null);
  const [useNewVariantSystem, setUseNewVariantSystem] = useState(false);

  const priceHistoryMap: Record<number, { previous_price: number; last_price_update: string }[]> =
    {};

  // Clear all offer prices
  const clearOfferPrices = () => {
    setOfferPrices({});
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Clear offer prices when switching products
  useEffect(() => {
    clearOfferPrices();
  }, [selectedProduct]);

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const from = (page - 1) * usersPerPage;
      const to = from + usersPerPage - 1;

      // Fetch users with pagination
      const { data: usersData, error: usersError, count } = await supabase
        .from("users")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (usersError) throw usersError;

      // Fetch customers to get names
      const { data: customersData } = await supabase
        .from("customers")
        .select("user_id, name");

      // Create a map of user_id to customer name
      const customerNameMap = new Map<string, string>();
      if (customersData) {
        customersData.forEach((customer: { user_id?: string; name?: string }) => {
          if (customer.user_id && customer.name) {
            customerNameMap.set(customer.user_id, customer.name);
          }
        });
      }

      // Combine user data with customer names
      const usersWithNames = (usersData || []).map((user: User) => ({
        ...user,
        name: customerNameMap.get(user.id) || user.email?.split("@")[0] || "Unknown",
      }));

      setUsers(usersWithNames);
      setTotalUsers(count || 0);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "users") {
      fetchUsers(currentUserPage);
    }
  }, [activeSection, currentUserPage]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      // First, fetch countries to create a mapping (optional, don't fail if this errors)
      let countryMapping: { [key: string]: { name: string; chineseName?: string } } = {};
      try {
        const { data: countriesData } = await supabase
          .from("countries")
          .select("id, country, chineseName");
        
        if (countriesData && countriesData.length > 0) {
          countriesData.forEach((country: any) => {
            // Map country ID to country name (country is the column name in countries table)
            if (country.id != null && country.country) {
              const idKey = String(country.id);
              countryMapping[idKey] = {
                name: country.country,
                chineseName: country.chineseName || undefined,
              };
            }
          });
          setCountryMap(countryMapping);
          console.log("Country mapping created with", Object.keys(countryMapping).length, "countries:", countryMapping);
        } else {
          console.warn("No countries data received or empty array");
        }
      } catch (countriesError) {
        console.warn("Failed to fetch countries, continuing without country names:", countriesError);
      }

      const { data: products, error } = await supabase
        .from("products")
        .select(
          `
          id,
          Product,
          price,
          Category,
          "Item Code",
          Variation,
          UOM,
          Country,
          order_items (
            order_id,
            price,
            orders (
              customer_name,
              customer_phone,
              customer_id
            )
          )
        `
        )
        .order("Category", { ascending: true });

      if (error) {
        console.error("Error fetching products:", error);
        throw error;
      }
      const { data: priceHistories, error: priceHistoryError } = await supabase
        .from("product_price_history")
        .select("product_id, previous_price, original_price, last_price_update")
        .is("customer_id", null) // Only fetch global price changes (not customer-specific)
        .order("last_price_update", { ascending: false });

      if (priceHistoryError) {
        console.error("Failed to fetch price history:", priceHistoryError);
      } else {
        console.log("Successfully fetched price history. Total entries:", priceHistories?.length || 0);
      }

      // Group price histories by product_id
      // Ensure product_id is converted to number for consistent key matching
      // Store with both number and string keys to handle any type mismatches
      const priceHistoryMap: { [key: number | string]: any[] } = {};
      (priceHistories || []).forEach((ph: any) => {
        const productId = Number(ph.product_id);
        const productIdStr = String(ph.product_id);
        if (!isNaN(productId)) {
          // Store with both number and string keys for flexibility (same array reference)
          if (!priceHistoryMap[productId]) {
            priceHistoryMap[productId] = [];
            priceHistoryMap[productIdStr] = priceHistoryMap[productId]; // Same array reference
          }
          priceHistoryMap[productId].push(ph);
        }
      });
      
      // Debug: Log price history mapping
      const uniqueHistoryProductIds = (priceHistories || []).map(ph => ph.product_id).filter((v, i, a) => a.indexOf(v) === i);
      console.log("=== PRICE HISTORY DEBUG ===");
      console.log("Price history map:", priceHistoryMap);
      console.log("Products with price history:", Object.keys(priceHistoryMap).length);
      console.log("Price history product IDs (unique):", uniqueHistoryProductIds);
      console.log("Total price history entries:", priceHistories?.length || 0);

      // Fetch variants for each product (store uniqueHistoryProductIds for later use)
      const historyProductIds = uniqueHistoryProductIds;
      const productsWithVariants = await Promise.all(
        (products || []).map(async (product: any) => {
          // Fetch variants, but don't fail if table doesn't exist or returns 404
          let variantsData = [];
          try {
            const { data, error } = await supabase
              .from('product_variants')
              .select('*')
              .eq('product_id', product.id)
              .order('created_at', { ascending: true });
            
            if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist"
              console.warn(`Error fetching variants for product ${product.id}:`, error);
            } else {
              variantsData = data || [];
            }
          } catch (err) {
            // Silently handle 404 or other errors for variants
            console.warn(`Failed to fetch variants for product ${product.id}:`, err);
            variantsData = [];
          }

          // Resolve country name from the mapping
          const countryId = product.Country != null ? String(product.Country) : null;
          const countryInfo = countryId ? countryMapping[countryId] : null;
          const countryName = countryInfo?.name || null;
          
          // Debug logging for country resolution
          if (product.Country && !countryName) {
            console.warn(`Country ID ${product.Country} not found in countryMap for product ${product.id} (${product.Product})`);
          }

          // Ensure product.id is a number when accessing priceHistoryMap
          // Try both string and number keys to handle any type mismatches
          const productId = Number(product.id);
          const productIdStr = String(product.id);
          
          // Try multiple ways to match
          let history = priceHistoryMap[productId] || 
                       priceHistoryMap[productIdStr] || 
                       priceHistoryMap[String(productId)] ||
                       priceHistoryMap[Number(productIdStr)] ||
                       [];
          
          // Additional debug: Log first few products' matching attempts
          if (product.id === (products || [])[0]?.id || product.id === (products || [])[1]?.id) {
            console.log(`[Price History Debug] Product ID: ${product.id} (type: ${typeof product.id}), Number: ${productId}, String: ${productIdStr}`);
            console.log(`[Price History Debug] Trying keys:`, [productId, productIdStr, String(productId), Number(productIdStr)]);
            console.log(`[Price History Debug] Available keys in map:`, Object.keys(priceHistoryMap).slice(0, 10));
            console.log(`[Price History Debug] Direct lookup [${productId}]:`, priceHistoryMap[productId]);
            console.log(`[Price History Debug] Direct lookup ["${productIdStr}"]:`, priceHistoryMap[productIdStr]);
            console.log(`[Price History Debug] History found:`, history.length > 0 ? `${history.length} entries` : 'NONE');
          }
          
          // Debug: Log if product has no price history (only for first few to avoid spam)
          if (history.length === 0 && productId && product.id <= 5) {
            console.log(`No price history found for product ${product.id} (${product.Product}). Available product IDs in history:`, Object.keys(priceHistoryMap).map(Number));
          }

          return {
            ...product,
            countryName: countryName, // Add resolved country name
            variants: variantsData || [],
            priceHistory: history.slice(0, 3),
          };
        })
      );

      // Debug: Log product IDs being displayed
      const displayedProductIds = (productsWithVariants || []).map(p => p.id);
      console.log("=== PRODUCTS DEBUG ===");
      console.log("Product IDs being displayed:", displayedProductIds);
      console.log("Total products:", displayedProductIds.length);
      
      // Check for matches
      const matchingIds = displayedProductIds.filter(id => historyProductIds.includes(Number(id)) || historyProductIds.includes(String(id)));
      console.log("Matching product IDs (have history):", matchingIds);
      console.log("Non-matching product IDs (no history):", displayedProductIds.filter(id => !matchingIds.includes(id)));
      
      console.log("Sample product with history check:", productsWithVariants[0] ? {
        id: productsWithVariants[0].id,
        name: productsWithVariants[0].Product,
        hasHistory: (productsWithVariants[0].priceHistory || []).length > 0,
        historyCount: (productsWithVariants[0].priceHistory || []).length,
        priceHistory: productsWithVariants[0].priceHistory
      } : 'No products');
      console.log("=== END DEBUG ===");

      // Group products by category
      const categoryGroups: { [key: string]: Product[] } = {};
      productsWithVariants.forEach((product: any) => {
        // Get category name from ID, fallback to ID if not found
        const categoryId = product.Category;
        const categoryName = CATEGORY_ID_NAME_MAP[categoryId] || categoryId || "Uncategorized";

        if (!categoryGroups[categoryName]) {
          categoryGroups[categoryName] = [];
        }
        categoryGroups[categoryName].push(product);
      });

      // Convert to array format
      const categoriesArray = Object.entries(categoryGroups).map(([name, products]) => ({
        id: name,
        name: name,
        products: products.sort((a: Product, b: Product) => a.Product.localeCompare(b.Product)),
      }));

      setCategories(categoriesArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch categories");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentOrders = async () => {
    setIsLoadingRecentOrders(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, customer_name, customer_phone, total_amount, status")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching recent orders:", error);
        throw error;
      }
      
      setRecentOrders(data || []);
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      setRecentOrders([]);
    } finally {
      setIsLoadingRecentOrders(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchTopSellingProducts(undefined, "quantity");
    fetchTopSellingProducts(undefined, "price");
    fetchRecentOrders();
  }, []);

  const checkDatabaseTables = async () => {
    console.log("Checking database tables...");

    // Check orders table
    const { data: orders, error: ordersError } = await supabase.from("orders").select("*");
    console.log("Orders table:", { orders, ordersError });

    // Check order_items table
    const { data: items, error: itemsError } = await supabase.from("order_items").select("*");
    console.log("Order items table:", { items, itemsError });
  };

  const fetchTopSellingProducts = async (month?: string, type?: string) => {
    setIsLoadingTopProducts(true);
    // Check tables first
    await checkDatabaseTables();
    try {
      console.log("fetchTopSellingProducts called with month:", month);

      // First, get all available months from orders (include all statuses for month detection)
      // Try to get any orders without filters first
      const { data: allOrders, error: monthsError } = await supabase.from("orders").select("*");

      console.log("Checking raw orders:", allOrders);

      console.log("All orders fetched:", { allOrders, monthsError });

      if (monthsError) throw monthsError;

      // Generate all months for the current year
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const monthYearMap = new Map<string, number>();
      const monthYearArray: Array<{ month: string; year: number; date: Date }> = [];

      // Add all months of the current year
      for (let month = 0; month < 12; month++) {
        const date = new Date(currentYear, month, 1);
        const monthName = date.toLocaleString("default", { month: "long" });
        const key = `${monthName} ${currentYear}`;

        monthYearMap.set(key, currentYear);
        monthYearArray.push({ month: monthName, year: currentYear, date });
      }

      // Sort by date (most recent first)
      monthYearArray.sort((a, b) => b.date.getTime() - a.date.getTime());

      const monthsArray = monthYearArray.map((item) => `${item.month} ${item.year}`);
      setAvailableMonths(monthsArray);
      setMonthYearMap(monthYearMap);

      // If no month specified, use the current month
      const currentMonth = new Date().toLocaleString("default", { month: "long" });
      const currentMonthYear = `${currentMonth} ${currentYear}`;
      
      const targetMonth = month || currentMonthYear;
      if (type === "quantity") {
        setSelectedMonthQuantity(targetMonth);
      } else {
        setSelectedMonthPrice(targetMonth);
      }

      // Parse the selected month to get month name and year
      let monthName, targetYear;
      if (targetMonth.includes(" ")) {
        // Format: "Month Year" (e.g., "December 2024")
        const parts = targetMonth.split(" ");
        monthName = parts[0];
        targetYear = parseInt(parts[1]);
      } else {
        // Format: "Month" only - use current year
        monthName = targetMonth;
        targetYear = new Date().getFullYear();
      }

      const monthNumber = new Date(`${monthName} 1, ${targetYear}`).getMonth() + 1;

      // Fetch order items filtered by month and year
      const startDate = new Date(targetYear, monthNumber - 1, 1).toISOString();
      const endDate = new Date(targetYear, monthNumber, 0, 23, 59, 59).toISOString();

      console.log("Month detection debug:", {
        allOrdersCount: allOrders?.length,
        monthYearMap: Object.fromEntries(monthYearMap),
        monthsArray,
        targetMonth,
        monthName,
        targetYear,
        monthNumber,
        startDate,
        endDate,
      });

      console.log("Fetching data for date range:", { startDate, endDate });

      // Try the filtered query first
      let { data: orderItems, error } = await supabase.from("order_items").select(
        `
          id,
          order_id,
          product_id,
          quantity,
          price,
          total_price,
          product_name,
          product_code,
          created_at
        `
      ).gte('created_at', startDate).lte('created_at', endDate);

      // If no results or error, try without date filtering to see if there's data
      if (!orderItems || orderItems.length === 0 || error) {
        console.log("No filtered results, trying without date filter...");
        const { data: allOrderItems, error: allError } = await supabase.from("order_items").select(
          `
            id,
            order_id,
            product_id,
            quantity,
            price,
            total_price,
            product_name,
            product_code,
            created_at
          `
        );
        
        if (!error && allOrderItems) {
          console.log("Found data without date filter, filtering manually...");
          // Filter manually by date
          orderItems = allOrderItems.filter((item: any) => {
            const itemDate = new Date(item.created_at);
            return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
          });
          error = null;
        } else {
          orderItems = allOrderItems;
          error = allError;
        }
      }

      console.log("Raw order items:", orderItems);
      console.log("Query error:", error);

      if (error) {
        console.error("Database query error:", error);
        throw error;
      }

      console.log("Order items fetched:", {
        orderItemsCount: orderItems?.length,
        orderItems: orderItems?.slice(0, 3), // Show first 3 items for debugging
        startDate,
        endDate,
      });

      // Process data to get top selling products by quantity
      const productQuantityMap = new Map<
        string,
        {
          category: string;
          product: string;
          variation: string;
          quantity: number;
        }
      >();

      const productValueMap = new Map<
        string,
        {
          product: string;
          variation: string;
          value: number;
        }
      >();

      console.log("Processing order items:", orderItems);

      orderItems?.forEach((item: any) => {
        const productName = item.product_name;
        const productCode = item.product_code || "N/A";
        const quantity = item.quantity || 0;
        const totalPrice = item.total_price || 0;

        console.log("Processing item:", { productName, productCode, quantity, totalPrice });

        // Determine category from product name
        let category = "Other";
        if (productName.toLowerCase().includes("chilli")) {
          category = "Chilli";
        }
        // Add more category logic here if needed

        // Group by product name for quantity
        const quantityKey = productName;
        if (productQuantityMap.has(quantityKey)) {
          const existing = productQuantityMap.get(quantityKey)!;
          existing.quantity += quantity;
        } else {
          productQuantityMap.set(quantityKey, {
            category,
            product: productName,
            variation: productCode,
            quantity,
          });
        }

        // Group by product name for value
        const valueKey = productName;
        if (productValueMap.has(valueKey)) {
          const existing = productValueMap.get(valueKey)!;
          existing.value += totalPrice;
        } else {
          productValueMap.set(valueKey, {
            product: productName,
            variation: productCode,
            value: totalPrice,
          });
        }
      });

      // Sort and get top 3 for each category
      const topByQuantity = Array.from(productQuantityMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 3);

      const topByValue = Array.from(productValueMap.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);

      console.log("Processed data:", {
        topByQuantity,
        topByValue,
        productQuantityMap: Object.fromEntries(productQuantityMap),
        productValueMap: Object.fromEntries(productValueMap),
      });

      console.log("Setting top selling products:", { topByQuantity, topByValue });
      
      // Update the appropriate state based on the type
      if (type === "quantity") {
        setTopSellingProductsByQuantity(topByQuantity);
      } else if (type === "price") {
        setTopSellingProductsByPrice(topByValue);
      } else {
        // If no type specified (initial load), update both
        setTopSellingProductsByQuantity(topByQuantity);
        setTopSellingProductsByPrice(topByValue);
      }
    } catch (error) {
      console.error("Error fetching top selling products:", error);
      // Set empty data on error
      if (type === "quantity") {
        setTopSellingProductsByQuantity([]);
      } else if (type === "price") {
        setTopSellingProductsByPrice([]);
      } else {
        // If no type specified (initial load), clear both
        setTopSellingProductsByQuantity([]);
        setTopSellingProductsByPrice([]);
      }
    } finally {
      setIsLoadingTopProducts(false);
    }
  };

  const fetchOrderDetails = async (page = 1) => {
    setIsLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Fetch paginated orders
      const { data, error, count } = await supabase
        .from("orders")
        .select("id, created_at, customer_name, customer_phone, total_amount, status", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setOrderDetails(data || []);
      setTotalOrders(count || 0);
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "history") {
      fetchOrderDetails(currentPage);
    }
  }, [activeSection, currentPage]);

  const sections: DashboardSection[] = [
    {
      id: "overview",
      title: "Overview",
      description: "",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      ),
    },
    {
      id: "pricing",
      title: "Product List",
      description: "",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      ),
    },
    {
      id: "signin-monitoring",
      title: "Sign-in Monitoring",
      description: "",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      ),
    },

    // {
    //   id: "inventory",
    //   title: "Inventory",
    //   description: "Manage your stock",
    //   icon: (
    //     <svg
    //       className="w-6 h-6"
    //       fill="none"
    //       stroke="currentColor"
    //       viewBox="0 0 24 24"
    //     >
    //       <path
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeWidth={2}
    //         d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    //       />
    //     </svg>
    //   ),
    // },
    {
      id: "history",
      title: "History",
      description: "",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      ),
    },
    {
      id: "customers",
      title: "Customers",
      description: "",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      ),
    },
    // {
    //   id: "suppliers",
    //   title: "Suppliers",
    //   description: "Manage your supplier relationships",
    //   icon: (
    //     <svg
    //       className="w-6 h-6"
    //       fill="none"
    //       stroke="currentColor"
    //       viewBox="0 0 24 24"
    //     >
    //       <path
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeWidth={2}
    //         d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    //       />
    //     </svg>
    //   ),
    // },
    {
      id: "users",
      title: "Admin",
      description: "",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      ),
    },
  ];

  const renderOverview = () => {
    const salesData = {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Monthly Sales",
          data: [12, 19, 3, 5, 2, 3],
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };

    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
      >
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { title: "Total Products", value: "150", change: "+12%" },
            { title: "Total Sales", value: "$15,234", change: "+23%" },
            { title: "Active Customers", value: "1,234", change: "+5%" },
            { title: "Suppliers", value: "45", change: "0%" },
            { title: "Pending Orders", value: "23", change: "-2%" },
          ].map((stat, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-gray-500 text-sm">{stat.title}</h3>
              <p className="text-2xl font-bold">{stat.value}</p>
              <span
                className={`text-sm ${
                  stat.change.startsWith("+")
                    ? "text-green-500"
                    : stat.change.startsWith("-")
                      ? "text-red-500"
                      : "text-gray-500"
                }`}
              >
                {stat.change} from last month
              </span>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
            <Bar data={salesData} options={{ responsive: true }} />
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products by Quantity */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Top Selling Products (by Qty)</h3>
              <select
                value={selectedMonthQuantity}
                onChange={(e) => {
                  setSelectedMonthQuantity(e.target.value);
                  fetchTopSellingProducts(e.target.value, "quantity");
                }}
                className="px-3 py-1 pr-8 bg-blue-100 text-blue-600 rounded text-sm font-medium border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-no-repeat bg-right bg-[length:16px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzM3NDE1MSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')]"
              >
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Variation
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantity (unit)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoadingTopProducts ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        Loading top selling products...
                      </td>
                    </tr>
                  ) : topSellingProductsByQuantity.length > 0 ? (
                    topSellingProductsByQuantity.map((product, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.category}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.product}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.variation}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.quantity.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        No sales data available for {selectedMonthQuantity}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Selling Products by Price */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Top Selling Products (by Price)</h3>
              <select
                value={selectedMonthPrice}
                onChange={(e) => {
                  setSelectedMonthPrice(e.target.value);
                  fetchTopSellingProducts(e.target.value, "price");
                }}
                className="px-3 py-1 pr-8 bg-blue-100 text-blue-600 rounded text-sm font-medium border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-no-repeat bg-right bg-[length:16px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzM3NDE1MSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')]"
              >
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Variation
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Value (SGD)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoadingTopProducts ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        Loading top selling products...
                      </td>
                    </tr>
                  ) : topSellingProductsByPrice.length > 0 ? (
                    topSellingProductsByPrice.map((product, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.product}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.variation}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          ${product.value.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        No sales data available for {selectedMonthPrice}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              onClick={fetchRecentOrders}
              disabled={isLoadingRecentOrders}
            >
              {isLoadingRecentOrders ? "Loading..." : "Refresh"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoadingRecentOrders ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Loading recent orders...
                    </td>
                  </tr>
                ) : recentOrders.length > 0 ? (
                  recentOrders.map((order, index) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.customer_name} - ${order.total_amount ? order.total_amount.toFixed(2) : '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : order.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : order.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No recent orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderUsers = () => {
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">User Management</h2>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            onClick={() => fetchUsers(currentUserPage)}
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img alt="" className="h-8 w-8 rounded-full" src={user.avatar_url} />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name || "N/A"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === "ADMIN"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditModalOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => {
                            // Delete user functionality can be implemented here
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination for Users */}
        {!isLoading && users.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentUserPage(prev => Math.max(1, prev - 1))}
                disabled={currentUserPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentUserPage(prev => Math.min(Math.ceil(totalUsers / usersPerPage), prev + 1))}
                disabled={currentUserPage >= Math.ceil(totalUsers / usersPerPage)}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(currentUserPage - 1) * usersPerPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentUserPage * usersPerPage, totalUsers)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{totalUsers}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentUserPage(prev => Math.max(1, prev - 1))}
                    disabled={currentUserPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: Math.ceil(totalUsers / usersPerPage) }, (_, i) => i + 1)
                    .filter(page => {
                      const totalPages = Math.ceil(totalUsers / usersPerPage);
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentUserPage - 1 && page <= currentUserPage + 1) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      const totalPages = Math.ceil(totalUsers / usersPerPage);
                      const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                      const showEllipsisAfter = index < array.length - 1 && array[index + 1] !== page + 1;
                      
                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsisBefore && (
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => setCurrentUserPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentUserPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                          {showEllipsisAfter && (
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                              ...
                            </span>
                          )}
                        </div>
                      );
                    })}
                  <button
                    onClick={() => setCurrentUserPage(prev => Math.min(Math.ceil(totalUsers / usersPerPage), prev + 1))}
                    disabled={currentUserPage >= Math.ceil(totalUsers / usersPerPage)}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Add the EditUserModal */}
        <EditUserModal
          isOpen={isEditModalOpen}
          user={selectedUser}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          onUpdate={() => {
            fetchUsers(currentUserPage);
          }}
        />
      </motion.div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return renderOverview();
      case "pricing":
        return (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Product List</h2>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                onClick={() => fetchCategories()}
              >
                Refresh
              </button>
            </div>

            <div>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              {categories.length === 0 && !error && !isLoading && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                  No categories found.
                </div>
              )}
              {isLoading && (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}

              {!isLoading && categories.length > 0 && (
                <div className="space-y-6">
                  {categories.map((category) => (
                    <div key={category.id} className="bg-white rounded-lg shadow p-4 mb-4">
                      <div
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() =>
                          setExpandedCategory(expandedCategory === category.id ? null : category.id)
                        }
                      >
                        <div>
                          <span className="text-lg font-bold">{category.name}</span>
                          <span className="ml-2 text-gray-500">{category.chineseName}</span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            category.products.length > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {category.products.length > 0
                            ? `${category.products.length} Products`
                            : "No Products"}
                        </span>
                      </div>
                      {expandedCategory === category.id && (
                        <div className="mt-4">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Product Name
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Price
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Previous Prices
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {category.products
                                .sort((a, b) => a.Product.localeCompare(b.Product))
                                .map((product) => {
                                  // Debug: Log first product's price history in render
                                  if (product.id === category.products[0]?.id) {
                                    console.log(`[Render Debug] Product ${product.id} (${product.Product}):`, {
                                      hasPriceHistory: !!product.priceHistory,
                                      priceHistoryLength: product.priceHistory?.length || 0,
                                      priceHistory: product.priceHistory
                                    });
                                  }
                                  return (
                                    <React.Fragment key={product.id}>
                                    <tr>
                                      <td className="px-4 py-2">
                                        <div className="flex items-center space-x-2">
                                          <button
                                            className="text-blue-600 hover:text-blue-800 text-left"
                                            onClick={() =>
                                              setSelectedProduct(
                                                selectedProduct === product.id ? null : product.id
                                              )
                                            }
                                          >
                                            <div className="flex flex-col">
                                              <div className="flex items-center">
                                                <span>{selectedProduct === product.id ? "▼" : "▶"}</span>
                                                <span className="ml-1 font-medium">{product.Product}</span>
                                              </div>
                                              {(product["Item Code"] || product.Variation || product.UOM || product.Country) && (
                                                <div className="ml-5 mt-1 space-y-1">
                                                  <div className="flex flex-wrap items-center gap-2 text-xs">
                                                    {product.Variation && (
                                                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                                                        <span className="mr-1">📦</span>
                                                        {product.Variation}
                                                      </span>
                                                    )}
                                                    {(() => {
                                                      // Use the resolved countryName if available, otherwise try to look it up from state
                                                      const countryName = product.countryName || 
                                                        (product.Country && countryMap[String(product.Country)]?.name);
                                                      
                                                      // Only show if we have a valid country name
                                                      if (countryName) {
                                                        return (
                                                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-50 text-green-700 font-medium">
                                                            <span className="mr-1">🌍</span>
                                                            {countryName}
                                                          </span>
                                                        );
                                                      }
                                                      
                                                      // Don't show anything if country name not found
                                                      return null;
                                                    })()}
                                                    {product["Item Code"] && (
                                                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                                        <span className="mr-1">#</span>
                                                        {product["Item Code"]}
                                                      </span>
                                                    )}
                                                    {product.UOM && (
                                                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                                                        <span className="mr-1">⚖️</span>
                                                        {product.UOM}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </button>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2 flex items-center space-x-2">
                                        {(() => {
                                          const isEditing = editingProductId === product.id;
                                          if (isEditing) {
                                            // Editing mode - no additional logic needed
                                          }
                                          return isEditing;
                                        })() ? (
                                          <>
                                            <input
                                              className="border rounded px-2 py-1 w-20"
                                              type="number"
                                              value={editingPrice ?? product.price}
                                              onChange={(e) =>
                                                setEditingPrice(Number(e.target.value))
                                              }
                                            />
                                            <button
                                              className="text-green-600 font-bold"
                                              title="Save"
                                              onClick={async () => {
                                                if (editingPrice === null || isNaN(editingPrice)) {
                                                  alert("Please enter a valid price.");
                                                  return;
                                                }
                                                setIsLoading(true);

                                                const { data: orderItems, error: orderItemsError } =
                                                  await supabase
                                                    .from("order_items")
                                                    .select("order_id, orders(customer_id)")
                                                    .eq("product_id", product.id);

                                                if (orderItemsError) {
                                                  alert(
                                                    "Failed to fetch order items: " +
                                                      orderItemsError.message
                                                  );
                                                  setIsLoading(false);
                                                  return;
                                                }

                                                const uniqueCustomerIds = [
                                                  ...new Set(
                                                    (orderItems || [])
                                                      .map((oi: any) => {
                                                        const orders = oi.orders as
                                                          | { customer_id?: string }
                                                          | { customer_id?: string }[]
                                                          | undefined;
                                                        if (!orders) return null;
                                                        if (Array.isArray(orders)) {
                                                          return orders[0]?.customer_id ?? null;
                                                        }
                                                        return orders.customer_id ?? null;
                                                      })
                                                      .filter((cid: any) => !!cid)
                                                  ),
                                                ];

                                                // Always create a global price history entry
                                                const { error: globalHistoryError } = await supabase
                                                  .from("product_price_history")
                                                  .insert([
                                                    {
                                                      product_id: product.id,
                                                      previous_price: product.price,
                                                      original_price: editingPrice,
                                                      last_price_update: new Date().toISOString(),
                                                      customer_id: null,
                                                    },
                                                  ]);

                                                if (globalHistoryError) {
                                                  console.error("Failed to insert global price history:", globalHistoryError);
                                                }

                                                // Also create customer-specific entries if there are customers
                                                if (uniqueCustomerIds.length > 0) {
                                                  for (const customerId of uniqueCustomerIds) {
                                                    const { error: insertError } = await supabase
                                                      .from("product_price_history")
                                                      .insert([
                                                        {
                                                          product_id: product.id,
                                                          previous_price: product.price,
                                                          original_price: editingPrice,
                                                          last_price_update:
                                                            new Date().toISOString(),
                                                          customer_id: customerId,
                                                        },
                                                      ]);
                                                    if (insertError) {
                                                      console.error(
                                                        "Failed to insert customer price history: " +
                                                          insertError.message
                                                      );
                                                    }
                                                  }
                                                }

                                                // Now update the product price
                                                const { error: updateError } = await supabase
                                                  .from("products")
                                                  .update({ price: editingPrice })
                                                  .eq("id", product.id);

                                                if (updateError) {
                                                  alert(
                                                    "Failed to update product price: " +
                                                      updateError.message
                                                  );
                                                  setIsLoading(false);
                                                  return;
                                                }

                                                setEditingProductId(null);
                                                setEditingPrice(null);
                                                setIsLoading(false);
                                                fetchCategories();
                                              }}
                                            >
                                              ✔
                                            </button>
                                            <button
                                              className="text-gray-400 font-bold"
                                              title="Cancel"
                                              onClick={() => {
                                                setEditingProductId(null);
                                                setEditingPrice(null);
                                              }}
                                            >
                                              ✖
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            <span>${product.price.toFixed(2)}</span>
                                            <button
                                              className="ml-2 text-blue-600 underline"
                                              title="Edit Price"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // Ensure only one product can be edited at a time
                                                if (editingProductId !== product.id) {
                                                  setEditingProductId(null);
                                                  setEditingPrice(null);
                                                }
                                                setEditingProductId(product.id);
                                                setEditingPrice(product.price);
                                              }}
                                            >
                                              Edit
                                            </button>
                                            {(() => {
                                              // Find all customers for this product
                                              const allCustomers = product.order_items
                                                ?.flatMap((oiRaw) => {
                                                  const oi = oiRaw as {
                                                    price?: number;
                                                    orders?: {
                                                      customer_name: string;
                                                      customer_phone: string;
                                                    }[];
                                                  };
                                                  return Array.isArray(oi.orders)
                                                    ? oi.orders
                                                    : oi.orders
                                                      ? [oi.orders]
                                                      : [];
                                                })
                                                .filter((order) => order.customer_phone);
                                              const hasCustomers =
                                                allCustomers && allCustomers.length > 0;
                                              const waText = hasCustomers
                                                ? allCustomers
                                                    .map(
                                                      (order) =>
                                                        `Hi ${order.customer_name}, the price for ${product.Product} has changed. Please check the latest update!`
                                                    )
                                                    .join("%0A")
                                                : "";
                                              return (
                                                <a
                                                  aria-disabled={!hasCustomers}
                                                  className={`inline-flex items-center px-2 py-1 ${
                                                    hasCustomers
                                                      ? "bg-green-500 hover:bg-green-600 cursor-pointer"
                                                      : "bg-gray-400 cursor-not-allowed opacity-60"
                                                  } text-white rounded transition ml-2`}
                                                  href={
                                                    hasCustomers
                                                      ? `https://wa.me/?text=${waText}`
                                                      : undefined
                                                  }
                                                  rel="noopener noreferrer"
                                                  tabIndex={hasCustomers ? 0 : -1}
                                                  target="_blank"
                                                  title={
                                                    hasCustomers
                                                      ? "Notify all customers via WhatsApp"
                                                      : "No customer to notify"
                                                  }
                                                >
                                                  <svg
                                                    className="w-4 h-4 mr-1"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path d="M20.52 3.48A12.07 12.07 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.18-1.62A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22c-1.85 0-3.68-.5-5.26-1.44l-.38-.22-3.67.96.98-3.58-.25-.37A9.94 9.94 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.2-7.8c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.34-.01-.52-.01-.18 0-.48.07-.73.34-.25.28-.97.95-.97 2.3 0 1.35.99 2.65 1.13 2.83.14.18 1.95 2.98 4.74 4.06.66.28 1.18.45 1.58.58.66.21 1.26.18 1.73.11.53-.08 1.65-.67 1.88-1.32.23-.65.23-1.21.16-1.32-.07-.11-.25-.18-.53-.32z" />
                                                  </svg>
                                                  Notify all
                                                </a>
                                              );
                                            })()}
                                          </>
                                        )}
                                      </td>
                                      <td className="px-4 py-2">
                                        {(() => {
                                          // Debug: Log price history for first product
                                          if (product.id === category.products[0]?.id) {
                                            console.log(`[Price History Check] Product ${product.id}:`, {
                                              priceHistory: product.priceHistory,
                                              length: product.priceHistory?.length,
                                              type: typeof product.priceHistory
                                            });
                                          }
                                          
                                          if (product.priceHistory && product.priceHistory.length > 0) {
                                            return (
                                              <div className="flex flex-col space-y-1">
                                                {product.priceHistory.map((ph, idx) => (
                                                  <span key={idx} className="text-xs text-gray-500">
                                                    ${ph.previous_price?.toFixed(2)}{" "}
                                                    <span className="text-gray-400">
                                                      (
                                                      {ph.last_price_update
                                                        ? new Date(
                                                            ph.last_price_update
                                                          ).toLocaleDateString()
                                                        : "No date"}
                                                      )
                                                    </span>
                                                  </span>
                                                ))}
                                              </div>
                                            );
                                          } else {
                                            // Debug: Show why no history
                                            if (product.id === category.products[0]?.id) {
                                              console.log(`[No History] Product ${product.id} - priceHistory:`, product.priceHistory);
                                            }
                                            return <span className="text-xs text-gray-400">No history</span>;
                                          }
                                        })()}
                                      </td>
                                    </tr>
                                    {selectedProduct === product.id && (
                                      <tr>
                                        <td className="px-4 py-2 bg-gray-50" colSpan={3}>
                                          <div className="pl-8">
                                            <div className="flex justify-between items-center mb-2">
                                              <h4 className="font-medium text-gray-700">
                                                Customers:
                                              </h4>
                                              {Object.keys(offerPrices).some((key) =>
                                                key.startsWith(`${product.id}-`)
                                              ) && (
                                                <button
                                                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-500 rounded"
                                                  title="Clear all offer prices for this product"
                                                  type="button"
                                                  onClick={() => {
                                                    const keysToClear = Object.keys(
                                                      offerPrices
                                                    ).filter((key) =>
                                                      key.startsWith(`${product.id}-`)
                                                    );
                                                    const newOfferPrices = { ...offerPrices };
                                                    keysToClear.forEach((key) => {
                                                      delete newOfferPrices[key];
                                                    });
                                                    setOfferPrices(newOfferPrices);
                                                  }}
                                                >
                                                  Clear All
                                                </button>
                                              )}
                                            </div>
                                            {product.order_items?.map((oiRaw, idx) => {
                                              const oi = oiRaw as {
                                                order_id: number;
                                                price?: number;
                                                orders?: {
                                                  customer_name: string;
                                                  customer_phone: string;
                                                  customer_id?: string;
                                                }[];
                                              };
                                              return (
                                                Array.isArray(oi.orders)
                                                  ? oi.orders
                                                  : oi.orders
                                                    ? [oi.orders]
                                                    : []
                                              ).map((order, oidx) => {
                                                // Use oi.price as the past price for this customer
                                                return (
                                                  <div
                                                    key={`${product.id}-${order.customer_id}-${oi.order_id}-${oidx}`}
                                                    className="mb-3 p-2 bg-gray-50 rounded"
                                                  >
                                                    <div className="mb-2">
                                                      <span className="font-medium">
                                                        {order.customer_name}
                                                      </span>
                                                      <span className="text-xs text-gray-400 ml-2">
                                                        (ID: {order.customer_id || "N/A"})
                                                      </span>
                                                      {oi.price !== undefined && (
                                                        <span className="text-xs text-gray-500 ml-2">
                                                          Past price: ${oi.price?.toFixed(2)}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                      <input
                                                        min="0"
                                                        placeholder="Offer new price"
                                                        step="0.01"
                                                        type="number"
                                                        value={
                                                          offerPrices[
                                                            `${product.id}-${order.customer_id}-${oi.order_id}-${oidx}`
                                                          ] || ""
                                                        }
                                                        onBlur={(e) => {
                                                          // Validate and clean up on blur
                                                          const key = `${product.id}-${order.customer_id}-${oi.order_id}-${oidx}`;
                                                          const value = e.target.value;
                                                          if (
                                                            value === "" ||
                                                            value === "0" ||
                                                            isNaN(Number(value))
                                                          ) {
                                                            setOfferPrices((prev) => {
                                                              const newState = { ...prev };
                                                              delete newState[key];
                                                              return newState;
                                                            });
                                                          }
                                                        }}
                                                        onChange={(e) => {
                                                          const key = `${product.id}-${order.customer_id}-${oi.order_id}-${oidx}`;
                                                          const value = e.target.value;

                                                          if (
                                                            value === "" ||
                                                            value === null ||
                                                            value === undefined
                                                          ) {
                                                            // Clear the value when input is empty
                                                            setOfferPrices((prev) => {
                                                              const newState = { ...prev };
                                                              delete newState[key];
                                                              return newState;
                                                            });
                                                          } else {
                                                            const numValue = Number(value);
                                                            if (!isNaN(numValue)) {
                                                              setOfferPrices((prev) => ({
                                                                ...prev,
                                                                [key]: numValue,
                                                              }));
                                                            }
                                                          }
                                                        }}
                                                        onFocus={(e) => {
                                                          // Select all text when focused
                                                          e.target.select();
                                                        }}
                                                      />
                                                      {offerPrices[
                                                        `${product.id}-${order.customer_id}-${oi.order_id}-${oidx}`
                                                      ] && (
                                                        <button
                                                          className="px-2 py-1 text-xs text-red-600 hover:text-red-800 border border-red-300 hover:border-red-500 rounded"
                                                          title="Clear offer price"
                                                          type="button"
                                                          onClick={() => {
                                                            const key = `${product.id}-${order.customer_id}-${oi.order_id}-${oidx}`;
                                                            setOfferPrices((prev) => {
                                                              const newState = { ...prev };
                                                              delete newState[key];
                                                              return newState;
                                                            });
                                                          }}
                                                        >
                                                          ✕
                                                        </button>
                                                      )}
                                                      <button
                                                        onClick={async () => {
                                                          if (!order.customer_id) {
                                                            alert("Customer ID not found!");
                                                            return;
                                                          }
                                                          const key = `${product.id}-${order.customer_id}-${oi.order_id}-${oidx}`;
                                                          const currentOfferPrice =
                                                            offerPrices[key];
                                                          if (!currentOfferPrice) {
                                                            alert("Please enter an offer price");
                                                            return;
                                                          }
                                                          try {
                                                            const { error } = await supabase
                                                              .from("price_offers")
                                                              .insert([
                                                                {
                                                                  customer_id: order.customer_id,
                                                                  product_id: product.id,
                                                                  offered_price: currentOfferPrice,
                                                                  status: "pending",
                                                                  created_at:
                                                                    new Date().toISOString(),
                                                                },
                                                              ]);

                                                            if (error) {
                                                              alert(
                                                                "Failed to send offer: " +
                                                                  error.message
                                                              );
                                                              return;
                                                            }

                                                            // Clear the offer price after sending successfully
                                                            setOfferPrices((prev) => {
                                                              const newState = { ...prev };
                                                              delete newState[key];
                                                              return newState;
                                                            });

                                                            alert(
                                                              `Offer sent successfully to ${order.customer_name} for $${currentOfferPrice}`
                                                            );
                                                          } catch (err) {
                                                            alert(
                                                              "Failed to send offer. Please try again."
                                                            );
                                                          }
                                                        }}
                                                      >
                                                        Send Offer
                                                      </button>
                                                    </div>
                                                  </div>
                                                );
                                              });
                                            })}
                                            {(!product.order_items ||
                                              product.order_items.length === 0) && (
                                              <span className="text-gray-500">
                                                No customers found
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                    {selectedProduct === product.id && (
                                      <tr>
                                        <td className="px-4 py-2 bg-gray-50" colSpan={3}>
                                          <div className="pl-8">
                                            <div className="flex justify-between items-center mb-4">
                                              <h4 className="font-medium text-gray-700">
                                                Product Variants:
                                              </h4>
                                              <div className="flex items-center gap-2">
                                                <label className="flex items-center text-sm">
                                                  <input
                                                    type="checkbox"
                                                    className="mr-2"
                                                    checked={useNewVariantSystem}
                                                    onChange={(e) => setUseNewVariantSystem(e.target.checked)}
                                                  />
                                                  Use New Variant System
                                                </label>
                                                <button
                                                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                                  onClick={() => 
                                                    setShowVariantManager(
                                                      showVariantManager === product.id ? null : product.id
                                                    )
                                                  }
                                                >
                                                  {showVariantManager === product.id ? 'Hide Variants' : 'Manage Variants'}
                                                </button>
                                              </div>
                                            </div>
                                            
                                            {showVariantManager === product.id && (
                                              <div className="mt-4">
                                                {useNewVariantSystem ? (
                                                  <VariantManager
                                                    productId={product.id}
                                                    variants={product.variants || []}
                                                    onVariantsChange={(newVariants) => {
                                                      // Update the product in the categories state
                                                      setCategories(prevCategories => 
                                                        prevCategories.map(category => ({
                                                          ...category,
                                                          products: category.products.map(p => 
                                                            p.id === product.id 
                                                              ? { ...p, variants: newVariants }
                                                              : p
                                                          )
                                                        }))
                                                      );
                                                    }}
                                                  />
                                                ) : (
                                                  <VariantExtractor
                                                    productId={product.id}
                                                    productName={product.Product}
                                                    onVariantsChange={(variants) => {
                                                      console.log('Variants updated:', variants);
                                                    }}
                                                  />
                                                )}
                                              </div>
                                            )}
                                            
                                            {product.variants && product.variants.length > 0 && (
                                              <div className="mt-2">
                                                <div className="text-sm text-gray-600 mb-2">
                                                  Current variants ({product.variants.length}):
                                                </div>
                                                <div className="space-y-1">
                                                  {product.variants.map((variant) => (
                                                    <div key={variant.id} className="flex items-center justify-between bg-white p-2 rounded border">
                                                      <div className="flex items-center space-x-3">
                                                        {variant.image_url && (
                                                          <img 
                                                            src={variant.image_url} 
                                                            alt={variant.variation_name}
                                                            className="w-8 h-8 object-cover rounded"
                                                          />
                                                        )}
                                                        <div>
                                                          <span className="font-medium">{variant.variation_name}</span>
                                                          {variant.variation_name_ch && (
                                                            <span className="text-gray-500 ml-2">({variant.variation_name_ch})</span>
                                                          )}
                                                          {variant.is_default && (
                                                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Default</span>
                                                          )}
                                                        </div>
                                                      </div>
                                                      <div className="text-sm text-gray-600">
                                                        ${variant.price.toFixed(2)} | Stock: {variant.stock_quantity}
                                                        {variant.weight && ` | ${variant.weight}`}
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                            
                                            {(!product.variants || product.variants.length === 0) && showVariantManager !== product.id && (
                                              <div className="text-gray-500 text-sm">
                                                No variants configured. Click "Manage Variants" to add product variations.
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                    </React.Fragment>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );
      case "inventory":
        return <div>Inventory Management</div>;
      case "history":
        return (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Transaction History</h2>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                onClick={() => fetchOrderDetails(currentPage)}
              >
                Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderDetails.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{order.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order.customer_name}
                            {order.customer_phone ? ` (${order.customer_phone})` : ""}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            ${order.total_amount?.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                order.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : order.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              } ${updatingStatus === order.id ? "opacity-50 cursor-not-allowed" : ""}`}
                              disabled={updatingStatus === order.id}
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            {updatingStatus === order.id && (
                              <span className="ml-2 text-xs text-gray-500">Updating...</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination for History */}
            {!isLoading && orderDetails.length > 0 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalOrders / pageSize), prev + 1))}
                    disabled={currentPage >= Math.ceil(totalOrders / pageSize)}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {(currentPage - 1) * pageSize + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * pageSize, totalOrders)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{totalOrders}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {Array.from({ length: Math.ceil(totalOrders / pageSize) }, (_, i) => i + 1)
                        .filter(page => {
                          const totalPages = Math.ceil(totalOrders / pageSize);
                          if (totalPages <= 7) return true;
                          if (page === 1 || page === totalPages) return true;
                          if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                          return false;
                        })
                        .map((page, index, array) => {
                          const totalPages = Math.ceil(totalOrders / pageSize);
                          const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                          const showEllipsisAfter = index < array.length - 1 && array[index + 1] !== page + 1;
                          
                          return (
                            <div key={page} className="flex items-center">
                              {showEllipsisBefore && (
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                  ...
                                </span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === page
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                              {showEllipsisAfter && (
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                  ...
                                </span>
                              )}
                            </div>
                          );
                        })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalOrders / pageSize), prev + 1))}
                        disabled={currentPage >= Math.ceil(totalOrders / pageSize)}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );
      case "customers":
        return <CustomerManagement />;
      case "users":
        return renderUsers();
      case "signin-monitoring":
        return (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Sign-in Monitoring</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <SignInStats title="Sign-in Statistics" />
              </div>
              <div>
                <QuickSignInCheck limit={10} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <QuickSignInCheck limit={10} showFailedOnly={true} />
              </div>
              <div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <a
                      href="/admin/signin-records"
                      className="block w-full px-4 py-2 text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                    >
                      View Full Sign-in History
                    </a>
                    <button
                      onClick={() => window.open("/admin/signin-records", "_blank")}
                      className="block w-full px-4 py-2 text-left text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md"
                    >
                      Export Sign-in Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      default:
        return renderOverview();
    }
  };

  // Enhanced function to handle status update
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);

      // Validate status
      if (!["pending", "completed", "cancelled"].includes(newStatus)) {
        throw new Error("Invalid status value");
      }

      // Update status in database
      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(), // Add timestamp for when status was updated
        })
        .eq("id", orderId);

      if (error) throw error;

      // Update local state
      setOrderDetails((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      );

      // Update recent orders as well
      setRecentOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === parseInt(orderId) ? { ...order, status: newStatus } : order
        )
      );

      // Show success message
      alert(`Order status updated to ${newStatus}`);
    } catch (error) {
      alert("Failed to update order status. Please try again.");

      // Refresh the order details to ensure UI is in sync with database
      fetchOrderDetails(currentPage);
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-2 sm:p-4">
        <button
          className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition mb-4"
          onClick={() => router.push("/")}
        >
          ← Back to Homepage
        </button>
      </div>
      {/* Horizontal Top Navigation Bar */}
      <div className="bg-white shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="py-4">
            <h1 className="text-2xl font-bold mb-2">Management Portal</h1>
            {/* Burger menu button for mobile */}
            <button
              aria-label="Open navigation menu"
              className="md:hidden flex items-center px-3 py-2 border rounded text-gray-600 border-gray-400 hover:text-blue-600 hover:border-blue-600 mb-2"
              onClick={() => setIsNavOpen((open) => !open)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
            {/* Mobile vertical menu */}
            {isNavOpen && (
              <nav className="flex flex-col gap-2 md:hidden bg-white rounded shadow p-2 absolute z-50 w-11/12 left-1/2 -translate-x-1/2 mt-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all w-full text-left ${
                      activeSection === section.id
                        ? "bg-blue-100 text-blue-600"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      setActiveSection(section.id);
                      setIsNavOpen(false);
                    }}
                  >
                    {section.icon}
                    <div className="text-left">
                      <span className="block font-medium">{section.title}</span>
                      <span className="text-xs text-gray-500">{section.description}</span>
                    </div>
                  </button>
                ))}
              </nav>
            )}
            {/* Desktop horizontal menu */}
            <nav className="hidden md:flex flex-row flex-wrap gap-2 overflow-x-auto">
              {sections.map((section) => (
                <motion.button
                  key={section.id}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    activeSection === section.id ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.icon}
                  <div className="text-left">
                    <span className="block font-medium">{section.title}</span>
                    <span className="text-xs text-gray-500">{section.description}</span>
                  </div>
                </motion.button>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex-1 p-2 sm:p-4 md:p-8 max-w-7xl mx-auto w-full">{renderContent()}</div>
    </div>
  );
}

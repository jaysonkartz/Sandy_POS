"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { CATEGORY_ID_NAME_MAP } from "@/app/(admin)/const/category";
import React from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import type { Category, DashboardSection, OrderDetail, Product, User } from "./types";
import OverviewTab from "./components/tabs/OverviewTab";
import PricingTab from "./components/tabs/PricingTab";
import HistoryTab from "./components/tabs/HistoryTab";
import UsersTab from "./components/tabs/UsersTab";
import SignInMonitoringTab from "./components/tabs/SignInMonitoringTab";
import InventoryTab from "./components/tabs/InventoryTab";
import CustomersTab from "./components/tabs/CustomersTab";

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
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [topSellingProductsByQuantity, setTopSellingProductsByQuantity] = useState<
    Array<{
      category: string;
      product: string;
      variation: string;
      quantity: number;
    }>
  >([]);
  const [topSellingProductsByPrice, setTopSellingProductsByPrice] = useState<
    Array<{
      product: string;
      variation: string;
      value: number;
    }>
  >([]);
  const [isLoadingTopProducts, setIsLoadingTopProducts] = useState(true);
  const [salesChartData, setSalesChartData] = useState<{
    labels: string[];
    sales: number[];
  }>({ labels: [], sales: [] });
  const [isLoadingSalesChart, setIsLoadingSalesChart] = useState(false);
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
  const [countryMap, setCountryMap] = useState<{
    [key: string]: { name: string; chineseName?: string };
  }>({});
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
  const [orderItems, setOrderItems] = useState<
    Record<
      string,
      Array<{
        id: number;
        order_id: number;
        product_id: number;
        quantity: number;
        price: number;
        total_price: number;
        product_name: string;
        product_code: string;
      }>
    >
  >({});
  const [dashboardStats, setDashboardStats] = useState<{
    totalProducts: number;
    totalSales: number;
    activeCustomers: number;
    pendingOrders: number;
  }>({
    totalProducts: 0,
    totalSales: 0,
    activeCustomers: 0,
    pendingOrders: 0,
  });
  const hasLoadedOverviewRef = useRef(false);
  const hasLoadedPricingRef = useRef(false);

  const getReadableErrorMessage = (error: unknown, fallback: string) => {
    if (!error) return fallback;

    if (typeof error === "string") {
      return error.trim() || fallback;
    }

    if (error instanceof Error) {
      return error.message?.trim() || fallback;
    }

    if (typeof error === "object") {
      const maybeError = error as {
        message?: unknown;
        details?: unknown;
        hint?: unknown;
        code?: unknown;
        error?: unknown;
        error_description?: unknown;
        status?: unknown;
        statusText?: unknown;
      };

      const parts = [
        typeof maybeError.message === "string" ? maybeError.message.trim() : "",
        typeof maybeError.details === "string" ? maybeError.details.trim() : "",
        typeof maybeError.hint === "string" ? maybeError.hint.trim() : "",
        typeof maybeError.error === "string" ? maybeError.error.trim() : "",
        typeof maybeError.error_description === "string" ? maybeError.error_description.trim() : "",
        typeof maybeError.code === "string" ? `code: ${maybeError.code.trim()}` : "",
        typeof maybeError.status === "number" ? `status: ${maybeError.status}` : "",
        typeof maybeError.statusText === "string" && maybeError.statusText.trim()
          ? `statusText: ${maybeError.statusText.trim()}`
          : "",
      ].filter(Boolean);

      if (parts.length > 0) {
        return parts.join(" | ");
      }

      try {
        const ownPropertyParts = Object.getOwnPropertyNames(error)
          .map((key) => {
            const value = (error as Record<string, unknown>)[key];
            if (value === null || value === undefined) return "";
            if (typeof value === "string" && value.trim()) return `${key}: ${value.trim()}`;
            if (typeof value === "number" || typeof value === "boolean") {
              return `${key}: ${String(value)}`;
            }
            return "";
          })
          .filter(Boolean);

        if (ownPropertyParts.length > 0) {
          return ownPropertyParts.join(" | ");
        }
      } catch {
        /* ignore ownKeys enumeration errors */
      }

      try {
        const raw = JSON.stringify(error);
        if (raw && raw !== "{}") {
          return raw;
        }
      } catch {
        /* ignore non-serializable error */
      }

      const objectTag = Object.prototype.toString.call(error);
      if (objectTag && objectTag !== "[object Object]") {
        return objectTag;
      }

      const stringified = String(error);
      if (stringified && stringified !== "[object Object]") {
        return stringified;
      }
    }

    return fallback;
  };

  const insertPriceOffersWithFallback = async (
    offers: Array<{
      customer_id: string;
      product_id: number;
      offered_price: number;
      previous_price: number;
      created_at?: string;
    }>
  ) => {
    const seenCustomerIds = new Set<string>();
    const uniqueOffers = offers.filter((offer) => {
      const cid = String(offer.customer_id ?? "").trim();
      if (!cid || seenCustomerIds.has(cid)) return false;
      seenCustomerIds.add(cid);
      return true;
    });

    if (uniqueOffers.length === 0) return;

    const baseMs = Date.now();
    type PriceHistoryRow = {
      customer_id: string;
      product_id: number;
      previous_price: number;
      original_price: number;
      last_price_update: string;
    };

    const rowsFromOffers = (
      list: typeof uniqueOffers,
      timeOffsetStart: number
    ): PriceHistoryRow[] =>
      list.map((offer, index) => ({
        customer_id: String(offer.customer_id).trim(),
        product_id: Number(offer.product_id),
        previous_price: offer.previous_price,
        original_price: offer.offered_price,
        last_price_update: new Date(timeOffsetStart + index).toISOString(),
      }));

    const insertBatch = async (rows: PriceHistoryRow[]) => {
      const lastErrors: string[] = [];

      const firstAttempt = await supabase
        .from("product_price_history")
        .insert(rows)
        .select("customer_id");
      if (!firstAttempt.error) {
        const data = firstAttempt.data;
        if (!data || data.length === 0) {
          return { ok: true as const, insertedIds: null as Set<string> | null, lastErrors };
        }
        const inserted = new Set<string>();
        data.forEach((r: { customer_id?: string | null }) => {
          if (r.customer_id != null) inserted.add(String(r.customer_id).trim());
        });
        return { ok: true as const, insertedIds: inserted, lastErrors };
      }
      lastErrors.push(`attempt1: ${getReadableErrorMessage(firstAttempt.error, "failed")}`);

      const secondPayload = rows.map(({ last_price_update, ...rest }) => rest);
      const secondAttempt = await supabase
        .from("product_price_history")
        .insert(secondPayload)
        .select("customer_id");
      if (!secondAttempt.error) {
        const data = secondAttempt.data;
        if (!data || data.length === 0) {
          return { ok: true as const, insertedIds: null as Set<string> | null, lastErrors };
        }
        const inserted = new Set<string>();
        data.forEach((r: { customer_id?: string | null }) => {
          if (r.customer_id != null) inserted.add(String(r.customer_id).trim());
        });
        return { ok: true as const, insertedIds: inserted, lastErrors };
      }
      lastErrors.push(`attempt2: ${getReadableErrorMessage(secondAttempt.error, "failed")}`);

      const thirdPayload = secondPayload.map(({ previous_price, ...rest }) => rest);
      const thirdAttempt = await supabase
        .from("product_price_history")
        .insert(thirdPayload)
        .select("customer_id");
      if (!thirdAttempt.error) {
        const data = thirdAttempt.data;
        if (!data || data.length === 0) {
          return { ok: true as const, insertedIds: null as Set<string> | null, lastErrors };
        }
        const inserted = new Set<string>();
        data.forEach((r: { customer_id?: string | null }) => {
          if (r.customer_id != null) inserted.add(String(r.customer_id).trim());
        });
        return { ok: true as const, insertedIds: inserted, lastErrors };
      }
      lastErrors.push(`attempt3: ${getReadableErrorMessage(thirdAttempt.error, "failed")}`);

      return { ok: false as const, insertedIds: null as Set<string> | null, lastErrors };
    };

    const insertOneRowWithFallback = async (row: PriceHistoryRow) => {
      const lastErrors: string[] = [];

      const firstAttempt = await supabase
        .from("product_price_history")
        .insert([row])
        .select("customer_id");
      if (!firstAttempt.error) return { ok: true as const, lastErrors };
      lastErrors.push(`attempt1: ${getReadableErrorMessage(firstAttempt.error, "failed")}`);

      const { last_price_update: _l1, ...secondRow } = row;
      const secondAttempt = await supabase
        .from("product_price_history")
        .insert([secondRow])
        .select("customer_id");
      if (!secondAttempt.error) return { ok: true as const, lastErrors };
      lastErrors.push(`attempt2: ${getReadableErrorMessage(secondAttempt.error, "failed")}`);

      const { previous_price: _p, ...thirdRow } = secondRow;
      const thirdAttempt = await supabase
        .from("product_price_history")
        .insert([thirdRow])
        .select("customer_id");
      if (!thirdAttempt.error) return { ok: true as const, lastErrors };
      lastErrors.push(`attempt3: ${getReadableErrorMessage(thirdAttempt.error, "failed")}`);

      return { ok: false as const, lastErrors };
    };

    const expectedIds = new Set(uniqueOffers.map((o) => String(o.customer_id).trim()));
    const firstPayload = rowsFromOffers(uniqueOffers, baseMs);
    const batch = await insertBatch(firstPayload);

    if (batch.ok) {
      if (batch.insertedIds === null) {
        return;
      }
      if (batch.insertedIds.size >= expectedIds.size) {
        return;
      }
      const missing = uniqueOffers.filter(
        (o) => !batch.insertedIds!.has(String(o.customer_id).trim())
      );
      const perRowErrors: string[] = [];
      const inserted = new Set(batch.insertedIds);
      for (let i = 0; i < missing.length; i++) {
        const row = rowsFromOffers([missing[i]], baseMs + 2000 + i)[0];
        const one = await insertOneRowWithFallback(row);
        if (one.ok) {
          inserted.add(String(missing[i].customer_id).trim());
        } else {
          perRowErrors.push(`${missing[i].customer_id}: ${one.lastErrors.join(" | ")}`);
        }
      }
      if (inserted.size >= expectedIds.size) {
        return;
      }
      throw {
        message: "product_price_history partial insert — missing rows after verify",
        details: perRowErrors.join(" || "),
      };
    }

    const perRowErrors: string[] = [];
    const insertedForRetry = new Set<string>();
    for (let i = 0; i < uniqueOffers.length; i++) {
      const row = rowsFromOffers([uniqueOffers[i]], baseMs + 5000 + i)[0];
      const one = await insertOneRowWithFallback(row);
      if (one.ok) {
        insertedForRetry.add(String(uniqueOffers[i].customer_id).trim());
      } else {
        perRowErrors.push(`${uniqueOffers[i].customer_id}: ${one.lastErrors.join(" | ")}`);
      }
    }
    if (insertedForRetry.size >= expectedIds.size) {
      return;
    }

    throw {
      message: "product_price_history insert failed after retries",
      details: perRowErrors.length > 0 ? perRowErrors.join(" || ") : batch.lastErrors.join(" | "),
    };
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const from = (page - 1) * usersPerPage;
      const to = from + usersPerPage - 1;

      const {
        data: usersData,
        error: usersError,
        count,
      } = await supabase
        .from("users")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (usersError) throw usersError;

      const { data: customersData } = await supabase.from("customers").select("user_id, name");

      const customerNameMap = new Map<string, string>();
      if (customersData) {
        customersData.forEach((customer: { user_id?: string; name?: string }) => {
          if (customer.user_id && customer.name) {
            customerNameMap.set(customer.user_id, customer.name);
          }
        });
      }

      const usersWithNames = (usersData || []).map((user: User) => ({
        ...user,
        name: customerNameMap.get(user.id) || user.email?.split("@")[0] || "Unknown",
      }));

      setUsers(usersWithNames);
      setTotalUsers(count || 0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch users";
      toast.error(errorMessage);
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
      let countryMapping: { [key: string]: { name: string; chineseName?: string } } = {};
      try {
        const { data: countriesData } = await supabase
          .from("countries")
          .select("id, country, chineseName");

        if (countriesData && countriesData.length > 0) {
          countriesData.forEach(
            (country: { id: number | string; country: string; chineseName?: string }) => {
              if (country.id != null && country.country) {
                const idKey = String(country.id);
                countryMapping[idKey] = {
                  name: country.country,
                  chineseName: country.chineseName || undefined,
                };
              }
            }
          );
          setCountryMap(countryMapping);
        }
      } catch (countriesError) {
        console.warn("Failed to load countries mapping", countriesError);
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
          weight,
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
        throw error;
      }
      const { data: priceHistories, error: priceHistoryError } = await supabase
        .from("product_price_history")
        .select("product_id, previous_price, original_price, last_price_update, created_at")
        .is("customer_id", null) // Only fetch global price changes (not customer-specific)
        .order("last_price_update", { ascending: false });

      const { data: customerPriceHistories } = await supabase
        .from("product_price_history")
        .select("product_id, customer_id, original_price, last_price_update, created_at")
        .not("customer_id", "is", null)
        .order("last_price_update", { ascending: false });

      // Group price histories by product_id
      // Ensure product_id is converted to number for consistent key matching
      // Store with both number and string keys to handle any type mismatches
      interface PriceHistoryEntry {
        product_id: number;
        previous_price: number;
        original_price: number;
        last_price_update?: string;
        created_at?: string;
      }

      const priceHistoryMap: { [key: number | string]: PriceHistoryEntry[] } = {};
      (priceHistories || []).forEach((ph: PriceHistoryEntry) => {
        const productId = Number(ph.product_id);
        const productIdStr = String(ph.product_id);
        if (!isNaN(productId)) {
          if (!priceHistoryMap[productId]) {
            priceHistoryMap[productId] = [];
            priceHistoryMap[productIdStr] = priceHistoryMap[productId]; // Same array reference
          }
          priceHistoryMap[productId].push(ph);
        }
      });

      interface CustomerPriceHistoryEntry {
        product_id: number;
        customer_id: string;
        original_price: number;
        last_price_update?: string;
        created_at?: string;
      }

      const customerPriceHistoryMap: {
        [key: number | string]: CustomerPriceHistoryEntry[];
      } = {};
      (customerPriceHistories || []).forEach((ph: CustomerPriceHistoryEntry) => {
        const productId = Number(ph.product_id);
        const productIdStr = String(ph.product_id);
        if (!isNaN(productId)) {
          if (!customerPriceHistoryMap[productId]) {
            customerPriceHistoryMap[productId] = [];
            customerPriceHistoryMap[productIdStr] = customerPriceHistoryMap[productId];
          }
          customerPriceHistoryMap[productId].push(ph);
        }
      });

      const uniqueHistoryProductIds = (priceHistories || [])
        .map((ph: PriceHistoryEntry) => ph.product_id)
        .filter((v: number, i: number, a: number[]) => a.indexOf(v) === i);

      const productsWithVariants = (products || []).map((product: any) => {
        const countryId = product.Country != null ? String(product.Country) : null;
        const countryInfo = countryId ? countryMapping[countryId] : null;
        const countryName = countryInfo?.name || null;

        const productId = Number(product.id);
        const productIdStr = String(product.id);

        let history =
          priceHistoryMap[productId] ||
          priceHistoryMap[productIdStr] ||
          priceHistoryMap[String(productId)] ||
          priceHistoryMap[Number(productIdStr)] ||
          [];

        const customerHistory =
          customerPriceHistoryMap[productId] ||
          customerPriceHistoryMap[productIdStr] ||
          customerPriceHistoryMap[String(productId)] ||
          customerPriceHistoryMap[Number(productIdStr)] ||
          [];

        return {
          ...product,
          countryName: countryName, // Add resolved country name
          variants: [],
          priceHistory: history.slice(0, 3),
          customerPriceHistory: customerHistory,
        };
      });

      const categoryGroups: { [key: string]: Product[] } = {};
      productsWithVariants.forEach((product: Product) => {
        const categoryId = product.Category;
        const categoryName = CATEGORY_ID_NAME_MAP[categoryId] || categoryId || "Uncategorized";

        if (!categoryGroups[categoryName]) {
          categoryGroups[categoryName] = [];
        }
        categoryGroups[categoryName].push(product);
      });

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
        throw error;
      }

      setRecentOrders(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch recent orders";
      toast.error(errorMessage);
      setRecentOrders([]);
    } finally {
      setIsLoadingRecentOrders(false);
    }
  };

  useEffect(() => {
    if (activeSection === "overview" && !hasLoadedOverviewRef.current) {
      hasLoadedOverviewRef.current = true;
      fetchTopSellingProducts(undefined, "quantity");
      fetchTopSellingProducts(undefined, "price");
      fetchRecentOrders();
      fetchSalesChartData();
      fetchDashboardStats();
    }

    if (activeSection === "pricing" && !hasLoadedPricingRef.current) {
      hasLoadedPricingRef.current = true;
      fetchCategories();
    }
  }, [activeSection]);

  const fetchTopSellingProducts = async (month?: string, type?: string) => {
    setIsLoadingTopProducts(true);
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const monthYearMap = new Map<string, number>();
      const monthYearArray: Array<{ month: string; year: number; date: Date }> = [];

      for (let month = 0; month < 12; month++) {
        const date = new Date(currentYear, month, 1);
        const monthName = date.toLocaleString("default", { month: "long" });
        const key = `${monthName} ${currentYear}`;

        monthYearMap.set(key, currentYear);
        monthYearArray.push({ month: monthName, year: currentYear, date });
      }

      monthYearArray.sort((a, b) => b.date.getTime() - a.date.getTime());

      const monthsArray = monthYearArray.map((item) => `${item.month} ${item.year}`);
      setAvailableMonths(monthsArray);
      setMonthYearMap(monthYearMap);

      const currentMonth = new Date().toLocaleString("default", { month: "long" });
      const currentMonthYear = `${currentMonth} ${currentYear}`;

      const targetMonth = month || currentMonthYear;
      if (type === "quantity") {
        setSelectedMonthQuantity(targetMonth);
      } else {
        setSelectedMonthPrice(targetMonth);
      }

      let monthName, targetYear;
      if (targetMonth.includes(" ")) {
        const parts = targetMonth.split(" ");
        monthName = parts[0];
        targetYear = parseInt(parts[1]);
      } else {
        monthName = targetMonth;
        targetYear = new Date().getFullYear();
      }

      const monthNumber = new Date(`${monthName} 1, ${targetYear}`).getMonth() + 1;

      const startDate = new Date(targetYear, monthNumber - 1, 1).toISOString();
      const endDate = new Date(targetYear, monthNumber, 0, 23, 59, 59).toISOString();

      let { data: orderItems, error } = await supabase
        .from("order_items")
        .select(
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
        )
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (error) {
        throw error;
      }

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

      orderItems?.forEach(
        (item: {
          product_name?: string;
          product_code?: string;
          quantity?: number;
          total_price?: number;
          category?: string;
        }) => {
          const productName = item.product_name || "Unknown Product";
          const productCode = item.product_code || "N/A";
          const quantity = item.quantity || 0;
          const totalPrice = item.total_price || 0;

          let category = "Other";
          if (productName.toLowerCase().includes("chilli")) {
            category = "Chilli";
          }

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
        }
      );

      const topByQuantity = Array.from(productQuantityMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 3);

      const topByValue = Array.from(productValueMap.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);

      if (type === "quantity") {
        setTopSellingProductsByQuantity(topByQuantity);
      } else if (type === "price") {
        setTopSellingProductsByPrice(topByValue);
      } else {
        setTopSellingProductsByQuantity(topByQuantity);
        setTopSellingProductsByPrice(topByValue);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch top selling products";
      toast.error(errorMessage);
      if (type === "quantity") {
        setTopSellingProductsByQuantity([]);
      } else if (type === "price") {
        setTopSellingProductsByPrice([]);
      } else {
        setTopSellingProductsByQuantity([]);
        setTopSellingProductsByPrice([]);
      }
    } finally {
      setIsLoadingTopProducts(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const { count: productsCount, error: productsError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      if (productsError) {
        console.warn("Dashboard products count failed", productsError);
      }

      const { data: completedOrders, error: salesError } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("status", "completed");

      if (salesError) {
        console.warn("Dashboard sales query failed", salesError);
      }

      const totalSales =
        completedOrders?.reduce((sum: number, order: { total_amount?: string | number | null }) => {
          const amount =
            typeof order.total_amount === "string"
              ? parseFloat(order.total_amount)
              : order.total_amount || 0;
          return sum + amount;
        }, 0) || 0;

      const { data: ordersData, error: customersError } = await supabase
        .from("orders")
        .select("customer_phone, customer_name");

      if (customersError) {
        console.warn("Dashboard customers query failed", customersError);
      }

      const uniqueCustomers = new Set(
        ordersData
          ?.map((order: { customer_phone?: string | null }) => order.customer_phone)
          .filter(Boolean) || []
      );
      const activeCustomers = uniqueCustomers.size;

      const { count: pendingCount, error: pendingError } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (pendingError) {
        console.warn("Dashboard pending orders count failed", pendingError);
      }

      setDashboardStats({
        totalProducts: productsCount || 0,
        totalSales: totalSales,
        activeCustomers: activeCustomers,
        pendingOrders: pendingCount || 0,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch dashboard stats";
      toast.error(errorMessage);
    }
  };

  const fetchSalesChartData = async () => {
    setIsLoadingSalesChart(true);
    try {
      const today = new Date();
      const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1).toISOString();

      const { data: orderItems, error } = await supabase
        .from("order_items")
        .select("total_price, created_at")
        .gte("created_at", twelveMonthsAgo);

      if (error) {
        toast.error(`Failed to fetch sales chart data: ${error.message}`);
        setSalesChartData({ labels: [], sales: [] });
        return;
      }

      if (!orderItems || orderItems.length === 0) {
        setSalesChartData({ labels: [], sales: [] });
        return;
      }

      const monthSalesMap = new Map<string, number>();

      orderItems.forEach((item: { created_at?: string; total_price?: number }) => {
        if (!item.created_at) return;

        const date = new Date(item.created_at);
        const monthName = date.toLocaleString("default", { month: "long" });
        const year = date.getFullYear();
        const monthKey = `${monthName} ${year}`;
        const sales = parseFloat(item.total_price?.toString() || "0") || 0;

        if (monthSalesMap.has(monthKey)) {
          monthSalesMap.set(monthKey, monthSalesMap.get(monthKey)! + sales);
        } else {
          monthSalesMap.set(monthKey, sales);
        }
      });

      const sortedMonths = Array.from(monthSalesMap.entries()).sort((a, b) => {
        const parseMonthYear = (monthYear: string): Date => {
          const parts = monthYear.split(" ");
          const monthName = parts[0];
          const year = parseInt(parts[1]);
          return new Date(`${monthName} 1, ${year}`);
        };

        const dateA = parseMonthYear(a[0]);
        const dateB = parseMonthYear(b[0]);
        return dateA.getTime() - dateB.getTime();
      });

      const labels = sortedMonths.map(([monthKey]) => monthKey);
      const sales = sortedMonths.map(([, salesAmount]) => salesAmount);

      setSalesChartData({ labels, sales });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch sales chart data";
      toast.error(errorMessage);
      setSalesChartData({ labels: [], sales: [] });
    } finally {
      setIsLoadingSalesChart(false);
    }
  };

  const fetchOrderDetails = async (page = 1) => {
    setIsLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("orders")
        .select("id, created_at, customer_name, customer_phone, total_amount, status", {
          count: "planned",
        })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setOrderDetails(data || []);
      setTotalOrders(count || 0);

      if (data && data.length > 0) {
        const orderIds = data.map((order: { id: string | number }) => parseInt(String(order.id)));
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select(
            "id, order_id, product_id, quantity, price, total_price, product_name, product_code"
          )
          .in("order_id", orderIds);

        if (itemsError) {
          toast.error(`Failed to fetch order items: ${itemsError.message}`);
        } else {
          interface OrderItem {
            id: number;
            order_id: number;
            product_id: number;
            quantity: number;
            price: number;
            total_price: number;
            product_name: string;
            product_code: string;
          }

          const itemsByOrder: Record<string, OrderItem[]> = {};
          (itemsData || []).forEach(
            (item: {
              id: number;
              order_id: number;
              product_id: number;
              quantity: number;
              price: string | number;
              total_price: string | number;
              product_name: string;
              product_code?: string;
            }) => {
              const orderId = String(item.order_id);
              if (!itemsByOrder[orderId]) {
                itemsByOrder[orderId] = [];
              }
              itemsByOrder[orderId].push({
                id: item.id,
                order_id: item.order_id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: typeof item.price === "string" ? parseFloat(item.price) : item.price || 0,
                total_price:
                  typeof item.total_price === "string"
                    ? parseFloat(item.total_price)
                    : item.total_price || 0,
                product_name: item.product_name,
                product_code: item.product_code || "",
              });
            }
          );
          setOrderItems(itemsByOrder);
        }
      } else {
        setOrderItems({});
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch order details";
      toast.error(errorMessage);
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

    {
      id: "history",
      title: "Purchase",
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
    {
      id: "pending-approvals",
      title: "Registration",
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

  const handleStatusChange = useCallback(
    async (orderId: string, newStatus: string) => {
      try {
        setUpdatingStatus(orderId);

        if (!["pending", "completed", "cancelled"].includes(newStatus)) {
          throw new Error("Invalid status value");
        }

        const { error } = await supabase
          .from("orders")
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (error) throw error;

        setOrderDetails((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );

        setRecentOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === parseInt(orderId) ? { ...order, status: newStatus } : order
          )
        );

        toast.success(`Order status updated to ${newStatus}`);
      } catch {
        toast.error("Failed to update order status. Please try again.");

        fetchOrderDetails(currentPage);
      } finally {
        setUpdatingStatus(null);
      }
    },
    [currentPage]
  );

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <OverviewTab
            availableMonths={availableMonths}
            dashboardStats={dashboardStats}
            fetchTopSellingProducts={fetchTopSellingProducts}
            isLoadingRecentOrders={isLoadingRecentOrders}
            isLoadingSalesChart={isLoadingSalesChart}
            isLoadingTopProducts={isLoadingTopProducts}
            recentOrders={recentOrders}
            salesChartData={salesChartData}
            selectedMonthPrice={selectedMonthPrice}
            selectedMonthQuantity={selectedMonthQuantity}
            setSelectedMonthPrice={setSelectedMonthPrice}
            setSelectedMonthQuantity={setSelectedMonthQuantity}
            topSellingProductsByPrice={topSellingProductsByPrice}
            topSellingProductsByQuantity={topSellingProductsByQuantity}
          />
        );
      case "pricing":
        return (
          <PricingTab
            categories={categories}
            countryMap={countryMap}
            error={error}
            fetchCategories={fetchCategories}
            getReadableErrorMessage={getReadableErrorMessage}
            insertPriceOffersWithFallback={insertPriceOffersWithFallback}
            isLoading={isLoading}
            setCategories={setCategories}
          />
        );
      case "inventory":
        return <InventoryTab />;
      case "history":
        return (
          <HistoryTab
            currentPage={currentPage}
            handleStatusChange={handleStatusChange}
            isLoading={isLoading}
            orderDetails={orderDetails}
            orderItems={orderItems}
            pageSize={pageSize}
            setCurrentPage={setCurrentPage}
            totalOrders={totalOrders}
            updatingStatus={updatingStatus}
          />
        );
      case "customers":
        return <CustomersTab />;
      case "pending-approvals":
        return <CustomersTab view="pending" />;
      case "users":
        return (
          <UsersTab
            currentUserPage={currentUserPage}
            fetchUsers={fetchUsers}
            isEditModalOpen={isEditModalOpen}
            isLoading={isLoading}
            selectedUser={selectedUser}
            setCurrentUserPage={setCurrentUserPage}
            setIsEditModalOpen={setIsEditModalOpen}
            setSelectedUser={setSelectedUser}
            totalUsers={totalUsers}
            users={users}
            usersPerPage={usersPerPage}
          />
        );
      case "signin-monitoring":
        return <SignInMonitoringTab />;
      default:
        return (
          <OverviewTab
            availableMonths={availableMonths}
            dashboardStats={dashboardStats}
            fetchTopSellingProducts={fetchTopSellingProducts}
            isLoadingRecentOrders={isLoadingRecentOrders}
            isLoadingSalesChart={isLoadingSalesChart}
            isLoadingTopProducts={isLoadingTopProducts}
            recentOrders={recentOrders}
            salesChartData={salesChartData}
            selectedMonthPrice={selectedMonthPrice}
            selectedMonthQuantity={selectedMonthQuantity}
            setSelectedMonthPrice={setSelectedMonthPrice}
            setSelectedMonthQuantity={setSelectedMonthQuantity}
            topSellingProductsByPrice={topSellingProductsByPrice}
            topSellingProductsByQuantity={topSellingProductsByQuantity}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <div className="p-2 sm:p-4">
        <button
          className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition mb-4"
          onClick={() => router.push("/")}
        >
          ← Back to Homepage
        </button>
      </div>

      <div className="bg-white shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="py-4">
            <h1 className="text-2xl font-bold mb-2">Management Portal</h1>

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

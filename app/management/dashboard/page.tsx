"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Bar } from "react-chartjs-2";
import { CldImage } from "next-cloudinary";
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
import React from "react";
import { useRouter } from "next/navigation";
import QuickSignInCheck from "@/app/components/QuickSignInCheck";
import SignInStats from "@/app/components/SignInStats";
import VariantManager from "@/components/VariantManager";
import VariantExtractor from "@/components/VariantExtractor";
import { ProductVariant } from "@/app/types/product";
import toast, { Toaster } from "react-hot-toast";
import { Autocomplete, AutocompleteItem } from "@heroui/react";

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
  weight?: string;
  UOM?: string;
  Country?: string;
  countryName?: string;
  variants?: ProductVariant[];
  priceHistory?: {
    previous_price: number;
    original_price: number;
    last_price_update?: string;
    created_at?: string;
  }[];
  customerPriceHistory?: {
    customer_id: string;
    original_price: number;
    last_price_update?: string;
    created_at?: string;
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
  const [offerPrices, setOfferPrices] = useState<{
    [key: string]: number | null;
  }>({});
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
  const [useNewVariantSystem, setUseNewVariantSystem] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<number | null>(null);
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
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [allCustomers, setAllCustomers] = useState<
    Array<{
      id: string | number;
      name: string;
      phone?: string | null;
      email?: string | null;
      user_id?: string | null;
    }>
  >([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [selectedCustomersForOffer, setSelectedCustomersForOffer] = useState<{
    [productId: number]: string[];
  }>({});
  const [customerOfferSearchQuery, setCustomerOfferSearchQuery] = useState<{
    [productId: number]: string;
  }>({});
  const [customPriceForSelectedCustomer, setCustomPriceForSelectedCustomer] = useState<{
    [key: string]: number | null;
  }>({});
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<{
    [productId: number]: boolean;
  }>({});
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
  const [loadedVariantProductIds, setLoadedVariantProductIds] = useState<Set<number>>(new Set());
  const [loadingVariantProductIds, setLoadingVariantProductIds] = useState<Set<number>>(new Set());
  const productVariantOptions = useMemo(() => {
    const uniqueProducts = new Map<string, Product & { categoryName: string }>();
    categories.forEach((category) => {
      category.products.forEach((product) => {
        const productNameKey = (product.Product || "").trim().toLowerCase();
        const categoryKey = (category.name || "").trim().toLowerCase();
        const dedupeKey = `${productNameKey}::${categoryKey}`;

        if (!uniqueProducts.has(dedupeKey)) {
          uniqueProducts.set(dedupeKey, {
            ...product,
            categoryName: category.name,
          });
        }
      });
    });
    return Array.from(uniqueProducts.values());
  }, [categories]);

  useEffect(() => {
    if (selectedProductForVariants !== null || productVariantOptions.length === 0) return;
    setSelectedProductForVariants(productVariantOptions[0].id);
  }, [productVariantOptions, selectedProductForVariants]);

  const fetchVariantsByProductIds = useCallback(async (productIds: number[]) => {
    const ids = Array.from(new Set(productIds.filter((id) => Number.isFinite(id))));
    if (ids.length === 0) return {} as Record<number, ProductVariant[]>;

    try {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .in("product_id", ids)
        .order("created_at", { ascending: true });

      if (error) {
        if (error.code === "PGRST116") {
          return {} as Record<number, ProductVariant[]>;
        }
        throw error;
      }

      const grouped: Record<number, ProductVariant[]> = {};
      (data || []).forEach((variant: ProductVariant & { product_id: number }) => {
        if (!grouped[variant.product_id]) {
          grouped[variant.product_id] = [];
        }
        grouped[variant.product_id].push(variant);
      });

      return grouped;
    } catch {
      return {} as Record<number, ProductVariant[]>;
    }
  }, []);

  const applyVariantsToCategories = useCallback(
    (variantsByProductId: Record<number, ProductVariant[]>) => {
      setCategories((prev) =>
        prev.map((category) => ({
          ...category,
          products: category.products.map((product) =>
            Object.prototype.hasOwnProperty.call(variantsByProductId, product.id)
              ? { ...product, variants: variantsByProductId[product.id] || [] }
              : product
          ),
        }))
      );
    },
    []
  );

  const ensureVariantsLoaded = useCallback(
    async (productIds: number[]) => {
      const toLoad = Array.from(
        new Set(productIds.filter((id) => Number.isFinite(id) && !loadedVariantProductIds.has(id)))
      );
      if (toLoad.length === 0) return;

      setLoadingVariantProductIds((prev) => {
        const next = new Set(prev);
        toLoad.forEach((id) => next.add(id));
        return next;
      });

      try {
        const variantsByProductId = await fetchVariantsByProductIds(toLoad);
        applyVariantsToCategories(variantsByProductId);
        setLoadedVariantProductIds((prev) => {
          const next = new Set(prev);
          toLoad.forEach((id) => next.add(id));
          return next;
        });
      } finally {
        setLoadingVariantProductIds((prev) => {
          const next = new Set(prev);
          toLoad.forEach((id) => next.delete(id));
          return next;
        });
      }
    },
    [applyVariantsToCategories, fetchVariantsByProductIds, loadedVariantProductIds]
  );

  const clearOfferPrices = () => {
    setOfferPrices({});
  };

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

  const fetchAllCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, email, user_id")
        .order("name", { ascending: true });

      if (error) {
        toast.error(
          `Failed to load customers: ${error.message}${error.details ? ` (${error.details})` : ""}`
        );
        setIsLoadingCustomers(false);
        return;
      }

      if (data && Array.isArray(data)) {
        const formattedCustomers = data
          .filter(
            (customer: { id?: string | number | null }) =>
              customer && customer.id !== null && customer.id !== undefined
          )
          .map(
            (customer: {
              id: string | number;
              name?: string | null;
              phone?: string | null;
              email?: string | null;
              user_id?: string | null;
            }) => ({
              id: String(customer.id),
              name: customer.name?.trim() || customer.email?.split("@")[0] || "Unnamed Customer",
              phone: customer.phone || null,
              email: customer.email || null,
              user_id: customer.user_id || null,
            })
          );

        const dedupedCustomers = Array.from(
          new Map(formattedCustomers.map((customer) => [String(customer.id), customer])).values()
        );

        setAllCustomers(dedupedCustomers);
      } else {
        setAllCustomers([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to load customers: ${errorMessage}`);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    clearOfferPrices();
  }, [selectedProduct]);

  useEffect(() => {
    if (activeSection === "pricing") {
      const timer = setTimeout(() => {
        fetchAllCustomers();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeSection]);

  useEffect(() => {
    if (
      selectedProduct &&
      activeSection === "pricing" &&
      allCustomers.length === 0 &&
      !isLoadingCustomers
    ) {
      fetchAllCustomers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct, activeSection]);

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
      setLoadedVariantProductIds(new Set());
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

  useEffect(() => {
    if (!selectedProductForVariants) return;
    if (activeSection !== "pricing") return;
    ensureVariantsLoaded([selectedProductForVariants]);
  }, [activeSection, ensureVariantsLoaded, selectedProductForVariants]);

  useEffect(() => {
    if (!expandedCategory) return;
    if (activeSection !== "pricing") return;

    const category = categories.find((c) => c.id === expandedCategory);
    if (!category) return;

    ensureVariantsLoaded(category.products.map((p) => p.id));
  }, [activeSection, categories, ensureVariantsLoaded, expandedCategory]);

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
    {
      id: "pending-approvals",
      title: "Pending Approvals",
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

  const renderOverview = () => {
    const salesData = {
      labels: salesChartData.labels.length > 0 ? salesChartData.labels : ["No data available"],
      datasets: [
        {
          label: "Total Sales",
          data: salesChartData.sales.length > 0 ? salesChartData.sales : [0],
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              title: "Total Products",
              value: dashboardStats.totalProducts.toLocaleString(),
              change: "",
            },
            {
              title: "Total Sales",
              value: `$${dashboardStats.totalSales.toLocaleString()}`,
              change: "",
            },
            {
              title: "Active Customers",
              value: dashboardStats.activeCustomers.toLocaleString(),
              change: "",
            },
            {
              title: "Pending Orders",
              value: dashboardStats.pendingOrders.toLocaleString(),
              change: "",
            },
          ].map((stat, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-gray-500 text-sm">{stat.title}</h3>
              <p className="text-2xl font-bold">{stat.value}</p>
              {stat.change && (
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
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Sales Overview - Total Sales by Month</h3>
            {isLoadingSalesChart ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading sales data...</div>
              </div>
            ) : salesChartData.labels.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">No sales data available</div>
              </div>
            ) : (
              <Bar
                data={salesData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      display: true,
                      position: "top" as const,
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context: { parsed: { y: number | null } }) {
                          const value = context.parsed.y;
                          return `Sales: $${value !== null ? value.toFixed(2) : "0.00"}`;
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function (value: number | string) {
                          if (typeof value === "number") {
                            return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          }
                          return value;
                        },
                      },
                      title: {
                        display: true,
                        text: "Total Sales ($)",
                      },
                    },
                    x: {
                      ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                      },
                      title: {
                        display: true,
                        text: "Month",
                      },
                    },
                  },
                }}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Top Selling Products (by Qty)</h3>
              <select
                className="px-3 py-1 pr-8 bg-blue-100 text-blue-600 rounded text-sm font-medium border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-no-repeat bg-right bg-[length:16px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzM3NDE1MSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')]"
                value={selectedMonthQuantity}
                onChange={(e) => {
                  setSelectedMonthQuantity(e.target.value);
                  fetchTopSellingProducts(e.target.value, "quantity");
                }}
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
                      <td className="px-4 py-8 text-center text-gray-500" colSpan={4}>
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
                      <td className="px-4 py-8 text-center text-gray-500" colSpan={4}>
                        No sales data available for {selectedMonthQuantity}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Top Selling Products (by Price)</h3>
              <select
                className="px-3 py-1 pr-8 bg-blue-100 text-blue-600 rounded text-sm font-medium border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-no-repeat bg-right bg-[length:16px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzM3NDE1MSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')]"
                value={selectedMonthPrice}
                onChange={(e) => {
                  setSelectedMonthPrice(e.target.value);
                  fetchTopSellingProducts(e.target.value, "price");
                }}
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
                      <td className="px-4 py-8 text-center text-gray-500" colSpan={3}>
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
                      <td className="px-4 py-8 text-center text-gray-500" colSpan={3}>
                        No sales data available for {selectedMonthPrice}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
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
                    <td className="px-6 py-8 text-center text-gray-500" colSpan={4}>
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
                        {order.customer_name} - $
                        {order.total_amount ? order.total_amount.toFixed(2) : "0.00"}
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
                    <td className="px-6 py-8 text-center text-gray-500" colSpan={4}>
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
                          {user.avatar_url ? (
                            <CldImage
                              alt={user.name || "User avatar"}
                              className="h-8 w-8 rounded-full object-cover"
                              height={32}
                              src={user.avatar_url}
                              width={32}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200" />
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || "N/A"}
                            </div>
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
                        <button className="text-red-600 hover:text-red-900" onClick={() => {}}>
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

        {!isLoading && users.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentUserPage === 1}
                onClick={() => setCurrentUserPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </button>
              <button
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentUserPage >= Math.ceil(totalUsers / usersPerPage)}
                onClick={() =>
                  setCurrentUserPage((prev) =>
                    Math.min(Math.ceil(totalUsers / usersPerPage), prev + 1)
                  )
                }
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">{(currentUserPage - 1) * usersPerPage + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(currentUserPage * usersPerPage, totalUsers)}
                  </span>{" "}
                  of <span className="font-medium">{totalUsers}</span> results
                </p>
              </div>
              <div>
                <nav
                  aria-label="Pagination"
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                >
                  <button
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={currentUserPage === 1}
                    onClick={() => setCurrentUserPage((prev) => Math.max(1, prev - 1))}
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        clipRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        fillRule="evenodd"
                      />
                    </svg>
                  </button>
                  {Array.from({ length: Math.ceil(totalUsers / usersPerPage) }, (_, i) => i + 1)
                    .filter((page) => {
                      const totalPages = Math.ceil(totalUsers / usersPerPage);
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentUserPage - 1 && page <= currentUserPage + 1) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      const totalPages = Math.ceil(totalUsers / usersPerPage);
                      const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                      const showEllipsisAfter =
                        index < array.length - 1 && array[index + 1] !== page + 1;

                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsisBefore && (
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                              ...
                            </span>
                          )}
                          <button
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentUserPage === page
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                            onClick={() => setCurrentUserPage(page)}
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
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={currentUserPage >= Math.ceil(totalUsers / usersPerPage)}
                    onClick={() =>
                      setCurrentUserPage((prev) =>
                        Math.min(Math.ceil(totalUsers / usersPerPage), prev + 1)
                      )
                    }
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        clipRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        fillRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

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
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-700 text-lg">Product Variants:</h4>
                <label className="hidden items-center text-sm">
                  <input
                    checked={useNewVariantSystem}
                    className="mr-2"
                    type="checkbox"
                    onChange={(e) => setUseNewVariantSystem(e.target.checked)}
                  />
                  Use New Variant System
                </label>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Product to Manage Variants:
                </label>
                <Autocomplete
                  aria-label="Select product to manage variants"
                  className="w-full max-w-md"
                  classNames={{
                    popoverContent: "bg-white/100",
                    listboxWrapper: "bg-white/100",
                  }}
                  items={productVariantOptions}
                  listboxProps={{
                    itemClasses: {
                      base: "h-auto min-h-12 py-2 data-[hover=true]:bg-blue-50 data-[hover=true]:text-blue-700",
                      wrapper: "h-auto",
                      title: "whitespace-normal break-words leading-5",
                    },
                  }}
                  placeholder="-- Select a Product --"
                  selectedKey={
                    selectedProductForVariants !== null ? String(selectedProductForVariants) : null
                  }
                  onSelectionChange={(key) => {
                    if (!key) {
                      setSelectedProductForVariants(null);
                      return;
                    }
                    const newProductId = Number(key);
                    if (Number.isNaN(newProductId)) return;
                    setSelectedProductForVariants(newProductId);
                  }}
                >
                  {(item) => (
                    <AutocompleteItem
                      key={String(item.id)}
                      className="h-auto py-2"
                      textValue={`${item.Product} ${item.Variation || ""} ${item.countryName || ""} ${
                        item.weight || ""
                      } ${item.categoryName || ""}`}
                    >
                      {item.Product} {item.categoryName ? `(${item.categoryName})` : ""}
                    </AutocompleteItem>
                  )}
                </Autocomplete>
              </div>

              {(() => {
                if (!selectedProductForVariants) return null;

                const selectedProductData = categories
                  .flatMap((c: Category) => c.products)
                  .find((p) => p.id === selectedProductForVariants);
                const isLoadingSelectedVariants = loadingVariantProductIds.has(
                  selectedProductForVariants
                );

                if (!selectedProductData) return null;

                return (
                  <>
                    {isLoadingSelectedVariants && (
                      <div className="mt-2 mb-2 inline-flex items-center gap-2 text-sm text-blue-600">
                        <span className="inline-block h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                        Loading variants...
                      </div>
                    )}

                    <div className="mt-4">
                      {useNewVariantSystem ? (
                        <VariantManager
                          productId={selectedProductForVariants}
                          variants={
                            Array.isArray(selectedProductData.variants)
                              ? selectedProductData.variants
                              : []
                          }
                          onRefetchProducts={fetchCategories}
                          onVariantsChange={(newVariants) => {
                            // Update the product in the categories state
                            setCategories((prevCategories) =>
                              prevCategories.map((category) => ({
                                ...category,
                                products: category.products.map((p) =>
                                  p.id === selectedProductForVariants
                                    ? { ...p, variants: newVariants }
                                    : p
                                ),
                              }))
                            );
                          }}
                        />
                      ) : (
                        <VariantExtractor
                          productId={selectedProductForVariants}
                          productName={selectedProductData.Product}
                          onVariantsChange={() => {
                            // Variants updated
                          }}
                        />
                      )}
                    </div>
                  </>
                );
              })()}
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
                                                  <span>
                                                    {selectedProduct === product.id ? "▼" : "▶"}
                                                  </span>
                                                  <span className="ml-1 font-medium">
                                                    {product.Product}
                                                  </span>
                                                </div>
                                                {(product["Item Code"] ||
                                                  product.Variation ||
                                                  product.UOM ||
                                                  product.Country) && (
                                                  <div className="ml-5 mt-1 space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                                      {product.Variation && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                                                          <span className="mr-1">📦</span>
                                                          {product.Variation}
                                                        </span>
                                                      )}
                                                      {(() => {
                                                        const countryName =
                                                          product.countryName ||
                                                          (product.Country &&
                                                            countryMap[String(product.Country)]
                                                              ?.name);

                                                        if (countryName) {
                                                          return (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-50 text-green-700 font-medium">
                                                              <span className="mr-1">🌍</span>
                                                              {countryName}
                                                            </span>
                                                          );
                                                        }

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
                                          {editingProductId === product.id ? (
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
                                                  if (
                                                    editingPrice === null ||
                                                    isNaN(editingPrice)
                                                  ) {
                                                    toast.error("Please enter a valid price.");
                                                    return;
                                                  }
                                                  setIsLoading(true);

                                                  const {
                                                    data: orderItems,
                                                    error: orderItemsError,
                                                  } = await supabase
                                                    .from("order_items")
                                                    .select("order_id, orders(customer_id)")
                                                    .eq("product_id", product.id);

                                                  if (orderItemsError) {
                                                    toast.error(
                                                      `Failed to fetch order items: ${orderItemsError.message}`
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

                                                  const { error: globalHistoryError } =
                                                    await supabase
                                                      .from("product_price_history")
                                                      .insert([
                                                        {
                                                          product_id: product.id,
                                                          previous_price: product.price,
                                                          original_price: editingPrice,
                                                          last_price_update:
                                                            new Date().toISOString(),
                                                          customer_id: null,
                                                        },
                                                      ]);

                                                  if (globalHistoryError) {
                                                    toast.error(
                                                      `Failed to insert global price history: ${globalHistoryError.message}`
                                                    );
                                                  }

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
                                                        toast.error(
                                                          `Failed to insert customer price history: ${insertError.message}`
                                                        );
                                                      }
                                                    }
                                                  }

                                                  const { error: updateError } = await supabase
                                                    .from("products")
                                                    .update({ price: editingPrice })
                                                    .eq("id", product.id);

                                                  if (updateError) {
                                                    toast.error(
                                                      `Failed to update product price: ${updateError.message}`
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
                                            if (
                                              product.priceHistory &&
                                              product.priceHistory.length > 0
                                            ) {
                                              return (
                                                <div className="flex flex-col space-y-1">
                                                  {product.priceHistory.map((ph, idx) => (
                                                    <span
                                                      key={idx}
                                                      className="text-xs text-gray-500"
                                                    >
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
                                              return (
                                                <span className="text-xs text-gray-400">
                                                  No history
                                                </span>
                                              );
                                            }
                                          })()}
                                        </td>
                                      </tr>
                                      {selectedProduct === product.id && (
                                        <tr>
                                          <td className="px-4 py-2 bg-gray-50" colSpan={3}>
                                            <div className="pl-8">
                                              <div className="flex justify-between items-center mb-4">
                                                <div className="flex items-center space-x-2">
                                                  <svg
                                                    className="w-5 h-5 text-gray-600"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path
                                                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                    />
                                                  </svg>
                                                  <h4 className="text-base font-semibold text-gray-800">
                                                    Previous Customers
                                                  </h4>
                                                  {(() => {
                                                    const normalizePhone = (phone?: string) =>
                                                      String(phone || "").replace(/\D/g, "");
                                                    const normalizeName = (name?: string) =>
                                                      String(name || "")
                                                        .trim()
                                                        .replace(/\s+/g, " ")
                                                        .toLowerCase();
                                                    const uniqueCustomerCount = new Set(
                                                      (product.order_items ?? []).flatMap(
                                                        (oiRaw) => {
                                                          const oi = oiRaw as {
                                                            orders?: {
                                                              customer_name: string;
                                                              customer_phone: string;
                                                              customer_id?: string;
                                                            }[];
                                                          };
                                                          const orders = Array.isArray(oi.orders)
                                                            ? oi.orders
                                                            : oi.orders
                                                              ? [oi.orders]
                                                              : [];
                                                          return orders.map((order) => {
                                                            const phoneKey = normalizePhone(
                                                              order.customer_phone
                                                            );
                                                            const nameKey = normalizeName(
                                                              order.customer_name
                                                            );
                                                            const idKey = String(
                                                              order.customer_id || ""
                                                            ).trim();
                                                            return phoneKey || nameKey || idKey;
                                                          });
                                                        }
                                                      )
                                                    ).size;

                                                    return uniqueCustomerCount > 0 ? (
                                                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                                        {uniqueCustomerCount} customer
                                                        {uniqueCustomerCount !== 1 ? "s" : ""}
                                                      </span>
                                                    ) : null;
                                                  })()}
                                                </div>
                                                {Object.keys(offerPrices).some((key) =>
                                                  key.startsWith(`${product.id}-`)
                                                ) && (
                                                  <button
                                                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all"
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
                                                    <svg
                                                      className="w-3.5 h-3.5 inline mr-1"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      viewBox="0 0 24 24"
                                                    >
                                                      <path
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                      />
                                                    </svg>
                                                    Clear All
                                                  </button>
                                                )}
                                              </div>

                                              <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
                                                <div className="flex justify-between items-center mb-3">
                                                  <div className="flex items-center space-x-2">
                                                    <svg
                                                      className="w-5 h-5 text-blue-600"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      viewBox="0 0 24 24"
                                                    >
                                                      <path
                                                        d="M12 4v16m8-8H4"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                      />
                                                    </svg>
                                                    <h5 className="text-sm font-semibold text-gray-800">
                                                      Send Custom Price Offer
                                                    </h5>
                                                    {allCustomers.length > 0 && (
                                                      <button
                                                        className="ml-2 px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 border border-purple-300 rounded-lg hover:bg-purple-200 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-all"
                                                        title="Select all customers"
                                                        type="button"
                                                        onClick={() => {
                                                          setSelectedCustomersForOffer((prev) => ({
                                                            ...prev,
                                                            [product.id]: allCustomers.map(
                                                              (customer) => String(customer.id)
                                                            ),
                                                          }));
                                                        }}
                                                      >
                                                        <svg
                                                          className="w-3.5 h-3.5 inline mr-1"
                                                          fill="none"
                                                          stroke="currentColor"
                                                          viewBox="0 0 24 24"
                                                        >
                                                          <path
                                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                          />
                                                        </svg>
                                                        Select All
                                                      </button>
                                                    )}
                                                  </div>
                                                  {allCustomers.length > 0 && (
                                                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                                      {allCustomers.length} customer
                                                      {allCustomers.length !== 1 ? "s" : ""}{" "}
                                                      available
                                                    </span>
                                                  )}
                                                </div>

                                                <div className="space-y-3">
                                                  <div className="flex items-center gap-2">
                                                    <div className="flex-1 relative customer-dropdown-container">
                                                      <button
                                                        className="w-full pl-10 pr-10 py-2.5 text-left text-sm border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all flex items-center justify-between"
                                                        disabled={isLoadingCustomers}
                                                        type="button"
                                                        onClick={() => {
                                                          setIsCustomerDropdownOpen((prev) => ({
                                                            ...prev,
                                                            [product.id]: !prev[product.id],
                                                          }));
                                                        }}
                                                      >
                                                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                                                          <div className="absolute left-3 flex items-center pointer-events-none">
                                                            <svg
                                                              className="w-4 h-4 text-gray-400"
                                                              fill="none"
                                                              stroke="currentColor"
                                                              viewBox="0 0 24 24"
                                                            >
                                                              <path
                                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                              />
                                                            </svg>
                                                          </div>
                                                          <span className="pl-6 truncate text-gray-700">
                                                            {isLoadingCustomers
                                                              ? "⏳ Loading customers..."
                                                              : (selectedCustomersForOffer[
                                                                    product.id
                                                                  ]?.length || 0) > 0
                                                                ? `${selectedCustomersForOffer[product.id].length} customer${selectedCustomersForOffer[product.id].length !== 1 ? "s" : ""} selected`
                                                                : allCustomers.length === 0
                                                                  ? "⚠️ No customers found - Click refresh"
                                                                  : "👤 Select customer(s)..."}
                                                          </span>
                                                        </div>
                                                        <svg
                                                          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isCustomerDropdownOpen[product.id] ? "transform rotate-180" : ""}`}
                                                          fill="none"
                                                          stroke="currentColor"
                                                          viewBox="0 0 24 24"
                                                        >
                                                          <path
                                                            d="M19 9l-7 7-7-7"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                          />
                                                        </svg>
                                                      </button>

                                                      {isCustomerDropdownOpen[product.id] &&
                                                        !isLoadingCustomers && (
                                                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                                                            {allCustomers.length === 0 ? (
                                                              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                                No customers found
                                                              </div>
                                                            ) : (
                                                              <div className="py-1">
                                                                <div className="px-3 pb-2 border-b border-gray-200">
                                                                  <input
                                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                    placeholder="Search by name, phone, or email"
                                                                    type="text"
                                                                    value={
                                                                      customerOfferSearchQuery[
                                                                        product.id
                                                                      ] || ""
                                                                    }
                                                                    onChange={(e) => {
                                                                      const query = e.target.value;
                                                                      setCustomerOfferSearchQuery(
                                                                        (prev) => ({
                                                                          ...prev,
                                                                          [product.id]: query,
                                                                        })
                                                                      );
                                                                    }}
                                                                  />
                                                                </div>
                                                                <div className="max-h-72 overflow-auto">
                                                                  {(() => {
                                                                    const selectedIds = new Set(
                                                                      selectedCustomersForOffer[
                                                                        product.id
                                                                      ] || []
                                                                    );
                                                                    const searchTerm = String(
                                                                      customerOfferSearchQuery[
                                                                        product.id
                                                                      ] || ""
                                                                    )
                                                                      .trim()
                                                                      .toLowerCase();
                                                                    const filteredCustomers =
                                                                      searchTerm.length === 0
                                                                        ? allCustomers
                                                                        : allCustomers.filter(
                                                                            (customer) => {
                                                                              const haystack = [
                                                                                customer.name,
                                                                                customer.phone,
                                                                                customer.email,
                                                                              ]
                                                                                .filter(Boolean)
                                                                                .join(" ")
                                                                                .toLowerCase();
                                                                              return haystack.includes(
                                                                                searchTerm
                                                                              );
                                                                            }
                                                                          );
                                                                    const allSelected =
                                                                      allCustomers.length > 0 &&
                                                                      selectedIds.size ===
                                                                        allCustomers.length;
                                                                    return (
                                                                      <>
                                                                        <button
                                                                          className="w-full px-4 py-2.5 text-left hover:bg-purple-50 transition-colors border-b border-gray-200 bg-purple-50"
                                                                          type="button"
                                                                          onClick={() => {
                                                                            setSelectedCustomersForOffer(
                                                                              (prev) => ({
                                                                                ...prev,
                                                                                [product.id]:
                                                                                  allSelected
                                                                                    ? []
                                                                                    : allCustomers.map(
                                                                                        (
                                                                                          customer
                                                                                        ) =>
                                                                                          String(
                                                                                            customer.id
                                                                                          )
                                                                                      ),
                                                                              })
                                                                            );
                                                                          }}
                                                                        >
                                                                          <div className="flex items-center space-x-3">
                                                                            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-purple-500">
                                                                              <svg
                                                                                className="w-4 h-4 text-white"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                              >
                                                                                <path
                                                                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                                  strokeLinecap="round"
                                                                                  strokeLinejoin="round"
                                                                                  strokeWidth={2}
                                                                                />
                                                                              </svg>
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                              <div className="font-semibold text-purple-700">
                                                                                {allSelected
                                                                                  ? "Clear Selection"
                                                                                  : "Select All Customers"}
                                                                              </div>
                                                                              <div className="text-xs text-purple-600 mt-0.5">
                                                                                {allSelected
                                                                                  ? "No customers selected"
                                                                                  : "Send to all"}{" "}
                                                                                {
                                                                                  allCustomers.length
                                                                                }{" "}
                                                                                customer
                                                                                {allCustomers.length !==
                                                                                1
                                                                                  ? "s"
                                                                                  : ""}
                                                                              </div>
                                                                            </div>
                                                                          </div>
                                                                        </button>
                                                                        {filteredCustomers.length ===
                                                                          0 && (
                                                                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                                            No matching customers
                                                                          </div>
                                                                        )}
                                                                        {filteredCustomers.map(
                                                                          (customer) => {
                                                                            const isSelected =
                                                                              selectedIds.has(
                                                                                String(customer.id)
                                                                              );
                                                                            return (
                                                                              <button
                                                                                key={String(
                                                                                  customer.id
                                                                                )}
                                                                                className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                                                                                  isSelected
                                                                                    ? "bg-blue-100 border-l-4 border-blue-500"
                                                                                    : ""
                                                                                }`}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                  setSelectedCustomersForOffer(
                                                                                    (prev) => {
                                                                                      const existing =
                                                                                        new Set(
                                                                                          prev[
                                                                                            product
                                                                                              .id
                                                                                          ] || []
                                                                                        );
                                                                                      const id =
                                                                                        String(
                                                                                          customer.id
                                                                                        );
                                                                                      if (
                                                                                        existing.has(
                                                                                          id
                                                                                        )
                                                                                      ) {
                                                                                        existing.delete(
                                                                                          id
                                                                                        );
                                                                                      } else {
                                                                                        existing.add(
                                                                                          id
                                                                                        );
                                                                                      }
                                                                                      return {
                                                                                        ...prev,
                                                                                        [product.id]:
                                                                                          Array.from(
                                                                                            existing
                                                                                          ),
                                                                                      };
                                                                                    }
                                                                                  );
                                                                                }}
                                                                              >
                                                                                <div className="flex items-center space-x-3">
                                                                                  <div
                                                                                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                                                                      isSelected
                                                                                        ? "bg-blue-500"
                                                                                        : "bg-gray-200"
                                                                                    }`}
                                                                                  >
                                                                                    <span
                                                                                      className={`text-xs font-semibold ${
                                                                                        isSelected
                                                                                          ? "text-white"
                                                                                          : "text-gray-600"
                                                                                      }`}
                                                                                    >
                                                                                      {(
                                                                                        customer.name ||
                                                                                        "U"
                                                                                      )
                                                                                        .charAt(0)
                                                                                        .toUpperCase()}
                                                                                    </span>
                                                                                  </div>
                                                                                  <div className="flex-1 min-w-0">
                                                                                    <div
                                                                                      className={`font-medium truncate ${
                                                                                        isSelected
                                                                                          ? "text-blue-700"
                                                                                          : "text-gray-900"
                                                                                      }`}
                                                                                    >
                                                                                      {customer.name ||
                                                                                        "Unnamed Customer"}
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500 truncate mt-0.5">
                                                                                      {customer.phone && (
                                                                                        <span>
                                                                                          {
                                                                                            customer.phone
                                                                                          }
                                                                                        </span>
                                                                                      )}
                                                                                      {customer.phone &&
                                                                                        customer.email && (
                                                                                          <span className="mx-1">
                                                                                            •
                                                                                          </span>
                                                                                        )}
                                                                                      {customer.email && (
                                                                                        <span>
                                                                                          {
                                                                                            customer.email
                                                                                          }
                                                                                        </span>
                                                                                      )}
                                                                                    </div>
                                                                                  </div>
                                                                                  {isSelected && (
                                                                                    <svg
                                                                                      className="w-5 h-5 text-blue-500 flex-shrink-0"
                                                                                      fill="none"
                                                                                      stroke="currentColor"
                                                                                      viewBox="0 0 24 24"
                                                                                    >
                                                                                      <path
                                                                                        d="M5 13l4 4L19 7"
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth={
                                                                                          2
                                                                                        }
                                                                                      />
                                                                                    </svg>
                                                                                  )}
                                                                                </div>
                                                                              </button>
                                                                            );
                                                                          }
                                                                        )}
                                                                      </>
                                                                    );
                                                                  })()}
                                                                </div>
                                                              </div>
                                                            )}
                                                          </div>
                                                        )}
                                                    </div>
                                                    {!isLoadingCustomers && (
                                                      <button
                                                        className="px-3 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all shadow-sm"
                                                        title="Refresh customer list"
                                                        onClick={() => fetchAllCustomers()}
                                                      >
                                                        <svg
                                                          className="w-4 h-4"
                                                          fill="none"
                                                          stroke="currentColor"
                                                          viewBox="0 0 24 24"
                                                        >
                                                          <path
                                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                          />
                                                        </svg>
                                                      </button>
                                                    )}
                                                  </div>

                                                  {(selectedCustomersForOffer[product.id]?.length ||
                                                    0) > 0 && (
                                                    <div className="flex flex-wrap items-center gap-2">
                                                      {(
                                                        selectedCustomersForOffer[product.id] || []
                                                      ).map((customerId) => {
                                                        const cid = String(customerId);
                                                        const c = allCustomers.find(
                                                          (x) => String(x.id) === cid
                                                        );
                                                        const primary =
                                                          c?.name?.trim() || "Unnamed customer";
                                                        const secondary =
                                                          c?.phone || c?.email || "";
                                                        const chipLabel = secondary
                                                          ? `${primary} · ${secondary}`
                                                          : primary;
                                                        return (
                                                          <span
                                                            key={cid}
                                                            className="inline-flex max-w-full items-center gap-1 rounded-full border border-blue-200 bg-blue-50 py-0.5 pl-2.5 pr-0.5 text-xs text-blue-800"
                                                            title={chipLabel}
                                                          >
                                                            <span className="max-w-[14rem] truncate">
                                                              {chipLabel}
                                                            </span>
                                                            <button
                                                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                              title={`Remove ${primary}`}
                                                              type="button"
                                                              onClick={() => {
                                                                setSelectedCustomersForOffer(
                                                                  (prev) => ({
                                                                    ...prev,
                                                                    [product.id]: (
                                                                      prev[product.id] || []
                                                                    ).filter(
                                                                      (id) => String(id) !== cid
                                                                    ),
                                                                  })
                                                                );
                                                              }}
                                                            >
                                                              <svg
                                                                className="h-3.5 w-3.5"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                              >
                                                                <path
                                                                  d="M6 18L18 6M6 6l12 12"
                                                                  strokeLinecap="round"
                                                                  strokeLinejoin="round"
                                                                  strokeWidth={2}
                                                                />
                                                              </svg>
                                                            </button>
                                                          </span>
                                                        );
                                                      })}
                                                    </div>
                                                  )}

                                                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                                    <div className="flex-1 flex items-center gap-2">
                                                      <div className="relative flex-1">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                          <span className="text-gray-500 text-sm font-medium">
                                                            $
                                                          </span>
                                                        </div>
                                                        <input
                                                          className="w-full pl-7 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                                          min="0"
                                                          placeholder="0.00"
                                                          step="0.01"
                                                          type="number"
                                                          value={
                                                            customPriceForSelectedCustomer[
                                                              `custom-selected-${product.id}`
                                                            ] || ""
                                                          }
                                                          onChange={(e) => {
                                                            const value = e.target.value;
                                                            const key = `custom-selected-${product.id}`;
                                                            if (
                                                              value === "" ||
                                                              value === null ||
                                                              value === undefined
                                                            ) {
                                                              setCustomPriceForSelectedCustomer(
                                                                (prev) => {
                                                                  const newState = { ...prev };
                                                                  delete newState[key];
                                                                  return newState;
                                                                }
                                                              );
                                                            } else {
                                                              const numValue = Number(value);
                                                              if (!isNaN(numValue)) {
                                                                setCustomPriceForSelectedCustomer(
                                                                  (prev) => ({
                                                                    ...prev,
                                                                    [key]: numValue,
                                                                  })
                                                                );
                                                              }
                                                            }
                                                          }}
                                                          onFocus={(e) => {
                                                            e.target.select();
                                                          }}
                                                        />
                                                      </div>
                                                      <>
                                                        <button
                                                          className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                                          disabled={
                                                            (selectedCustomersForOffer[product.id]
                                                              ?.length || 0) === 0
                                                          }
                                                          onClick={async () => {
                                                            const selectedCustomerIds = (
                                                              selectedCustomersForOffer[
                                                                product.id
                                                              ] || []
                                                            )
                                                              .map((id) => String(id).trim())
                                                              .filter(Boolean);
                                                            if (selectedCustomerIds.length === 0) {
                                                              toast.error(
                                                                "Please select at least one customer"
                                                              );
                                                              return;
                                                            }
                                                            const key = `custom-selected-${product.id}`;
                                                            const price =
                                                              customPriceForSelectedCustomer[key];
                                                            if (!price || price <= 0) {
                                                              toast.error(
                                                                "Please enter a valid price"
                                                              );
                                                              return;
                                                            }

                                                            try {
                                                              const offers =
                                                                selectedCustomerIds.map(
                                                                  (customerId) => ({
                                                                    customer_id: customerId,
                                                                    product_id: product.id,
                                                                    offered_price: price,
                                                                    previous_price: product.price,
                                                                    created_at:
                                                                      new Date().toISOString(),
                                                                  })
                                                                );

                                                              await insertPriceOffersWithFallback(
                                                                offers
                                                              );
                                                              await fetchCategories();

                                                              setSelectedCustomersForOffer(
                                                                (prev) => ({
                                                                  ...prev,
                                                                  [product.id]: [],
                                                                })
                                                              );
                                                              setCustomPriceForSelectedCustomer(
                                                                (prev) => {
                                                                  const newState = { ...prev };
                                                                  delete newState[key];
                                                                  return newState;
                                                                }
                                                              );
                                                              toast.success(
                                                                `Offer sent successfully to ${selectedCustomerIds.length} customer${selectedCustomerIds.length !== 1 ? "s" : ""} for $${price.toFixed(2)}`
                                                              );
                                                            } catch (err) {
                                                              console.error(
                                                                "Failed to insert multi custom price offers",
                                                                {
                                                                  error: err,
                                                                  selectedCustomerCount:
                                                                    selectedCustomerIds.length,
                                                                  productId: product.id,
                                                                  price,
                                                                }
                                                              );
                                                              toast.error(
                                                                `Failed to send offers: ${getReadableErrorMessage(err, "Unexpected error (check browser console for details)")}`
                                                              );
                                                            }
                                                          }}
                                                        >
                                                          <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                          >
                                                            <path
                                                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                                              strokeLinecap="round"
                                                              strokeLinejoin="round"
                                                              strokeWidth={2}
                                                            />
                                                          </svg>
                                                          Send Offer
                                                        </button>
                                                        <button
                                                          className="px-3 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-800 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition-all"
                                                          title="Clear selection"
                                                          onClick={() => {
                                                            const key = `custom-selected-${product.id}`;
                                                            setCustomPriceForSelectedCustomer(
                                                              (prev) => {
                                                                const newState = { ...prev };
                                                                delete newState[key];
                                                                return newState;
                                                              }
                                                            );
                                                            setSelectedCustomersForOffer(
                                                              (prev) => ({
                                                                ...prev,
                                                                [product.id]: [],
                                                              })
                                                            );
                                                          }}
                                                        >
                                                          <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                          >
                                                            <path
                                                              d="M6 18L18 6M6 6l12 12"
                                                              strokeLinecap="round"
                                                              strokeLinejoin="round"
                                                              strokeWidth={2}
                                                            />
                                                          </svg>
                                                        </button>
                                                      </>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                              {(() => {
                                                const getHistoryTimestamp = (entry: {
                                                  last_price_update?: string;
                                                  created_at?: string;
                                                }) => {
                                                  const ts = new Date(
                                                    entry.last_price_update || entry.created_at || 0
                                                  ).getTime();
                                                  return Number.isFinite(ts) ? ts : 0;
                                                };
                                                const normalizePhone = (phone?: string) =>
                                                  String(phone || "").replace(/\D/g, "");
                                                const normalizeName = (name?: string) =>
                                                  String(name || "")
                                                    .trim()
                                                    .replace(/\s+/g, " ")
                                                    .toLowerCase();
                                                const globalPrice = product.price;
                                                const latestGlobalPriceUpdateTime = (
                                                  product.priceHistory || []
                                                ).reduce<number | null>((latestTs, entry) => {
                                                  const ts = getHistoryTimestamp(entry);
                                                  if (ts <= 0) return latestTs;
                                                  if (latestTs === null) return ts;
                                                  return ts > latestTs ? ts : latestTs;
                                                }, null);

                                                const getCurrentPriceForMatchingIds = (
                                                  matchingCustomerIds: Set<string>
                                                ) => {
                                                  const eligibleCustomerPriceEntries = (
                                                    product.customerPriceHistory || []
                                                  )
                                                    .filter((entry) =>
                                                      matchingCustomerIds.has(
                                                        String(entry.customer_id).trim()
                                                      )
                                                    )
                                                    .filter((entry) => {
                                                      const entryTime = getHistoryTimestamp(entry);
                                                      if (!Number.isFinite(entryTime)) {
                                                        return false;
                                                      }
                                                      if (latestGlobalPriceUpdateTime === null) {
                                                        return true;
                                                      }
                                                      return (
                                                        entryTime > latestGlobalPriceUpdateTime
                                                      );
                                                    });

                                                  const latestEligibleCustomerSpecificPrice =
                                                    eligibleCustomerPriceEntries.reduce<{
                                                      original_price: number;
                                                      last_price_update?: string;
                                                      created_at?: string;
                                                    } | null>((latest, entry) => {
                                                      if (!latest) return entry;
                                                      const latestTime =
                                                        getHistoryTimestamp(latest);
                                                      const entryTime = getHistoryTimestamp(entry);
                                                      return entryTime > latestTime
                                                        ? entry
                                                        : latest;
                                                    }, null);

                                                  return latestEligibleCustomerSpecificPrice
                                                    ? latestEligibleCustomerSpecificPrice.original_price
                                                    : globalPrice;
                                                };

                                                const previousCustomersMap = new Map<
                                                  string,
                                                  {
                                                    customer_name: string;
                                                    customer_phone: string;
                                                    customer_id?: string;
                                                    dedupe_key: string;
                                                    order_id: number;
                                                    last_purchased_price?: number;
                                                    current_price_for_customer: number;
                                                  }
                                                >();

                                                (product.order_items ?? []).forEach((oiRaw) => {
                                                  const oi = oiRaw as {
                                                    order_id: number;
                                                    price?: number;
                                                    orders?: {
                                                      customer_name: string;
                                                      customer_phone: string;
                                                      customer_id?: string;
                                                    }[];
                                                  };

                                                  const orders = Array.isArray(oi.orders)
                                                    ? oi.orders
                                                    : oi.orders
                                                      ? [oi.orders]
                                                      : [];

                                                  orders.forEach((order) => {
                                                    const phoneKey = normalizePhone(
                                                      order.customer_phone
                                                    );
                                                    const nameKey = normalizeName(
                                                      order.customer_name
                                                    );
                                                    const idKey = String(
                                                      order.customer_id || ""
                                                    ).trim();
                                                    const customerKey =
                                                      phoneKey || nameKey || idKey;
                                                    if (!customerKey) return;

                                                    const existing =
                                                      previousCustomersMap.get(customerKey);
                                                    if (
                                                      !existing ||
                                                      (oi.order_id ?? 0) > (existing.order_id ?? 0)
                                                    ) {
                                                      const customerId = String(
                                                        order.customer_id || ""
                                                      ).trim();
                                                      const matchingCustomerIds = new Set<string>();
                                                      if (customerId) {
                                                        matchingCustomerIds.add(customerId);
                                                      }

                                                      const orderPhone = normalizePhone(
                                                        order.customer_phone
                                                      );
                                                      const orderName = normalizeName(
                                                        order.customer_name
                                                      );

                                                      (allCustomers || []).forEach(
                                                        (customerRow) => {
                                                          const rowId = String(
                                                            customerRow.id || ""
                                                          ).trim();
                                                          if (!rowId) return;

                                                          const rowPhone = normalizePhone(
                                                            customerRow.phone || undefined
                                                          );
                                                          const rowName = normalizeName(
                                                            customerRow.name || ""
                                                          );

                                                          if (
                                                            (orderPhone &&
                                                              rowPhone &&
                                                              orderPhone === rowPhone) ||
                                                            (orderName &&
                                                              rowName &&
                                                              orderName === rowName)
                                                          ) {
                                                            matchingCustomerIds.add(rowId);
                                                          }
                                                        }
                                                      );

                                                      const currentPriceForCustomer =
                                                        getCurrentPriceForMatchingIds(
                                                          matchingCustomerIds
                                                        );

                                                      previousCustomersMap.set(customerKey, {
                                                        customer_name: order.customer_name,
                                                        customer_phone: order.customer_phone,
                                                        customer_id: order.customer_id,
                                                        dedupe_key: customerKey,
                                                        order_id: oi.order_id,
                                                        last_purchased_price: oi.price,
                                                        current_price_for_customer:
                                                          currentPriceForCustomer,
                                                      });
                                                    }
                                                  });
                                                });

                                                const coveredCustomerIds = new Set<string>();
                                                previousCustomersMap.forEach((row) => {
                                                  const oid = String(row.customer_id || "").trim();
                                                  if (oid) {
                                                    coveredCustomerIds.add(oid);
                                                    return;
                                                  }
                                                  const orderPhone = normalizePhone(
                                                    row.customer_phone
                                                  );
                                                  const orderName = normalizeName(
                                                    row.customer_name
                                                  );
                                                  (allCustomers || []).forEach((customerRow) => {
                                                    const rowId = String(
                                                      customerRow.id || ""
                                                    ).trim();
                                                    if (!rowId) return;
                                                    const rowPhone = normalizePhone(
                                                      customerRow.phone || undefined
                                                    );
                                                    const rowName = normalizeName(
                                                      customerRow.name || ""
                                                    );
                                                    if (
                                                      (orderPhone &&
                                                        rowPhone &&
                                                        orderPhone === rowPhone) ||
                                                      (orderName &&
                                                        rowName &&
                                                        orderName === rowName)
                                                    ) {
                                                      coveredCustomerIds.add(rowId);
                                                    }
                                                  });
                                                });

                                                const historyCustomerIds = [
                                                  ...new Set(
                                                    (product.customerPriceHistory || [])
                                                      .map((entry) =>
                                                        String(entry.customer_id ?? "").trim()
                                                      )
                                                      .filter(Boolean)
                                                  ),
                                                ];

                                                historyCustomerIds.forEach((custId) => {
                                                  if (coveredCustomerIds.has(custId)) return;

                                                  const profile = (allCustomers || []).find(
                                                    (c) => String(c.id).trim() === custId
                                                  );
                                                  const customer_name =
                                                    profile?.name?.trim() ||
                                                    profile?.email?.split("@")[0] ||
                                                    `Customer (${custId.slice(0, 8)}…)`;
                                                  const customer_phone = profile?.phone || "";

                                                  const phoneKey = normalizePhone(customer_phone);
                                                  const nameKey = normalizeName(customer_name);
                                                  let mapKey =
                                                    phoneKey || nameKey || `id:${custId}`;

                                                  if (previousCustomersMap.has(mapKey)) {
                                                    const existing =
                                                      previousCustomersMap.get(mapKey);
                                                    if (
                                                      existing &&
                                                      String(existing.customer_id || "").trim() ===
                                                        custId
                                                    ) {
                                                      return;
                                                    }
                                                    if (existing) {
                                                      mapKey = `${mapKey}:record:${custId}`;
                                                    }
                                                  }

                                                  previousCustomersMap.set(mapKey, {
                                                    customer_name,
                                                    customer_phone,
                                                    customer_id: custId,
                                                    dedupe_key: mapKey,
                                                    order_id: 0,
                                                    last_purchased_price: undefined,
                                                    current_price_for_customer:
                                                      getCurrentPriceForMatchingIds(
                                                        new Set([custId])
                                                      ),
                                                  });
                                                });

                                                const enrichPreviousCustomerFromDirectory = (row: {
                                                  customer_name: string;
                                                  customer_phone: string;
                                                  customer_id?: string;
                                                  dedupe_key: string;
                                                  order_id: number;
                                                  last_purchased_price?: number;
                                                  current_price_for_customer: number;
                                                }) => {
                                                  const id = String(row.customer_id || "").trim();
                                                  const orderPhone = normalizePhone(
                                                    row.customer_phone
                                                  );
                                                  const orderName = normalizeName(
                                                    row.customer_name
                                                  );

                                                  const byId = id
                                                    ? (allCustomers || []).find(
                                                        (c) => String(c.id).trim() === id
                                                      )
                                                    : undefined;
                                                  const byOrderPhone = orderPhone
                                                    ? (allCustomers || []).find(
                                                        (c) =>
                                                          normalizePhone(c.phone || undefined) ===
                                                          orderPhone
                                                      )
                                                    : undefined;

                                                  const nameMatches = orderName
                                                    ? (allCustomers || []).filter(
                                                        (c) =>
                                                          normalizeName(c.name || "") === orderName
                                                      )
                                                    : [];

                                                  let profile:
                                                    | (typeof allCustomers)[number]
                                                    | undefined;

                                                  if (nameMatches.length === 1) {
                                                    profile = nameMatches[0];
                                                  } else if (nameMatches.length > 1) {
                                                    const linkedToOrder = id
                                                      ? nameMatches.find(
                                                          (c) => String(c.id).trim() === id
                                                        )
                                                      : undefined;
                                                    const withUser = nameMatches.filter(
                                                      (c) => c.user_id
                                                    );
                                                    const phoneMatchesOrder = orderPhone
                                                      ? nameMatches.find(
                                                          (c) =>
                                                            normalizePhone(c.phone || undefined) ===
                                                            orderPhone
                                                        )
                                                      : undefined;

                                                    if (withUser.length === 1) {
                                                      profile = withUser[0];
                                                    } else if (withUser.length > 1) {
                                                      profile =
                                                        (id
                                                          ? withUser.find(
                                                              (c) => String(c.id).trim() === id
                                                            )
                                                          : undefined) ||
                                                        phoneMatchesOrder ||
                                                        withUser[0];
                                                    } else {
                                                      profile =
                                                        linkedToOrder ||
                                                        phoneMatchesOrder ||
                                                        nameMatches[0];
                                                    }
                                                  } else {
                                                    profile = byId || byOrderPhone;
                                                  }

                                                  if (!profile) return row;

                                                  const dirPhone = profile.phone
                                                    ? String(profile.phone).trim()
                                                    : "";
                                                  const dirName = profile.name
                                                    ? profile.name.trim()
                                                    : "";

                                                  const pricingIds = new Set<string>();
                                                  if (nameMatches.length > 1) {
                                                    nameMatches.forEach((c) =>
                                                      pricingIds.add(String(c.id).trim())
                                                    );
                                                  } else {
                                                    if (id) pricingIds.add(id);
                                                    pricingIds.add(String(profile.id).trim());
                                                  }
                                                  pricingIds.delete("");

                                                  const current_price_for_customer =
                                                    pricingIds.size > 0
                                                      ? getCurrentPriceForMatchingIds(pricingIds)
                                                      : row.current_price_for_customer;

                                                  return {
                                                    ...row,
                                                    customer_id: String(profile.id).trim(),
                                                    customer_name: dirName || row.customer_name,
                                                    customer_phone: dirPhone || row.customer_phone,
                                                    current_price_for_customer,
                                                  };
                                                };

                                                const previousCustomers = Array.from(
                                                  previousCustomersMap.values()
                                                )
                                                  .map(enrichPreviousCustomerFromDirectory)
                                                  .sort((a, b) => b.order_id - a.order_id);

                                                return previousCustomers.map((customer) => {
                                                  const offerKey = `${product.id}-${customer.dedupe_key}`;
                                                  return (
                                                    <div
                                                      key={`${product.id}-${customer.dedupe_key}`}
                                                      className="mb-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                                    >
                                                      <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center space-x-3">
                                                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                                                            <svg
                                                              className="w-5 h-5 text-blue-600"
                                                              fill="none"
                                                              stroke="currentColor"
                                                              viewBox="0 0 24 24"
                                                            >
                                                              <path
                                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                              />
                                                            </svg>
                                                          </div>
                                                          <div>
                                                            <div className="flex items-center space-x-2">
                                                              <span className="font-semibold text-gray-800">
                                                                {customer.customer_name}
                                                              </span>
                                                              {customer.customer_phone && (
                                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                                  {customer.customer_phone}
                                                                </span>
                                                              )}
                                                            </div>
                                                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                              <div className="rounded-md bg-gray-50 px-2.5 py-1.5">
                                                                <div className="text-[11px] leading-4 text-gray-500">
                                                                  Last purchased
                                                                </div>
                                                                <div className="text-sm leading-5 font-medium text-gray-700">
                                                                  {customer.last_purchased_price !=
                                                                  undefined ? (
                                                                    <>
                                                                      $
                                                                      {customer.last_purchased_price.toFixed(
                                                                        2
                                                                      )}
                                                                    </>
                                                                  ) : (
                                                                    <span className="text-gray-400 font-normal">
                                                                      No orders yet
                                                                    </span>
                                                                  )}
                                                                </div>
                                                              </div>
                                                              <div className="rounded-md bg-blue-50 px-2.5 py-1.5">
                                                                <div
                                                                  className="text-[11px] leading-4 text-blue-600 cursor-help"
                                                                  title="Current is what this customer sees: custom price only if it was set after the latest global update, otherwise global price."
                                                                >
                                                                  Current
                                                                </div>
                                                                <div className="text-sm leading-5 font-medium text-blue-700">
                                                                  $
                                                                  {customer.current_price_for_customer.toFixed(
                                                                    2
                                                                  )}
                                                                </div>
                                                              </div>
                                                              <div className="rounded-md bg-purple-50 px-2.5 py-1.5">
                                                                <div
                                                                  className="text-[11px] leading-4 text-purple-600 cursor-help"
                                                                  title="Global is the product base price applied to all customers."
                                                                >
                                                                  Global
                                                                </div>
                                                                <div className="text-sm leading-5 font-medium text-purple-700">
                                                                  ${globalPrice.toFixed(2)}
                                                                </div>
                                                              </div>
                                                            </div>
                                                          </div>
                                                        </div>
                                                        {customer.customer_id && (
                                                          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                                            ID: {customer.customer_id}
                                                          </span>
                                                        )}
                                                      </div>
                                                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                                        <div className="relative flex-1">
                                                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <span className="text-gray-500 text-sm font-medium">
                                                              $
                                                            </span>
                                                          </div>
                                                          <input
                                                            className="w-full pl-7 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                                            min="0"
                                                            placeholder="Enter offer price"
                                                            step="0.01"
                                                            type="number"
                                                            value={offerPrices[offerKey] || ""}
                                                            onBlur={(e) => {
                                                              // Validate and clean up on blur
                                                              const key = offerKey;
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
                                                              const key = offerKey;
                                                              const value = e.target.value;

                                                              if (
                                                                value === "" ||
                                                                value === null ||
                                                                value === undefined
                                                              ) {
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
                                                              e.target.select();
                                                            }}
                                                          />
                                                        </div>
                                                        {offerPrices[offerKey] && (
                                                          <button
                                                            className="px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all"
                                                            title="Clear offer price"
                                                            type="button"
                                                            onClick={() => {
                                                              const key = offerKey;
                                                              setOfferPrices((prev) => {
                                                                const newState = { ...prev };
                                                                delete newState[key];
                                                                return newState;
                                                              });
                                                            }}
                                                          >
                                                            <svg
                                                              className="w-4 h-4"
                                                              fill="none"
                                                              stroke="currentColor"
                                                              viewBox="0 0 24 24"
                                                            >
                                                              <path
                                                                d="M6 18L18 6M6 6l12 12"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                              />
                                                            </svg>
                                                          </button>
                                                        )}
                                                        <button
                                                          className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                          disabled={!offerPrices[offerKey]}
                                                          onClick={async () => {
                                                            const key = offerKey;
                                                            const currentOfferPrice =
                                                              offerPrices[key];
                                                            if (!currentOfferPrice) {
                                                              toast.error(
                                                                "Please enter an offer price"
                                                              );
                                                              return;
                                                            }
                                                            const resolvedCustomerId = (() => {
                                                              const directId = String(
                                                                customer.customer_id || ""
                                                              ).trim();
                                                              if (directId) return directId;

                                                              const customerPhone = normalizePhone(
                                                                customer.customer_phone
                                                              );
                                                              const customerName = normalizeName(
                                                                customer.customer_name
                                                              );

                                                              const match = (
                                                                allCustomers || []
                                                              ).find((row) => {
                                                                const rowId = String(
                                                                  row.id || ""
                                                                ).trim();
                                                                if (!rowId) return false;
                                                                const rowPhone = normalizePhone(
                                                                  row.phone || undefined
                                                                );
                                                                const rowName = normalizeName(
                                                                  row.name || ""
                                                                );
                                                                return (
                                                                  (customerPhone &&
                                                                    rowPhone &&
                                                                    customerPhone === rowPhone) ||
                                                                  (customerName &&
                                                                    rowName &&
                                                                    customerName === rowName)
                                                                );
                                                              });

                                                              return match
                                                                ? String(match.id).trim()
                                                                : "";
                                                            })();

                                                            if (!resolvedCustomerId) {
                                                              toast.error(
                                                                "Customer ID not found. Please refresh customer list and try again."
                                                              );
                                                              return;
                                                            }
                                                            try {
                                                              await insertPriceOffersWithFallback([
                                                                {
                                                                  customer_id: resolvedCustomerId,
                                                                  product_id: product.id,
                                                                  offered_price: currentOfferPrice,
                                                                  previous_price:
                                                                    customer.last_purchased_price ??
                                                                    product.price,
                                                                  created_at:
                                                                    new Date().toISOString(),
                                                                },
                                                              ]);
                                                              await fetchCategories();

                                                              setOfferPrices((prev) => {
                                                                const newState = { ...prev };
                                                                delete newState[key];
                                                                return newState;
                                                              });

                                                              toast.success(
                                                                `Offer sent successfully to ${customer.customer_name} for $${currentOfferPrice.toFixed(2)}`
                                                              );
                                                            } catch (err) {
                                                              console.error(
                                                                "Failed to insert historical customer custom price offer",
                                                                {
                                                                  error: err,
                                                                  customerId: customer.customer_id,
                                                                  productId: product.id,
                                                                  price: currentOfferPrice,
                                                                }
                                                              );
                                                              toast.error(
                                                                `Failed to send offer: ${getReadableErrorMessage(err, "Unexpected error (check browser console for details)")}`
                                                              );
                                                            }
                                                          }}
                                                        >
                                                          <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                          >
                                                            <path
                                                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                                              strokeLinecap="round"
                                                              strokeLinejoin="round"
                                                              strokeWidth={2}
                                                            />
                                                          </svg>
                                                          Send Offer
                                                        </button>
                                                      </div>
                                                    </div>
                                                  );
                                                });
                                              })()}
                                              {(!product.order_items ||
                                                product.order_items.length === 0) && (
                                                <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border border-gray-200">
                                                  <svg
                                                    className="w-12 h-12 text-gray-400 mx-auto mb-3"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path
                                                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                    />
                                                  </svg>
                                                  <p className="text-sm text-gray-500 font-medium">
                                                    No previous customers found
                                                  </p>
                                                  <p className="text-xs text-gray-400 mt-1">
                                                    Use the selector above to send offers to any
                                                    customer
                                                  </p>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
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
                      {orderDetails.map((order) => {
                        const isExpanded = expandedOrderId === order.id;
                        const items = orderItems[order.id] || [];
                        return (
                          <React.Fragment key={order.id}>
                            <tr
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedOrderId(isExpanded ? null : order.id);
                                  }}
                                >
                                  <svg
                                    className={`w-5 h-5 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      d="M19 9l-7 7-7-7"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                    />
                                  </svg>
                                </button>
                              </td>
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
                              <td
                                className="px-6 py-4 whitespace-nowrap"
                                onClick={(e) => e.stopPropagation()}
                              >
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
                            {isExpanded && (
                              <tr>
                                <td className="px-6 py-4 bg-gray-50" colSpan={6}>
                                  <div className="mt-2">
                                    <div className="mb-4 pb-3 border-b border-gray-200">
                                      <div className="flex items-center space-x-4">
                                        <div>
                                          <span className="text-xs font-medium text-gray-500 uppercase">
                                            Purchase Date:
                                          </span>
                                          <p className="text-sm font-semibold text-gray-900 mt-1">
                                            {new Date(order.created_at).toLocaleString("en-US", {
                                              year: "numeric",
                                              month: "long",
                                              day: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              hour12: true,
                                            })}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                      Order Items
                                    </h4>
                                    {items.length > 0 ? (
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                          <thead className="bg-gray-100">
                                            <tr>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                Product Name
                                              </th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                Product Code
                                              </th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                Quantity
                                              </th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                Unit Price
                                              </th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                Total Price
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="bg-white divide-y divide-gray-200">
                                            {items.map((item) => (
                                              <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-sm text-gray-900">
                                                  {item.product_name}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-600">
                                                  {item.product_code || "N/A"}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-600">
                                                  {item.quantity}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-600">
                                                  ${item.price.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                                  ${item.total_price.toFixed(2)}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                          <tfoot className="bg-gray-100">
                                            <tr>
                                              <td
                                                className="px-4 py-2 text-sm font-semibold text-gray-700 text-right"
                                                colSpan={4}
                                              >
                                                Order Total:
                                              </td>
                                              <td className="px-4 py-2 text-sm font-bold text-gray-900">
                                                ${order.total_amount.toFixed(2)}
                                              </td>
                                            </tr>
                                          </tfoot>
                                        </table>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-500">
                                        No items found for this order.
                                      </p>
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
              </div>
            )}

            {!isLoading && orderDetails.length > 0 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </button>
                  <button
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={currentPage >= Math.ceil(totalOrders / pageSize)}
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(Math.ceil(totalOrders / pageSize), prev + 1)
                      )
                    }
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * pageSize, totalOrders)}
                      </span>{" "}
                      of <span className="font-medium">{totalOrders}</span> results
                    </p>
                  </div>
                  <div>
                    <nav
                      aria-label="Pagination"
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    >
                      <button
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      >
                        <span className="sr-only">Previous</span>
                        <svg
                          aria-hidden="true"
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            clipRule="evenodd"
                            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                            fillRule="evenodd"
                          />
                        </svg>
                      </button>
                      {Array.from({ length: Math.ceil(totalOrders / pageSize) }, (_, i) => i + 1)
                        .filter((page) => {
                          const totalPages = Math.ceil(totalOrders / pageSize);
                          if (totalPages <= 7) return true;
                          if (page === 1 || page === totalPages) return true;
                          if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                          return false;
                        })
                        .map((page, index, array) => {
                          const totalPages = Math.ceil(totalOrders / pageSize);
                          const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                          const showEllipsisAfter =
                            index < array.length - 1 && array[index + 1] !== page + 1;

                          return (
                            <div key={page} className="flex items-center">
                              {showEllipsisBefore && (
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                  ...
                                </span>
                              )}
                              <button
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === page
                                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                }`}
                                onClick={() => setCurrentPage(page)}
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
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={currentPage >= Math.ceil(totalOrders / pageSize)}
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(Math.ceil(totalOrders / pageSize), prev + 1)
                          )
                        }
                      >
                        <span className="sr-only">Next</span>
                        <svg
                          aria-hidden="true"
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            clipRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            fillRule="evenodd"
                          />
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
      case "pending-approvals":
        return <CustomerManagement view="pending" />;
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
                      className="block w-full px-4 py-2 text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                      href="/admin/signin-records"
                    >
                      View Full Sign-in History
                    </a>
                    <button
                      className="block w-full px-4 py-2 text-left text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md"
                      onClick={() => window.open("/admin/signin-records", "_blank")}
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

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);

      if (!["pending", "completed", "cancelled"].includes(newStatus)) {
        throw new Error("Invalid status value");
      }

      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(), // Add timestamp for when status was updated
        })
        .eq("id", orderId);

      if (error) throw error;

      setOrderDetails((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      );

      setRecentOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === parseInt(orderId) ? { ...order, status: newStatus } : order
        )
      );

      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update order status. Please try again.");

      fetchOrderDetails(currentPage);
    } finally {
      setUpdatingStatus(null);
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

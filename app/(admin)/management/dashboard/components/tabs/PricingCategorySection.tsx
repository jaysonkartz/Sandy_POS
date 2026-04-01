"use client";

import React, { memo, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/app/lib/supabaseClient";
import type { Category } from "../../types";

export type PricingCategorySectionProps = {
  category: Category;
  countryMap: { [key: string]: { name: string; chineseName?: string } };
  selectedProduct: number | null;
  setSelectedProduct: React.Dispatch<React.SetStateAction<number | null>>;
  editingProductId: number | null;
  setEditingProductId: React.Dispatch<React.SetStateAction<number | null>>;
  editingPrice: number | null;
  setEditingPrice: React.Dispatch<React.SetStateAction<number | null>>;
  savingProductIds: Set<number>;
  setSavingProductIds: React.Dispatch<React.SetStateAction<Set<number>>>;
  offerPrices: { [key: string]: number | null };
  setOfferPrices: React.Dispatch<React.SetStateAction<{ [key: string]: number | null }>>;
  insertPriceOffersWithFallback: (
    offers: Array<{
      customer_id: string;
      product_id: number;
      offered_price: number;
      previous_price: number;
      created_at?: string;
    }>
  ) => Promise<void>;

  getReadableErrorMessage: (error: unknown, fallback: string) => string;
  fetchCategories: () => Promise<void>;
  fetchAllCustomers: () => Promise<void>;
  allCustomers: Array<{
    id: string | number;
    name: string;
    phone?: string | null;
    email?: string | null;
    user_id?: string | null;
  }>;
  isLoadingCustomers: boolean;
  selectedCustomersForOffer: { [productId: number]: string[] };
  setSelectedCustomersForOffer: React.Dispatch<
    React.SetStateAction<{ [productId: number]: string[] }>
  >;
  customerOfferSearchQuery: { [productId: number]: string };
  setCustomerOfferSearchQuery: React.Dispatch<
    React.SetStateAction<{ [productId: number]: string }>
  >;
  customPriceForSelectedCustomer: { [key: string]: number | null };
  setCustomPriceForSelectedCustomer: React.Dispatch<
    React.SetStateAction<{ [key: string]: number | null }>
  >;
  isCustomerDropdownOpen: { [productId: number]: boolean };
  setIsCustomerDropdownOpen: React.Dispatch<React.SetStateAction<{ [productId: number]: boolean }>>;
};

function PricingCategorySectionInner(props: PricingCategorySectionProps) {
  const {
    category,
    countryMap,
    selectedProduct,
    setSelectedProduct,
    editingProductId,
    setEditingProductId,
    editingPrice,
    setEditingPrice,
    savingProductIds,
    setSavingProductIds,
    offerPrices,
    setOfferPrices,
    insertPriceOffersWithFallback,
    getReadableErrorMessage,
    fetchCategories,
    fetchAllCustomers,
    allCustomers,
    isLoadingCustomers,
    selectedCustomersForOffer,
    setSelectedCustomersForOffer,
    customerOfferSearchQuery,
    setCustomerOfferSearchQuery,
    customPriceForSelectedCustomer,
    setCustomPriceForSelectedCustomer,
    isCustomerDropdownOpen,
    setIsCustomerDropdownOpen,
  } = props;

  const [isExpanded, setIsExpanded] = useState(false);

  const sortedProducts = useMemo(
    () => [...category.products].sort((a, b) => a.Product.localeCompare(b.Product)),
    [category.products]
  );

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded((v) => !v)}
      >
        <div>
          <span className="text-lg font-bold">{category.name}</span>
          <span className="ml-2 text-gray-500">{category.chineseName}</span>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            category.products.length > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {category.products.length > 0 ? `${category.products.length} Products` : "No Products"}
        </span>
      </div>
      {isExpanded && (
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
              {sortedProducts.map((product) => {
                return (
                  <React.Fragment key={product.id}>
                    <tr>
                      <td className="px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 text-left"
                            onClick={() =>
                              setSelectedProduct(selectedProduct === product.id ? null : product.id)
                            }
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center">
                                <span>{selectedProduct === product.id ? "▼" : "▶"}</span>
                                <span className="ml-1 font-medium">{product.Product}</span>
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
                                          countryMap[String(product.Country)]?.name);

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
                      <td className="px-4 py-2 align-middle">
                        <div className="flex items-center space-x-2">
                          {editingProductId === product.id ? (
                            <>
                              <input
                                className="border rounded px-2 py-1 w-20"
                                type="number"
                                value={editingPrice ?? product.price}
                                onChange={(e) => setEditingPrice(Number(e.target.value))}
                              />
                              <button
                                className="text-green-600 font-bold"
                                disabled={savingProductIds.has(product.id)}
                                title="Save"
                                onClick={async () => {
                                  if (editingPrice === null || isNaN(editingPrice)) {
                                    toast.error("Please enter a valid price.");
                                    return;
                                  }
                                  setSavingProductIds((prev) => {
                                    const next = new Set(prev);
                                    next.add(product.id);
                                    return next;
                                  });

                                  try {
                                    const { data: orderItems, error: orderItemsError } =
                                      await supabase
                                        .from("order_items")
                                        .select("order_id, orders(customer_id)")
                                        .eq("product_id", product.id);

                                    if (orderItemsError) {
                                      toast.error(
                                        `Failed to fetch order items: ${orderItemsError.message}`
                                      );
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
                                              last_price_update: new Date().toISOString(),
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
                                      return;
                                    }

                                    setEditingProductId(null);
                                    setEditingPrice(null);
                                    await fetchCategories();
                                  } finally {
                                    setSavingProductIds((prev) => {
                                      const next = new Set(prev);
                                      next.delete(product.id);
                                      return next;
                                    });
                                  }
                                }}
                              >
                                {savingProductIds.has(product.id) ? "..." : "✔"}
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
                              
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                      {(() => {
  if (product.priceHistory && product.priceHistory.length > 0) {
    return (
      <div className="flex flex-col space-y-1">
        {[...(product.priceHistory || [])]
          .sort((a, b) => {
            const dateA = new Date(a.last_price_update || 0).getTime();
            const dateB = new Date(b.last_price_update || 0).getTime();
            return dateB - dateA; // latest → oldest
          })
          .map((ph, idx) => (
            <span key={idx} className="text-xs text-gray-500">
              ${ph.previous_price?.toFixed(2)}{" "}
              <span className="text-gray-400">
                (
                {ph.last_price_update
                  ? new Date(ph.last_price_update).toLocaleDateString()
                  : "No date"}
                )
              </span>
            </span>
          ))}
      </div>
    );
  } else {
    return <span className="text-xs text-gray-400">No history</span>;
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
                                    (product.order_items ?? []).flatMap((oiRaw) => {
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
                                        const phoneKey = normalizePhone(order.customer_phone);
                                        const nameKey = normalizeName(order.customer_name);
                                        const idKey = String(order.customer_id || "").trim();
                                        return phoneKey || nameKey || idKey;
                                      });
                                    })
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
                                    const keysToClear = Object.keys(offerPrices).filter((key) =>
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
                                          [product.id]: allCustomers.map((customer) =>
                                            String(customer.id)
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
                                    {allCustomers.length !== 1 ? "s" : ""} available
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
                                            : (selectedCustomersForOffer[product.id]?.length || 0) >
                                                0
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

                                    {isCustomerDropdownOpen[product.id] && !isLoadingCustomers && (
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
                                                value={customerOfferSearchQuery[product.id] || ""}
                                                onChange={(e) => {
                                                  const query = e.target.value;
                                                  setCustomerOfferSearchQuery((prev) => ({
                                                    ...prev,
                                                    [product.id]: query,
                                                  }));
                                                }}
                                              />
                                            </div>
                                            <div className="max-h-72 overflow-y-auto overflow-x-hidden">
                                              {(() => {
                                                const selectedIds = new Set(
                                                  selectedCustomersForOffer[product.id] || []
                                                );
                                                const searchTerm = String(
                                                  customerOfferSearchQuery[product.id] || ""
                                                )
                                                  .trim()
                                                  .toLowerCase();
                                                const filteredCustomers =
                                                  searchTerm.length === 0
                                                    ? allCustomers
                                                    : allCustomers.filter((customer) => {
                                                        const haystack = [
                                                          customer.name,
                                                          customer.phone,
                                                          customer.email,
                                                        ]
                                                          .filter(Boolean)
                                                          .join(" ")
                                                          .toLowerCase();
                                                        return haystack.includes(searchTerm);
                                                      });
                                                const allSelected =
                                                  allCustomers.length > 0 &&
                                                  selectedIds.size === allCustomers.length;
                                                return (
                                                  <>
                                                    <button
                                                      className="w-full px-4 py-2.5 text-left hover:bg-purple-50 transition-colors border-b border-gray-200 bg-purple-50"
                                                      type="button"
                                                      onClick={() => {
                                                        setSelectedCustomersForOffer((prev) => ({
                                                          ...prev,
                                                          [product.id]: allSelected
                                                            ? []
                                                            : allCustomers.map((customer) =>
                                                                String(customer.id)
                                                              ),
                                                        }));
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
                                                            {allCustomers.length} customer
                                                            {allCustomers.length !== 1 ? "s" : ""}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </button>
                                                    {filteredCustomers.length === 0 && (
                                                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                        No matching customers
                                                      </div>
                                                    )}
                                                    {filteredCustomers.map((customer) => {
                                                      const isSelected = selectedIds.has(
                                                        String(customer.id)
                                                      );
                                                      return (
                                                        <button
                                                          key={String(customer.id)}
                                                          className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                                                            isSelected
                                                              ? "bg-blue-100 border-l-4 border-blue-500"
                                                              : ""
                                                          }`}
                                                          type="button"
                                                          onClick={() => {
                                                            setSelectedCustomersForOffer((prev) => {
                                                              const existing = new Set(
                                                                prev[product.id] || []
                                                              );
                                                              const id = String(customer.id);
                                                              if (existing.has(id)) {
                                                                existing.delete(id);
                                                              } else {
                                                                existing.add(id);
                                                              }
                                                              return {
                                                                ...prev,
                                                                [product.id]: Array.from(existing),
                                                              };
                                                            });
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
                                                                {(customer.name || "U")
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
                                                                  <span>{customer.phone}</span>
                                                                )}
                                                                {customer.phone &&
                                                                  customer.email && (
                                                                    <span className="mx-1">•</span>
                                                                  )}
                                                                {customer.email && (
                                                                  <span>{customer.email}</span>
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
                                                                  strokeWidth={2}
                                                                />
                                                              </svg>
                                                            )}
                                                          </div>
                                                        </button>
                                                      );
                                                    })}
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

                                {(selectedCustomersForOffer[product.id]?.length || 0) > 0 && (
                                  <div className="flex flex-wrap items-center gap-2">
                                    {(selectedCustomersForOffer[product.id] || []).map(
                                      (customerId) => {
                                        const cid = String(customerId);
                                        const c = allCustomers.find((x) => String(x.id) === cid);
                                        const primary = c?.name?.trim() || "Unnamed customer";
                                        const secondary = c?.phone || c?.email || "";
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
                                                setSelectedCustomersForOffer((prev) => ({
                                                  ...prev,
                                                  [product.id]: (prev[product.id] || []).filter(
                                                    (id) => String(id) !== cid
                                                  ),
                                                }));
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
                                      }
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                  <div className="flex-1 flex items-center gap-2">
                                    <div className="relative flex-1">
                                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 text-sm font-medium">$</span>
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
                                            setCustomPriceForSelectedCustomer((prev) => {
                                              const newState = { ...prev };
                                              delete newState[key];
                                              return newState;
                                            });
                                          } else {
                                            const numValue = Number(value);
                                            if (!isNaN(numValue)) {
                                              setCustomPriceForSelectedCustomer((prev) => ({
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
                                    <>
                                      <button
                                        className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                        disabled={
                                          (selectedCustomersForOffer[product.id]?.length || 0) === 0
                                        }
                                        onClick={async () => {
                                          const selectedCustomerIds = (
                                            selectedCustomersForOffer[product.id] || []
                                          )
                                            .map((id) => String(id).trim())
                                            .filter(Boolean);
                                          if (selectedCustomerIds.length === 0) {
                                            toast.error("Please select at least one customer");
                                            return;
                                          }
                                          const key = `custom-selected-${product.id}`;
                                          const price = customPriceForSelectedCustomer[key];
                                          if (!price || price <= 0) {
                                            toast.error("Please enter a valid price");
                                            return;
                                          }

                                          try {
                                            const offers = selectedCustomerIds.map(
                                              (customerId) => ({
                                                customer_id: customerId,
                                                product_id: product.id,
                                                offered_price: price,
                                                previous_price: product.price,
                                                created_at: new Date().toISOString(),
                                              })
                                            );

                                            await insertPriceOffersWithFallback(offers);
                                            await fetchCategories();

                                            setSelectedCustomersForOffer((prev) => ({
                                              ...prev,
                                              [product.id]: [],
                                            }));
                                            setCustomPriceForSelectedCustomer((prev) => {
                                              const newState = { ...prev };
                                              delete newState[key];
                                              return newState;
                                            });
                                            toast.success(
                                              `Offer sent successfully to ${selectedCustomerIds.length} customer${selectedCustomerIds.length !== 1 ? "s" : ""} for $${price.toFixed(2)}`
                                            );
                                          } catch (err) {
                                            console.error(
                                              "Failed to insert multi custom price offers",
                                              {
                                                error: err,
                                                selectedCustomerCount: selectedCustomerIds.length,
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
                                          setCustomPriceForSelectedCustomer((prev) => {
                                            const newState = { ...prev };
                                            delete newState[key];
                                            return newState;
                                          });
                                          setSelectedCustomersForOffer((prev) => ({
                                            ...prev,
                                            [product.id]: [],
                                          }));
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
                                    matchingCustomerIds.has(String(entry.customer_id).trim())
                                  )
                                  .filter((entry) => {
                                    const entryTime = getHistoryTimestamp(entry);
                                    if (!Number.isFinite(entryTime)) {
                                      return false;
                                    }
                                    if (latestGlobalPriceUpdateTime === null) {
                                      return true;
                                    }
                                    return entryTime > latestGlobalPriceUpdateTime;
                                  });

                                const latestEligibleCustomerSpecificPrice =
                                  eligibleCustomerPriceEntries.reduce<{
                                    original_price: number;
                                    last_price_update?: string;
                                    created_at?: string;
                                  } | null>((latest, entry) => {
                                    if (!latest) return entry;
                                    const latestTime = getHistoryTimestamp(latest);
                                    const entryTime = getHistoryTimestamp(entry);
                                    return entryTime > latestTime ? entry : latest;
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
                                  const phoneKey = normalizePhone(order.customer_phone);
                                  const nameKey = normalizeName(order.customer_name);
                                  const idKey = String(order.customer_id || "").trim();
                                  const customerKey = phoneKey || nameKey || idKey;
                                  if (!customerKey) return;

                                  const existing = previousCustomersMap.get(customerKey);
                                  if (!existing || (oi.order_id ?? 0) > (existing.order_id ?? 0)) {
                                    const customerId = String(order.customer_id || "").trim();
                                    const matchingCustomerIds = new Set<string>();
                                    if (customerId) {
                                      matchingCustomerIds.add(customerId);
                                    }

                                    const orderPhone = normalizePhone(order.customer_phone);
                                    const orderName = normalizeName(order.customer_name);

                                    (allCustomers || []).forEach((customerRow) => {
                                      const rowId = String(customerRow.id || "").trim();
                                      if (!rowId) return;

                                      const rowPhone = normalizePhone(
                                        customerRow.phone || undefined
                                      );
                                      const rowName = normalizeName(customerRow.name || "");

                                      if (
                                        (orderPhone && rowPhone && orderPhone === rowPhone) ||
                                        (orderName && rowName && orderName === rowName)
                                      ) {
                                        matchingCustomerIds.add(rowId);
                                      }
                                    });

                                    const currentPriceForCustomer =
                                      getCurrentPriceForMatchingIds(matchingCustomerIds);

                                    previousCustomersMap.set(customerKey, {
                                      customer_name: order.customer_name,
                                      customer_phone: order.customer_phone,
                                      customer_id: order.customer_id,
                                      dedupe_key: customerKey,
                                      order_id: oi.order_id,
                                      last_purchased_price: oi.price,
                                      current_price_for_customer: currentPriceForCustomer,
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
                                const orderPhone = normalizePhone(row.customer_phone);
                                const orderName = normalizeName(row.customer_name);
                                (allCustomers || []).forEach((customerRow) => {
                                  const rowId = String(customerRow.id || "").trim();
                                  if (!rowId) return;
                                  const rowPhone = normalizePhone(customerRow.phone || undefined);
                                  const rowName = normalizeName(customerRow.name || "");
                                  if (
                                    (orderPhone && rowPhone && orderPhone === rowPhone) ||
                                    (orderName && rowName && orderName === rowName)
                                  ) {
                                    coveredCustomerIds.add(rowId);
                                  }
                                });
                              });

                              const historyCustomerIds = [
                                ...new Set(
                                  (product.customerPriceHistory || [])
                                    .map((entry) => String(entry.customer_id ?? "").trim())
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
                                let mapKey = phoneKey || nameKey || `id:${custId}`;

                                if (previousCustomersMap.has(mapKey)) {
                                  const existing = previousCustomersMap.get(mapKey);
                                  if (
                                    existing &&
                                    String(existing.customer_id || "").trim() === custId
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
                                  current_price_for_customer: getCurrentPriceForMatchingIds(
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
                                const orderPhone = normalizePhone(row.customer_phone);
                                const orderName = normalizeName(row.customer_name);

                                const byId = id
                                  ? (allCustomers || []).find((c) => String(c.id).trim() === id)
                                  : undefined;
                                const byOrderPhone = orderPhone
                                  ? (allCustomers || []).find(
                                      (c) => normalizePhone(c.phone || undefined) === orderPhone
                                    )
                                  : undefined;

                                const nameMatches = orderName
                                  ? (allCustomers || []).filter(
                                      (c) => normalizeName(c.name || "") === orderName
                                    )
                                  : [];

                                let profile: (typeof allCustomers)[number] | undefined;

                                if (nameMatches.length === 1) {
                                  profile = nameMatches[0];
                                } else if (nameMatches.length > 1) {
                                  const linkedToOrder = id
                                    ? nameMatches.find((c) => String(c.id).trim() === id)
                                    : undefined;
                                  const withUser = nameMatches.filter((c) => c.user_id);
                                  const phoneMatchesOrder = orderPhone
                                    ? nameMatches.find(
                                        (c) => normalizePhone(c.phone || undefined) === orderPhone
                                      )
                                    : undefined;

                                  if (withUser.length === 1) {
                                    profile = withUser[0];
                                  } else if (withUser.length > 1) {
                                    profile =
                                      (id
                                        ? withUser.find((c) => String(c.id).trim() === id)
                                        : undefined) ||
                                      phoneMatchesOrder ||
                                      withUser[0];
                                  } else {
                                    profile = linkedToOrder || phoneMatchesOrder || nameMatches[0];
                                  }
                                } else {
                                  profile = byId || byOrderPhone;
                                }

                                if (!profile) return row;

                                const dirPhone = profile.phone ? String(profile.phone).trim() : "";
                                const dirName = profile.name ? profile.name.trim() : "";

                                const pricingIds = new Set<string>();
                                if (nameMatches.length > 1) {
                                  nameMatches.forEach((c) => pricingIds.add(String(c.id).trim()));
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

                              const previousCustomers = Array.from(previousCustomersMap.values())
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
                                                {customer.last_purchased_price != undefined ? (
                                                  <>${customer.last_purchased_price.toFixed(2)}</>
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
                                                ${customer.current_price_for_customer.toFixed(2)}
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
                                          const currentOfferPrice = offerPrices[key];
                                          if (!currentOfferPrice) {
                                            toast.error("Please enter an offer price");
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

                                            const match = (allCustomers || []).find((row) => {
                                              const rowId = String(row.id || "").trim();
                                              if (!rowId) return false;
                                              const rowPhone = normalizePhone(
                                                row.phone || undefined
                                              );
                                              const rowName = normalizeName(row.name || "");
                                              return (
                                                (customerPhone &&
                                                  rowPhone &&
                                                  customerPhone === rowPhone) ||
                                                (customerName &&
                                                  rowName &&
                                                  customerName === rowName)
                                              );
                                            });

                                            return match ? String(match.id).trim() : "";
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
                                                  customer.last_purchased_price ?? product.price,
                                                created_at: new Date().toISOString(),
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
                            {(!product.order_items || product.order_items.length === 0) && (
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
                                  Use the selector above to send offers to any customer
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
  );
}

const PricingCategorySectionMemo = memo(PricingCategorySectionInner);
PricingCategorySectionMemo.displayName = "PricingCategorySection";

export const PricingCategorySection = PricingCategorySectionMemo;

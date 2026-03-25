"use client";

import React, { memo, useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence as FramerAnimatePresence } from "framer-motion";
import { Loader2, Plus } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import OrderReview from "./OrderReview";

const AnimatePresence = FramerAnimatePresence as unknown as React.FC<
  React.PropsWithChildren<Record<string, unknown>>
>;

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

interface Address {
  id: string;
  name: string;
  address: string;
  isDefault?: boolean;
}

const PROFILE_DELIVERY_ID = "__profile_delivery__";
const PROFILE_CURRENT_ID = "__profile_current__";

interface OrderPanelProps {
  isOpen: boolean;
  isEnglish: boolean;
  selectedProducts: { product: Product; quantity: number }[];
  countryMap: { [key: string]: { name: string; chineseName: string } };
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  isSubmitting: boolean;
  session: any;
  onClose: () => void;
  onUpdateQuantity: (productId: number, newQuantity: number) => void;
  onCustomerNameChange: (name: string) => void;
  onCustomerPhoneChange: (phone: string) => void;
  onCustomerAddressChange: (address: string) => void;
  onSubmitOrder: (reviewData?: {
    remarks: string;
    purchaseOrder: string;
    uploadedFiles: File[];
  }) => void;
}

export const OrderPanel = memo<OrderPanelProps>(
  ({
    isOpen,
    isEnglish,
    selectedProducts,
    countryMap,
    customerName,
    customerPhone,
    customerAddress,
    isSubmitting,
    session,
    onClose,
    onUpdateQuantity,
    onCustomerNameChange,
    onCustomerPhoneChange,
    onCustomerAddressChange,
    onSubmitOrder,
  }) => {
    const getVariationLabel = (product: Product) =>
      product.Variation ??
      (product as Product & { variation?: string; variation_name?: string }).variation ??
      (product as Product & { variation_name?: string }).variation_name ??
      "";

    const getWeightLabel = (product: Product) =>
      product.weight ??
      (product as Product & { Weight?: string; weight_value?: string }).Weight ??
      (product as Product & { weight_value?: string }).weight_value ??
      "";

    const getOriginLabel = (product: Product) => {
      const rawOrigin =
        (
          product as Product & {
            Country_of_origin?: string;
            country_of_origin?: string;
            origin?: string;
          }
        ).Country_of_origin ??
        (product as Product & { country_of_origin?: string }).country_of_origin ??
        product.Country ??
        (product as Product & { origin?: string }).origin;

      if (!rawOrigin) return "";

      const originKey = String(rawOrigin).trim();
      const mapped = countryMap[originKey];
      if (mapped) {
        return isEnglish
          ? mapped.name || originKey
          : mapped.chineseName || mapped.name || originKey;
      }

      return originKey;
    };

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [ephemeralAddresses, setEphemeralAddresses] = useState<Address[]>([]);
    const [profileDeliveryAddress, setProfileDeliveryAddress] = useState("");
    const [profileCurrentAddress, setProfileCurrentAddress] = useState("");
    const [selectedAddressId, setSelectedAddressId] = useState<string>("");
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [newAddress, setNewAddress] = useState({ name: "", address: "" });
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [customerDataLoaded, setCustomerDataLoaded] = useState(false);
    const [addressesFetchDone, setAddressesFetchDone] = useState(false);
    const addressDefaultsAppliedRef = useRef(false);

    const loadCustomerFromCache = useCallback((email: string) => {
      try {
        const cached = localStorage.getItem(`customer_data_${email}`);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {
        /* ignore corrupt cache */
      }
      return null;
    }, []);

    const saveCustomerToCache = useCallback((email: string, data: any) => {
      try {
        localStorage.setItem(`customer_data_${email}`, JSON.stringify(data));
      } catch {
        /* ignore localStorage errors */
      }
    }, []);

    const loadAddresses = useCallback(async (session: any) => {
      setAddressesFetchDone(false);
      if (!session?.user?.email && !session?.user?.id) {
        setAddresses([]);
        setAddressesFetchDone(true);
        return;
      }

      try {
        let customerData = null;

        if (session.user.id) {
          const { data: customerByUserId, error: userIdError } = await supabase
            .from("customers")
            .select("id, email, user_id")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (!userIdError && customerByUserId) {
            customerData = customerByUserId;
          }
        }

        if (!customerData && session.user.email) {
          const { data: allCustomers, error: allError } = await supabase
            .from("customers")
            .select("id, email, user_id")
            .eq("email", session.user.email);

          if (!allError && allCustomers && allCustomers.length > 0) {
            customerData =
              allCustomers.find((c: any) => c.user_id === session.user.id) || allCustomers[0];
          }
        }

        if (!customerData) {
          setAddresses([]);
          setAddressesFetchDone(true);
          return;
        }

        const { data: addressesData, error: addressesError } = await supabase
          .from("addresses")
          .select("*")
          .eq("customer_id", customerData.id)
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: true });

        if (addressesError) {
          setAddresses([]);
          setAddressesFetchDone(true);
          return;
        }

        if (addressesData && addressesData.length > 0) {
          const formattedAddresses: Address[] = addressesData.map((addr: any) => ({
            id: addr.id.toString(),
            name: addr.name,
            address: addr.address,
            isDefault: addr.is_default,
          }));
          setAddresses(formattedAddresses);
        } else {
          setAddresses([]);
        }
      } catch {
        setAddresses([]);
      } finally {
        setAddressesFetchDone(true);
      }
    }, []);

    const subtotal = selectedProducts.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    const gstRate = 0.09; // 9% GST
    const gstAmount = subtotal * gstRate;
    const totalAmount = subtotal + gstAmount;

    useEffect(() => {
      if (isOpen && session?.user?.email && !customerDataLoaded) {
        const cachedData = loadCustomerFromCache(session.user.email);
        if (cachedData) {
          if (!customerName && cachedData.name) {
            onCustomerNameChange(cachedData.name);
          }
          if (!customerPhone && cachedData.phone) {
            onCustomerPhoneChange(cachedData.phone);
          }
          setProfileDeliveryAddress(String(cachedData.delivery_address ?? "").trim());
          setProfileCurrentAddress(String(cachedData.address ?? "").trim());
          setCustomerDataLoaded(true);
          return;
        }

        const trySimpleQuery = async () => {
          try {
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error("Customer data query timeout")), 4000);
            });

            const queryPromise = supabase
              .from("customers")
              .select("name, phone, address, delivery_address, email, user_id");

            const { data: allCustomers, error: allError } = (await Promise.race([
              queryPromise,
              timeoutPromise,
            ])) as any;

            if (allCustomers && !allError) {
              const customer = allCustomers.find(
                (c: any) => c.email === session.user.email || c.user_id === session.user.id
              );

              if (customer) {
                saveCustomerToCache(session.user.email, customer);

                if (!customerName && customer.name) {
                  onCustomerNameChange(customer.name);
                }
                if (!customerPhone && customer.phone) {
                  onCustomerPhoneChange(customer.phone);
                }
                setProfileDeliveryAddress(String(customer.delivery_address ?? "").trim());
                setProfileCurrentAddress(String(customer.address ?? "").trim());
                setCustomerDataLoaded(true);
                return;
              }
            }

            setProfileDeliveryAddress("");
            setProfileCurrentAddress("");
            if (!customerName) {
              onCustomerNameChange(session.user.email.split("@")[0] || "Customer");
            }
          } catch (err) {
            setProfileDeliveryAddress("");
            setProfileCurrentAddress("");
            if (!customerName) {
              onCustomerNameChange(session.user.email.split("@")[0] || "Customer");
            }
          } finally {
            setCustomerDataLoaded(true);
          }
        };

        trySimpleQuery();
      }
    }, [
      isOpen,
      session,
      customerDataLoaded,
      customerName,
      customerPhone,
      loadCustomerFromCache,
      onCustomerNameChange,
      onCustomerPhoneChange,
      saveCustomerToCache,
    ]);

    useEffect(() => {
      if (isOpen && !session?.user?.email && !session?.user?.id) {
        setProfileDeliveryAddress("");
        setProfileCurrentAddress("");
        setCustomerDataLoaded(true);
      }
    }, [isOpen, session]);

    useEffect(() => {
      if (isOpen && session?.user) {
        loadAddresses(session);
      } else if (isOpen && !session?.user) {
        setAddresses([]);
        setAddressesFetchDone(true);
      } else if (!isOpen) {
        setAddresses([]);
        setSelectedAddressId("");
        setEphemeralAddresses([]);
        addressDefaultsAppliedRef.current = false;
        setAddressesFetchDone(false);
      }
    }, [isOpen, session, loadAddresses]);

    useEffect(() => {
      if (!isOpen) return;
      if (!customerDataLoaded || !addressesFetchDone || addressDefaultsAppliedRef.current) return;

      const delivery = profileDeliveryAddress.trim();
      const current = profileCurrentAddress.trim();

      addressDefaultsAppliedRef.current = true;

      if (delivery) {
        setSelectedAddressId(PROFILE_DELIVERY_ID);
        onCustomerAddressChange(delivery);
        return;
      }
      if (current) {
        setSelectedAddressId(PROFILE_CURRENT_ID);
        onCustomerAddressChange(current);
        return;
      }
      if (addresses.length > 0) {
        const defaultAddress = addresses.find((addr) => addr.isDefault) || addresses[0];
        setSelectedAddressId(defaultAddress.id);
        onCustomerAddressChange(defaultAddress.address);
        return;
      }
      if (ephemeralAddresses.length > 0) {
        setSelectedAddressId(ephemeralAddresses[0].id);
        onCustomerAddressChange(ephemeralAddresses[0].address);
        return;
      }
      setSelectedAddressId("");
      onCustomerAddressChange("");
    }, [
      isOpen,
      customerDataLoaded,
      addressesFetchDone,
      profileDeliveryAddress,
      profileCurrentAddress,
      addresses,
      ephemeralAddresses,
      onCustomerAddressChange,
    ]);

    const handleAddressSelect = (addressId: string) => {
      setSelectedAddressId(addressId);
      if (addressId === PROFILE_DELIVERY_ID) {
        onCustomerAddressChange(profileDeliveryAddress.trim());
        return;
      }
      if (addressId === PROFILE_CURRENT_ID) {
        onCustomerAddressChange(profileCurrentAddress.trim());
        return;
      }
      const ephemeral = ephemeralAddresses.find((addr) => addr.id === addressId);
      if (ephemeral) {
        onCustomerAddressChange(ephemeral.address);
        return;
      }
      const selectedAddress = addresses.find((addr) => addr.id === addressId);
      if (selectedAddress) {
        onCustomerAddressChange(selectedAddress.address);
      }
    };

    const handleAddEphemeralAddress = () => {
      if (!newAddress.address?.trim()) {
        return;
      }
      const id = `ephemeral-${Date.now()}`;
      const addr: Address = {
        id,
        name: "",
        address: newAddress.address.trim(),
      };
      setEphemeralAddresses((prev) => [...prev, addr]);
      setSelectedAddressId(id);
      onCustomerAddressChange(addr.address);
      setNewAddress({ name: "", address: "" });
      setShowAddAddress(false);
    };

    const handleEditAddress = (address: Address) => {
      setEditingAddress(address);
      setNewAddress({ name: address.name, address: address.address });
      setShowAddAddress(true);
    };

    const handleDeleteAddress = async (addressId: string) => {
      if (addressId.startsWith("ephemeral-")) {
        const nextEphem = ephemeralAddresses.filter((a) => a.id !== addressId);
        setEphemeralAddresses(nextEphem);
        if (selectedAddressId === addressId) {
          const delivery = profileDeliveryAddress.trim();
          if (delivery) {
            setSelectedAddressId(PROFILE_DELIVERY_ID);
            onCustomerAddressChange(delivery);
          } else if (profileCurrentAddress.trim()) {
            setSelectedAddressId(PROFILE_CURRENT_ID);
            onCustomerAddressChange(profileCurrentAddress.trim());
          } else if (addresses[0]) {
            setSelectedAddressId(addresses[0].id);
            onCustomerAddressChange(addresses[0].address);
          } else if (nextEphem[0]) {
            setSelectedAddressId(nextEphem[0].id);
            onCustomerAddressChange(nextEphem[0].address);
          } else {
            setSelectedAddressId("");
            onCustomerAddressChange("");
          }
        }
        return;
      }

      if (!session?.user?.id) return;

      try {
        const { error } = await supabase.from("addresses").delete().eq("id", addressId);

        if (error) {
          console.error("Error deleting address:", error);
          alert(isEnglish ? "Failed to delete address." : "删除地址失败。");
          return;
        }

        const nextSaved = addresses.filter((addr) => addr.id !== addressId);
        setAddresses(nextSaved);

        if (selectedAddressId === addressId) {
          const delivery = profileDeliveryAddress.trim();
          if (delivery) {
            setSelectedAddressId(PROFILE_DELIVERY_ID);
            onCustomerAddressChange(delivery);
          } else if (profileCurrentAddress.trim()) {
            setSelectedAddressId(PROFILE_CURRENT_ID);
            onCustomerAddressChange(profileCurrentAddress.trim());
          } else if (nextSaved[0]) {
            setSelectedAddressId(nextSaved[0].id);
            onCustomerAddressChange(nextSaved[0].address);
          } else if (ephemeralAddresses[0]) {
            setSelectedAddressId(ephemeralAddresses[0].id);
            onCustomerAddressChange(ephemeralAddresses[0].address);
          } else {
            setSelectedAddressId("");
            onCustomerAddressChange("");
          }
        }
      } catch (error) {
        console.error("Error deleting address:", error);
        alert(isEnglish ? "Failed to delete address." : "删除地址失败。");
      }
    };

    const handleSetDefaultAddress = async (addressId: string) => {
      if (!session?.user?.id) return;

      try {
        const { data: allCustomers, error: allError } = await supabase
          .from("customers")
          .select("id, email, user_id")
          .eq("email", session.user.email);

        if (allError || !allCustomers || allCustomers.length === 0) {
          return;
        }

        const customerData = allCustomers[0];

        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("customer_id", customerData.id);

        const { error } = await supabase
          .from("addresses")
          .update({ is_default: true })
          .eq("id", addressId);

        if (error) {
          console.error("Error setting default address:", error);
          alert(isEnglish ? "Failed to set default address." : "设置默认地址失败。");
          return;
        }

        setAddresses((prev) =>
          prev.map((addr) => ({
            ...addr,
            isDefault: addr.id === addressId,
          }))
        );
      } catch (error) {
        console.error("Error setting default address:", error);
        alert(isEnglish ? "Failed to set default address." : "设置默认地址失败。");
      }
    };

    const handleUpdateAddress = async () => {
      if (!editingAddress || !newAddress.name?.trim() || !newAddress.address?.trim()) {
        return;
      }

      setIsSavingAddress(true);

      try {
        const { error } = await supabase
          .from("addresses")
          .update({
            name: newAddress.name.trim(),
            address: newAddress.address.trim(),
          })
          .eq("id", editingAddress.id);

        if (error) {
          console.error("Error updating address:", error);
          alert(isEnglish ? "Failed to update address." : "更新地址失败。");
          return;
        }

        setAddresses((prev) =>
          prev.map((addr) =>
            addr.id === editingAddress.id
              ? { ...addr, name: newAddress.name.trim(), address: newAddress.address.trim() }
              : addr
          )
        );

        if (selectedAddressId === editingAddress.id) {
          onCustomerAddressChange(newAddress.address.trim());
        }

        setEditingAddress(null);
        setNewAddress({ name: "", address: "" });
        setShowAddAddress(false);
      } catch (error) {
        console.error("Error updating address:", error);
        alert(isEnglish ? "Failed to update address." : "更新地址失败。");
      } finally {
        setIsSavingAddress(false);
      }
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex justify-end"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
          >
            <motion.div
              animate={{ x: 0 }}
              className="w-full max-w-md bg-white h-full p-4 overflow-y-auto pb-32"
              exit={{ x: "100%" }}
              initial={{ x: "100%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{isEnglish ? "Create Order" : "创建订单"}</h2>
                <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
                  ✕
                </button>
              </div>

              <div className="mb-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">
                    {isEnglish ? "Customer Information" : "客户信息"}
                  </h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isEnglish ? "Customer Name" : "客户姓名"}
                    </label>
                    <input
                      required
                      className="w-full p-2 border rounded-md"
                      placeholder={isEnglish ? "Enter customer name" : "输入客户姓名"}
                      type="text"
                      value={customerName}
                      onChange={(e) => onCustomerNameChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isEnglish ? "Mobile Number" : "电话号码"}
                    </label>
                    <input
                      required
                      className="w-full p-2 border rounded-md"
                      placeholder={isEnglish ? "Enter mobile number" : "输入电话号码"}
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => onCustomerPhoneChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isEnglish ? "Delivery Address" : "配送地址"}
                    </label>

                    <div className="mb-2 space-y-2">
                      <div
                        className={`p-2 bg-gray-50 rounded border flex items-center gap-3 ${
                          !profileDeliveryAddress.trim() ? "opacity-60" : ""
                        }`}
                      >
                        <input
                          checked={selectedAddressId === PROFILE_DELIVERY_ID}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 shrink-0"
                          disabled={!profileDeliveryAddress.trim()}
                          name="address"
                          type="radio"
                          value={PROFILE_DELIVERY_ID}
                          onChange={() => handleAddressSelect(PROFILE_DELIVERY_ID)}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">
                            {isEnglish ? "Delivery address" : "配送地址"}
                          </span>
                          <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap break-words">
                            {profileDeliveryAddress.trim()
                              ? profileDeliveryAddress
                              : isEnglish
                                ? "(Not set)"
                                : "（未设置）"}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`p-2 bg-gray-50 rounded border flex items-center gap-3 ${
                          !profileCurrentAddress.trim() ? "opacity-60" : ""
                        }`}
                      >
                        <input
                          checked={selectedAddressId === PROFILE_CURRENT_ID}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 shrink-0"
                          disabled={!profileCurrentAddress.trim()}
                          name="address"
                          type="radio"
                          value={PROFILE_CURRENT_ID}
                          onChange={() => handleAddressSelect(PROFILE_CURRENT_ID)}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">
                            {isEnglish ? "Current address" : "当前地址"}
                          </span>
                          <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap break-words">
                            {profileCurrentAddress.trim()
                              ? profileCurrentAddress
                              : isEnglish
                                ? "(Not set)"
                                : "（未设置）"}
                          </p>
                        </div>
                      </div>

                      {ephemeralAddresses.map((address) => (
                        <div
                          key={address.id}
                          className="p-2 bg-amber-50 rounded border border-amber-100 flex items-center gap-3"
                        >
                          <input
                            checked={selectedAddressId === address.id}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 shrink-0"
                            name="address"
                            type="radio"
                            value={address.id}
                            onChange={() => handleAddressSelect(address.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                              {address.address}
                            </p>
                            <p className="text-xs text-amber-800 mt-1">
                              {isEnglish ? "Not saved — this order only" : "未保存 — 仅本订单"}
                            </p>
                          </div>
                          <button
                            className="text-red-600 hover:text-red-800 text-xs px-2 py-1 shrink-0"
                            title={isEnglish ? "Remove" : "移除"}
                            type="button"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}

                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className="p-2 bg-gray-50 rounded border flex items-center gap-3"
                        >
                          <input
                            checked={selectedAddressId === address.id}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 shrink-0"
                            name="address"
                            type="radio"
                            value={address.id}
                            onChange={() => handleAddressSelect(address.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{address.name}</span>
                              {address.isDefault && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {isEnglish ? "Default" : "默认"}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap break-words">
                              {address.address}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1"
                              title={isEnglish ? "Edit" : "编辑"}
                              type="button"
                              onClick={() => handleEditAddress(address)}
                            >
                              ✏️
                            </button>
                            {!address.isDefault && (
                              <button
                                className="text-yellow-600 hover:text-yellow-800 text-xs px-2 py-1"
                                title={isEnglish ? "Set as default" : "设为默认"}
                                type="button"
                                onClick={() => handleSetDefaultAddress(address.id)}
                              >
                                ⭐
                              </button>
                            )}
                            <button
                              className="text-red-600 hover:text-red-800 text-xs px-2 py-1"
                              title={isEnglish ? "Delete" : "删除"}
                              type="button"
                              onClick={() => handleDeleteAddress(address.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      type="button"
                      onClick={() => {
                        setEditingAddress(null);
                        setNewAddress({ name: "", address: "" });
                        setShowAddAddress(true);
                      }}
                    >
                      <Plus className="w-3 h-3" />
                      {isEnglish ? "Add another address" : "添加另一个地址"}
                    </button>
                  </div>
                </div>
              </div>

              {selectedProducts.length > 0 && (
                <div className="mb-4 space-y-2">
                  <h3 className="font-semibold mb-2">
                    {isEnglish ? "Selected Products" : "已选产品"}
                  </h3>
                  {selectedProducts.map(({ product, quantity }) => {
                    const variation = getVariationLabel(product);
                    const origin = getOriginLabel(product);
                    const weight = getWeightLabel(product);

                    return (
                      <div key={product.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-medium">
                            {isEnglish ? product.Product : product.Product_CH}
                          </p>
                          <span className="text-sm text-gray-600">
                            ${product.price.toFixed(2)}/{product.UOM}
                          </span>
                        </div>
                        {(variation || origin || weight) && (
                          <div className="text-xs text-gray-500 space-y-0.5">
                            {variation && (
                              <p>
                                {isEnglish ? "Variation:" : "规格:"} {variation}
                              </p>
                            )}
                            {origin && (
                              <p>
                                {isEnglish ? "Origin:" : "产地:"} {origin}
                              </p>
                            )}
                            {weight && (
                              <p>
                                {isEnglish ? "Weight:" : "重量:"} {weight}
                              </p>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button
                              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                              onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                            >
                              -
                            </button>
                            <span className="text-sm">{quantity}</span>
                            <button
                              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                              onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                          <button
                            className="text-red-500 hover:text-red-700 text-sm"
                            onClick={() => onUpdateQuantity(product.id, 0)}
                          >
                            {isEnglish ? "Remove" : "移除"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="text-right space-y-1 mt-2">
                    <div className="text-sm">
                      {isEnglish ? "Subtotal:" : "小计:"} ${subtotal.toFixed(2)}
                    </div>
                    <div className="text-sm">
                      {isEnglish ? "GST (9%):" : "消费税 (9%):"} ${gstAmount.toFixed(2)}
                    </div>
                    <div className="font-semibold border-t pt-1">
                      {isEnglish ? "Total:" : "总计:"} ${totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              <button
                className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
                disabled={selectedProducts.length === 0 || isSubmitting}
                onClick={() => setShowReview(true)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEnglish ? "Submitting..." : "提交中..."}
                  </>
                ) : (
                  <>{isEnglish ? "Review Order" : "审核订单"}</>
                )}
              </button>

              {showAddAddress && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-4">
                      {editingAddress
                        ? isEnglish
                          ? "Edit Address"
                          : "编辑地址"
                        : isEnglish
                          ? "Add address for this order"
                          : "添加本订单地址"}
                    </h3>

                    {!editingAddress && (
                      <div
                        className="mb-4 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-md p-3"
                        role="alert"
                      >
                        {isEnglish
                          ? "This address will not be saved to your account. It applies to this order only."
                          : "此地址不会保存到您的账户，仅用于本次订单。"}
                      </div>
                    )}

                    <div className="space-y-4">
                      {editingAddress && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {isEnglish ? "Address Name" : "地址名称"}
                          </label>
                          <input
                            className="w-full p-2 border rounded-md"
                            placeholder={isEnglish ? "e.g., Home, Office" : "例如：家、办公室"}
                            type="text"
                            value={newAddress.name}
                            onChange={(e) =>
                              setNewAddress((prev) => ({ ...prev, name: e.target.value }))
                            }
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {isEnglish ? "Address" : "地址"}
                        </label>
                        <textarea
                          className="w-full p-2 border rounded-md resize-none"
                          placeholder={isEnglish ? "Enter full address" : "输入完整地址"}
                          rows={3}
                          value={newAddress.address}
                          onChange={(e) =>
                            setNewAddress((prev) => ({ ...prev, address: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                      <button
                        className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        type="button"
                        onClick={() => {
                          setShowAddAddress(false);
                          setEditingAddress(null);
                          setNewAddress({ name: "", address: "" });
                        }}
                      >
                        {isEnglish ? "Cancel" : "取消"}
                      </button>
                      <button
                        className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        disabled={
                          editingAddress
                            ? !newAddress.name?.trim() ||
                              !newAddress.address?.trim() ||
                              isSavingAddress
                            : !newAddress.address?.trim()
                        }
                        type="button"
                        onClick={editingAddress ? handleUpdateAddress : handleAddEphemeralAddress}
                      >
                        {editingAddress && isSavingAddress ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {isEnglish ? "Saving..." : "保存中..."}
                          </>
                        ) : (
                          <>
                            {editingAddress
                              ? isEnglish
                                ? "Update Address"
                                : "更新地址"
                              : isEnglish
                                ? "Use for this order"
                                : "用于本订单"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <OrderReview
                countryMap={countryMap}
                customerAddress={customerAddress}
                customerName={customerName}
                customerPhone={customerPhone}
                isEnglish={isEnglish}
                isOpen={showReview}
                isSubmitting={isSubmitting}
                selectedProducts={selectedProducts}
                onBackToEdit={() => setShowReview(false)}
                onClose={() => setShowReview(false)}
                onConfirmOrder={(data) => {
                  setShowReview(false);
                  if (typeof onSubmitOrder === "function") {
                    onSubmitOrder(data);
                  }
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

OrderPanel.displayName = "OrderPanel";

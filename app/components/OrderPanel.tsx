import React, { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, MapPin } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import OrderReview from "./OrderReview";

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

interface OrderPanelProps {
  isOpen: boolean;
  isEnglish: boolean;
  selectedProducts: { product: Product; quantity: number }[];
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

export const OrderPanel = memo<OrderPanelProps>(({
  isOpen,
  isEnglish,
  selectedProducts,
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
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [newAddress, setNewAddress] = useState({ name: "", address: "" });
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewData, setReviewData] = useState<{
    remarks: string;
    purchaseOrder: string;
    uploadedFiles: File[];
  } | null>(null);

  const subtotal = selectedProducts.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  
  const gstRate = 0.09; // 9% GST
  const gstAmount = subtotal * gstRate;
  const totalAmount = subtotal + gstAmount;

  // Load addresses from Supabase when panel opens
  useEffect(() => {
    const loadAddresses = async () => {
      if (isOpen && session?.user?.id) {
        try {
          // First get customer ID
          const { data: customerData, error: customerError } = await supabase
            .from("customers")
            .select("id")
            .eq("user_id", session.user.id)
            .single();

          if (customerData && !customerError) {
            // Load addresses from addresses table
            const { data: addressesData, error: addressesError } = await supabase
              .from("addresses")
              .select("*")
              .eq("customer_id", customerData.id)
              .order("is_default", { ascending: false })
              .order("created_at", { ascending: true });

            if (addressesData && !addressesError) {
              const loadedAddresses: Address[] = addressesData.map(addr => ({
                id: addr.id.toString(),
                name: addr.name,
                address: addr.address,
                isDefault: addr.is_default
              }));
              setAddresses(loadedAddresses);
              
              // Auto-select the default address
              const defaultAddress = loadedAddresses.find(addr => addr.isDefault);
              if (defaultAddress) {
                setSelectedAddressId(defaultAddress.id);
                onCustomerAddressChange(defaultAddress.address);
              }
            }
          }
        } catch (error) {
          console.error("Error loading addresses:", error);
        }
      }
    };

    loadAddresses();
  }, [isOpen, session]);

  // Address management functions
  const handleAddressSelect = async (addressId: string) => {
    setSelectedAddressId(addressId);
    const selectedAddress = addresses.find(addr => addr.id === addressId);
    if (selectedAddress) {
      onCustomerAddressChange(selectedAddress.address);
    }
  };

  const handleAddNewAddress = async () => {
    console.log("handleAddNewAddress called", { newAddress, session: !!session });
    
    if (!newAddress.name?.trim() || !newAddress.address?.trim()) {
      console.log("Validation failed: missing name or address");
      return;
    }

    if (!session?.user?.id) {
      console.log("No session or user ID");
      alert(isEnglish ? "Please log in to save addresses." : "请登录以保存地址。");
      return;
    }

    setIsSavingAddress(true);

    try {
      console.log("Saving address to Supabase...");
      
      // First get customer ID
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (customerError || !customerData) {
        console.error("Error getting customer:", customerError);
        alert(isEnglish ? "Failed to get customer information." : "获取客户信息失败。");
        return;
      }

      // Save to addresses table
      const { data: newAddressData, error } = await supabase
        .from("addresses")
        .insert([{
          customer_id: customerData.id,
          name: newAddress.name.trim(),
          address: newAddress.address.trim(),
          is_default: addresses.length === 0 // First address becomes default
        }])
        .select()
        .single();

      if (error) {
        console.error("Error saving address:", error);
        alert(isEnglish ? "Failed to save address. Please try again." : "保存地址失败，请重试。");
        return;
      }

      console.log("Address saved successfully");

      // Update local state
      const newAddr: Address = {
        id: newAddressData.id.toString(),
        name: newAddressData.name,
        address: newAddressData.address,
        isDefault: newAddressData.is_default
      };
      setAddresses(prev => [...prev, newAddr]);
      setSelectedAddressId(newAddr.id);
      onCustomerAddressChange(newAddr.address);
      setNewAddress({ name: "", address: "" });
      setShowAddAddress(false);
    } catch (error) {
      console.error("Error saving address:", error);
      alert(isEnglish ? "Failed to save address. Please try again." : "保存地址失败，请重试。");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleCustomAddressChange = async (value: string) => {
    onCustomerAddressChange(value);
    setSelectedAddressId("custom");
  };

  // Address management functions
  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setNewAddress({ name: address.name, address: address.address });
    setShowAddAddress(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!session?.user?.id) return;

    try {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", addressId);

      if (error) {
        console.error("Error deleting address:", error);
        alert(isEnglish ? "Failed to delete address." : "删除地址失败。");
        return;
      }

      // Update local state
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      
      // If deleted address was selected, clear selection
      if (selectedAddressId === addressId) {
        setSelectedAddressId("");
        onCustomerAddressChange("");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      alert(isEnglish ? "Failed to delete address." : "删除地址失败。");
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!session?.user?.id) return;

    try {
      // First get customer ID
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (customerError || !customerData) return;

      // Update all addresses for this customer to not be default
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("customer_id", customerData.id);

      // Set the selected address as default
      const { error } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", addressId);

      if (error) {
        console.error("Error setting default address:", error);
        alert(isEnglish ? "Failed to set default address." : "设置默认地址失败。");
        return;
      }

      // Update local state
      setAddresses(prev => 
        prev.map(addr => ({
          ...addr,
          isDefault: addr.id === addressId
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
          address: newAddress.address.trim()
        })
        .eq("id", editingAddress.id);

      if (error) {
        console.error("Error updating address:", error);
        alert(isEnglish ? "Failed to update address." : "更新地址失败。");
        return;
      }

      // Update local state
      setAddresses(prev => 
        prev.map(addr => 
          addr.id === editingAddress.id 
            ? { ...addr, name: newAddress.name.trim(), address: newAddress.address.trim() }
            : addr
        )
      );

      // If this was the selected address, update the form
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
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
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
            className="w-full max-w-md bg-white h-full p-4 overflow-y-auto"
            exit={{ x: "100%" }}
            initial={{ x: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{isEnglish ? "Create Order" : "创建订单"}</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={onClose}
              >
                ✕
              </button>
            </div>

            {/* Customer Information */}
            <div className="mb-4 space-y-3">
              <h3 className="font-semibold">{isEnglish ? "Customer Information" : "客户信息"}</h3>
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
                    {isEnglish ? "Phone Number" : "电话号码"}
                  </label>
                  <input
                    required
                    className="w-full p-2 border rounded-md"
                    placeholder={isEnglish ? "Enter phone number" : "输入电话号码"}
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => onCustomerPhoneChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isEnglish ? "Delivery Address" : "配送地址"}
                  </label>
                  
                  {/* Address Management */}
                  {addresses.length > 0 && (
                    <div className="mb-2">
                      <div className="space-y-2">
                        {addresses.map((address) => (
                          <div key={address.id} className="p-2 bg-gray-50 rounded border flex items-center gap-3">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name="address"
                                value={address.id}
                                checked={selectedAddressId === address.id}
                                onChange={() => {
                                  handleAddressSelect(address.id);
                                  onCustomerAddressChange(address.address);
                                }}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{address.name}</span>
                                {address.isDefault && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {isEnglish ? "Default" : "默认"}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{address.address}</p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditAddress(address)}
                                className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1"
                                title={isEnglish ? "Edit" : "编辑"}
                              >
                                ✏️
                              </button>
                              {!address.isDefault && (
                                <button
                                  onClick={() => handleSetDefaultAddress(address.id)}
                                  className="text-yellow-600 hover:text-yellow-800 text-xs px-2 py-1"
                                  title={isEnglish ? "Set as default" : "设为默认"}
                                >
                                  ⭐
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteAddress(address.id)}
                                className="text-red-600 hover:text-red-800 text-xs px-2 py-1"
                                title={isEnglish ? "Delete" : "删除"}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Address Input */}
                  <textarea
                    required
                    className="w-full p-2 border rounded-md resize-none"
                    placeholder={isEnglish ? "Enter delivery address" : "输入配送地址"}
                    rows={3}
                    value={customerAddress}
                    onChange={(e) => handleCustomAddressChange(e.target.value)}
                  />

                  {/* Add New Address Button */}
                  <button
                    type="button"
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    onClick={() => setShowAddAddress(true)}
                  >
                    <Plus className="w-3 h-3" />
                    {addresses.length === 0 
                      ? (isEnglish ? "Add New Address" : "添加新地址")
                      : (isEnglish ? "Add another address" : "添加另一个地址")
                    }
                  </button>
                </div>
              </div>
            </div>

            {selectedProducts.length > 0 && (
              <div className="mb-4 space-y-2">
                <h3 className="font-semibold mb-2">
                  {isEnglish ? "Selected Products" : "已选产品"}
                </h3>
                {selectedProducts.map(({ product, quantity }) => (
                  <div key={product.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium">
                        {isEnglish ? product.Product : product.Product_CH}
                      </p>
                      <span className="text-sm text-gray-600">
                        ${product.price.toFixed(2)}/{product.UOM}
                      </span>
                    </div>
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
                ))}
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

            {/* Add/Edit Address Modal */}
            {showAddAddress && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">
                    {editingAddress 
                      ? (isEnglish ? "Edit Address" : "编辑地址")
                      : (isEnglish ? "Add New Address" : "添加新地址")
                    }
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isEnglish ? "Address Name" : "地址名称"}
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-md"
                        placeholder={isEnglish ? "e.g., Home, Office" : "例如：家、办公室"}
                        value={newAddress.name}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isEnglish ? "Address" : "地址"}
                      </label>
                      <textarea
                        className="w-full p-2 border rounded-md resize-none"
                        rows={3}
                        placeholder={isEnglish ? "Enter full address" : "输入完整地址"}
                        value={newAddress.address}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button
                      type="button"
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      onClick={() => {
                        setShowAddAddress(false);
                        setEditingAddress(null);
                        setNewAddress({ name: "", address: "" });
                      }}
                    >
                      {isEnglish ? "Cancel" : "取消"}
                    </button>
                    <button
                      type="button"
                      className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      onClick={editingAddress ? handleUpdateAddress : handleAddNewAddress}
                      disabled={!newAddress.name?.trim() || !newAddress.address?.trim() || isSavingAddress}
                    >
                      {isSavingAddress ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isEnglish ? "Saving..." : "保存中..."}
                        </>
                      ) : (
                        <>{editingAddress 
                          ? (isEnglish ? "Update Address" : "更新地址")
                          : (isEnglish ? "Add Address" : "添加地址")
                        }</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Order Review Component */}
            <OrderReview
              isOpen={showReview}
              isEnglish={isEnglish}
              selectedProducts={selectedProducts}
              customerName={customerName}
              customerPhone={customerPhone}
              customerAddress={customerAddress}
              isSubmitting={isSubmitting}
              onClose={() => setShowReview(false)}
              onConfirmOrder={(data) => {
                setReviewData(data);
                setShowReview(false);
                // Pass review data to the parent component
                if (typeof onSubmitOrder === 'function') {
                  onSubmitOrder(data);
                }
              }}
              onBackToEdit={() => setShowReview(false)}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

OrderPanel.displayName = "OrderPanel";

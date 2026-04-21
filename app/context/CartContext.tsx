"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabaseClient";
import { OrderDetails, OrderReviewData, isAuthenticatedSession } from "@/app/types/common";
import { STORAGE_KEYS } from "@/app/constants/app-constants";
import type { Product } from "@/app/types/product";

export type OrderCartItem = { product: Product; quantity: number };

export type UseOrderReturn = {
  selectedProducts: OrderCartItem[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  isSubmitting: boolean;
  isOrderPanelOpen: boolean;
  setIsOrderPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setCustomerAddress: (address: string) => void;
  addToOrder: (product: Product) => void;
  updateQuantity: (productId: number, newQuantity: number) => void;
  clearOrder: () => void;
  replaceOrder: (payload: {
    selectedProducts: OrderCartItem[];
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
  }) => void;
  submitOrder: (
    session: Session | null,
    isEnglish: boolean,
    sendWhatsAppNotification: (orderDetails: OrderDetails) => void,
    reviewData?: OrderReviewData
  ) => Promise<boolean>;
};

type CartContextType = UseOrderReturn;

const OrderContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = STORAGE_KEYS.PENDING_ORDER;

type StoredOrder = {
  selectedProducts: OrderCartItem[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
};

const readStored = (): StoredOrder | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredOrder) : null;
  } catch {
    return null;
  }
};

const writeStored = (data: StoredOrder) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const clearStored = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
};

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const stored = readStored();

  const [selectedProducts, setSelectedProducts] = useState<OrderCartItem[]>(
    stored?.selectedProducts ?? []
  );
  const [customerName, setCustomerName] = useState(stored?.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(stored?.customerPhone ?? "");
  const [customerAddress, setCustomerAddress] = useState(stored?.customerAddress ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      writeStored({
        selectedProducts,
        customerName,
        customerPhone,
        customerAddress,
      });
    }, 120);

    return () => clearTimeout(timeout);
  }, [selectedProducts, customerName, customerPhone, customerAddress]);

  const addToOrder = useCallback((product: Product) => {
    setSelectedProducts((prev) => {
      const existingProduct = prev.find((item) => item.product.id === product.id);
      if (existingProduct) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      setSelectedProducts((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      setSelectedProducts((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  }, []);

  const clearOrder = useCallback(() => {
    setSelectedProducts([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    clearStored();
  }, []);

  const replaceOrder = useCallback(
    (payload: {
      selectedProducts: OrderCartItem[];
      customerName?: string;
      customerPhone?: string;
      customerAddress?: string;
    }) => {
      setSelectedProducts(payload.selectedProducts || []);
      setCustomerName(payload.customerName || "");
      setCustomerPhone(payload.customerPhone || "");
      setCustomerAddress(payload.customerAddress || "");

      writeStored({
        selectedProducts: payload.selectedProducts || [],
        customerName: payload.customerName || "",
        customerPhone: payload.customerPhone || "",
        customerAddress: payload.customerAddress || "",
      });
    },
    []
  );

  const submitOrder = useCallback(
    async (
      session: Session | null,
      isEnglish: boolean,
      sendWhatsAppNotification: (orderDetails: OrderDetails) => void,
      reviewData?: OrderReviewData
    ): Promise<boolean> => {
      if (!isAuthenticatedSession(session)) {
        alert(isEnglish ? "Please log in to submit an order" : "请登录以提交订单");
        return false;
      }

      if (selectedProducts.length === 0) {
        alert(
          isEnglish ? "Please add at least one product to the order" : "请至少添加一个产品到订单"
        );
        return false;
      }

      if (!customerName || !customerPhone || !customerAddress) {
        alert(
          isEnglish
            ? "Please provide customer name, Mobile number, and address"
            : "请提供客户姓名、电话号码和地址"
        );
        return false;
      }

      setIsSubmitting(true);

      try {
        const totalAmount = selectedProducts.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );

        let uploadedFileUrls: string[] = [];
        if (reviewData?.uploadedFiles && reviewData.uploadedFiles.length > 0) {
          const uploadPromises = reviewData.uploadedFiles.map(async (file) => {
            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `orders/${session!.user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from("order-files")
              .upload(filePath, file);

            if (uploadError) return null;

            const {
              data: { publicUrl },
            } = supabase.storage.from("order-files").getPublicUrl(filePath);

            return publicUrl;
          });

          const uploadResults = await Promise.all(uploadPromises);
          uploadedFileUrls = uploadResults.filter((url): url is string => !!url);
        }

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert([
            {
              status: "pending",
              total_amount: totalAmount,
              user_id: session!.user.id,
              customer_name: customerName,
              customer_phone: customerPhone,
              customer_address: customerAddress,
              remarks: reviewData?.remarks || null,
              purchase_order: reviewData?.purchaseOrder || null,
              uploaded_files: uploadedFileUrls.length > 0 ? uploadedFileUrls : null,
            },
          ])
          .select()
          .single();

        if (orderError) throw orderError;

        const orderItems = selectedProducts.map((item) => ({
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          total_price: item.product.price * item.quantity,
          product_name: isEnglish ? item.product.Product : item.product.Product_CH,
          product_code: item.product["Item Code"] || "N/A",
          created_at: new Date().toISOString(),
        }));

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
        if (itemsError) throw itemsError;

        sendWhatsAppNotification({
          orderId: order.id,
          customerName,
          totalAmount,
          items: selectedProducts.map((item) => ({
            productName: isEnglish
              ? item.product.Product
              : item.product.Product_CH || item.product.Product,
            quantity: item.quantity,
            price: item.product.price,
          })),
        });

        clearOrder();
        alert(isEnglish ? "Order submitted successfully!" : "订单提交成功！");
        return true;
      } catch {
        alert(isEnglish ? "Error submitting order. Please try again." : "提交订单时出错，请重试。");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedProducts, customerName, customerPhone, customerAddress, clearOrder]
  );

  const value: CartContextType = useMemo(
    () => ({
      selectedProducts,
      customerName,
      customerPhone,
      customerAddress,
      isSubmitting,
      isOrderPanelOpen,
      setIsOrderPanelOpen,
      setCustomerName,
      setCustomerPhone,
      setCustomerAddress,
      addToOrder,
      updateQuantity,
      clearOrder,
      replaceOrder,
      submitOrder,
    }),
    [
      selectedProducts,
      customerName,
      customerPhone,
      customerAddress,
      isSubmitting,
      isOrderPanelOpen,
      addToOrder,
      updateQuantity,
      clearOrder,
      replaceOrder,
      submitOrder,
    ]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder(): UseOrderReturn {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within a CartProvider");
  }
  return context;
}

type CartNavContext = {
  cartCount: number;
  isOrderPanelOpen: boolean;
  setIsOrderPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useCart(): CartNavContext {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  const cartCount = useMemo(
    () => ctx.selectedProducts.reduce((sum, item) => sum + item.quantity, 0),
    [ctx.selectedProducts]
  );
  return {
    cartCount,
    isOrderPanelOpen: ctx.isOrderPanelOpen,
    setIsOrderPanelOpen: ctx.setIsOrderPanelOpen,
  };
}

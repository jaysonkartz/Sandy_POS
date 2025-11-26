import { useState, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabaseClient";
import { OrderDetails, OrderReviewData, isAuthenticatedSession } from "@/app/types/common";

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

interface UseOrderReturn {
  selectedProducts: { product: Product; quantity: number }[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  isSubmitting: boolean;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setCustomerAddress: (address: string) => void;
  addToOrder: (product: Product) => void;
  updateQuantity: (productId: number, newQuantity: number) => void;
  clearOrder: () => void;
  submitOrder: (
    session: Session | null,
    isEnglish: boolean,
    sendWhatsAppNotification: (orderDetails: OrderDetails) => void,
    reviewData?: OrderReviewData
  ) => Promise<boolean>;
}

export const useOrder = (): UseOrderReturn => {
  const [selectedProducts, setSelectedProducts] = useState<{ product: Product; quantity: number }[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addToOrder = useCallback((product: Product) => {
    setSelectedProducts((prev) => {
      const existingProduct = prev.find((item) => item.product.id === product.id);
      if (existingProduct) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { product, quantity: 1 }];
      }
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
  }, []);

  const submitOrder = useCallback(async (
    session: Session | null,
    isEnglish: boolean,
    sendWhatsAppNotification: (orderDetails: OrderDetails) => void,
    reviewData?: OrderReviewData
  ): Promise<boolean> => {
    // Check if user is authenticated
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
        isEnglish ? "Please provide customer name, phone number, and address" : "请提供客户姓名、电话号码和地址"
      );
      return false;
    }

    setIsSubmitting(true);

    try {
      // Calculate total amount
      const totalAmount = selectedProducts.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );

      // Upload files if any
      let uploadedFileUrls: string[] = [];
      if (reviewData?.uploadedFiles && reviewData.uploadedFiles.length > 0) {
        const uploadPromises = reviewData.uploadedFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `orders/${session.user.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('order-files')
            .upload(filePath, file);
          
          if (uploadError) {
            return null;
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('order-files')
            .getPublicUrl(filePath);
          
          return publicUrl;
        });
        
        const uploadResults = await Promise.all(uploadPromises);
        uploadedFileUrls = uploadResults.filter((url: string | null) => url !== null) as string[];
      }

      // Create order with user_id and review data
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            status: "pending",
            total_amount: totalAmount,
            user_id: session.user.id,
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

      if (orderError) {
        throw orderError;
      }

      // Create order items
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

      if (itemsError) {
        throw itemsError;
      }

      // Send WhatsApp notification
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

      // Clear form
      clearOrder();

      // Show success message
      alert(isEnglish ? "Order submitted successfully!" : "订单提交成功！");
      return true;
    } catch (error) {
      alert(isEnglish ? "Error submitting order. Please try again." : "提交订单时出错，请重试。");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedProducts, customerName, customerPhone, customerAddress, clearOrder]);

  return {
    selectedProducts,
    customerName,
    customerPhone,
    customerAddress,
    isSubmitting,
    setCustomerName,
    setCustomerPhone,
    setCustomerAddress,
    addToOrder,
    updateQuantity,
    clearOrder,
    submitOrder,
  };
};

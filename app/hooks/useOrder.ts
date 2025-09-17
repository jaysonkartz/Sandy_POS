import { useState, useCallback } from "react";
import { supabase } from "@/app/lib/supabaseClient";

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
  fillCustomerInfo: (session: any) => Promise<void>;
  loadCustomerAddresses: (session: any) => Promise<Address[]>;
  saveCustomerAddress: (session: any, address: Omit<Address, 'id'>) => Promise<boolean>;
  submitOrder: (
    session: any,
    isEnglish: boolean,
    sendWhatsAppNotification: (orderDetails: any) => void,
    reviewData?: {
      remarks: string;
      purchaseOrder: string;
      uploadedFiles: File[];
    }
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

  const fillCustomerInfo = useCallback(async (session: any) => {
    if (!session?.user?.id) {
      console.warn("No session or user ID available");
      return;
    }

    try {
      // Try to fetch customer data by user_id first
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("name, email, phone, address, delivery_address")
        .eq("user_id", session.user.id)
        .single();

      if (customerData && !customerError) {
        // Use customer data if available
        setCustomerName(customerData.name || "");
        setCustomerPhone(customerData.phone || "");
        setCustomerAddress(customerData.delivery_address || customerData.address || "");
        return;
      }

      // If no customer data found, try to fetch by email
      const { data: customerByEmail, error: emailError } = await supabase
        .from("customers")
        .select("name, email, phone, address, delivery_address")
        .eq("email", session.user.email)
        .single();

      if (customerByEmail && !emailError) {
        setCustomerName(customerByEmail.name || "");
        setCustomerPhone(customerByEmail.phone || "");
        setCustomerAddress(customerByEmail.delivery_address || customerByEmail.address || "");
        return;
      }

      // If no customer data found at all, use basic user info
      setCustomerName(session.user.email?.split("@")[0] || "");
      setCustomerPhone("");
      setCustomerAddress("");

    } catch (error) {
      console.error("Error fetching customer info:", error);
      // Fallback to basic user info
      setCustomerName(session.user.email?.split("@")[0] || "");
      setCustomerPhone("");
      setCustomerAddress("");
    }
  }, []);

  const loadCustomerAddresses = useCallback(async (session: any): Promise<Address[]> => {
    if (!session?.user?.id) {
      return [];
    }

    try {
      // For now, we'll create addresses from the customer's existing address data
      // In a real implementation, you might have a separate addresses table
      const { data: customerData, error } = await supabase
        .from("customers")
        .select("address, delivery_address")
        .eq("user_id", session.user.id)
        .single();

      if (customerData && !error) {
        const addresses: Address[] = [];
        
        if (customerData.delivery_address) {
          addresses.push({
            id: "delivery",
            name: "Delivery Address",
            address: customerData.delivery_address,
            isDefault: true
          });
        }
        
        if (customerData.address && customerData.address !== customerData.delivery_address) {
          addresses.push({
            id: "home",
            name: "Home Address",
            address: customerData.address,
            isDefault: false
          });
        }

        return addresses;
      }

      return [];
    } catch (error) {
      console.error("Error loading customer addresses:", error);
      return [];
    }
  }, []);

  const saveCustomerAddress = useCallback(async (session: any, address: Omit<Address, 'id'>): Promise<boolean> => {
    if (!session?.user?.id) {
      return false;
    }

    try {
      // Update the customer's delivery_address in the customers table
      const { error } = await supabase
        .from("customers")
        .update({ 
          delivery_address: address.address,
          address: address.isDefault ? address.address : undefined
        })
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Error saving customer address:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error saving customer address:", error);
      return false;
    }
  }, []);

  const submitOrder = useCallback(async (
    session: any,
    isEnglish: boolean,
    sendWhatsAppNotification: (orderDetails: any) => void,
    reviewData?: {
      remarks: string;
      purchaseOrder: string;
      uploadedFiles: File[];
    }
  ): Promise<boolean> => {
    // Check if user is authenticated
    if (!session) {
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
            console.error('Error uploading file:', uploadError);
            return null;
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('order-files')
            .getPublicUrl(filePath);
          
          return publicUrl;
        });
        
        const uploadResults = await Promise.all(uploadPromises);
        uploadedFileUrls = uploadResults.filter(url => url !== null) as string[];
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
        console.error("Error creating order:", orderError);
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
        console.error("Error creating order items:", itemsError);
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
      console.error("Error submitting order:", error);
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
    fillCustomerInfo,
    loadCustomerAddresses,
    saveCustomerAddress,
    submitOrder,
  };
};

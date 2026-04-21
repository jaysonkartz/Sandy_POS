import { useCallback } from "react";
import { WHATSAPP_PHONE_NUMBER, WHATSAPP_DEFAULT_MESSAGE } from "@/app/constants/app-constants";

interface OrderDetails {
  orderId: number;
  customerName: string;
  totalAmount: number;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
}

interface ProductInquiryDetails {
  productName: string;
  variation?: string;
  origin?: string;
  weight?: string;
}

export const useWhatsApp = () => {
  const handleCustomerService = useCallback((productDetails?: ProductInquiryDetails) => {
    const inquiryLines = [WHATSAPP_DEFAULT_MESSAGE];

    if (productDetails) {
      inquiryLines.push("", "Product details:", `Product: ${productDetails.productName}`);

      if (productDetails.variation) {
        inquiryLines.push(`Variation: ${productDetails.variation}`);
      }

      if (productDetails.origin) {
        inquiryLines.push(`Origin: ${productDetails.origin}`);
      }

      if (productDetails.weight) {
        inquiryLines.push(`Weight: ${productDetails.weight}`);
      }
    }

    const message = inquiryLines.join("\n");
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  }, []);

  const sendWhatsAppNotification = useCallback((orderDetails: OrderDetails) => {
    const lines = [
      "🛍️ *New Order Notification*",
      `Order ID: ${orderDetails.orderId}`,
      `Customer: ${orderDetails.customerName}`,
      `Total Amount: $${orderDetails.totalAmount.toFixed(2)}`,
      "",
      "Order Items:",
      ...orderDetails.items.map(
        (item) => `- ${item.productName} x ${item.quantity} @ $${item.price.toFixed(2)}`
      ),
      "",
      "Please check the admin panel for more details.",
    ];
  
    const message = lines.join("\n");
  
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE_NUMBER}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  }, []);

  return {
    handleCustomerService,
    sendWhatsAppNotification,
  };
};

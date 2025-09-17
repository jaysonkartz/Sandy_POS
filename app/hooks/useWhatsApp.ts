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

export const useWhatsApp = () => {
  const handleCustomerService = useCallback(() => {
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`;
    window.open(whatsappUrl, "_blank");
  }, []);

  const sendWhatsAppNotification = useCallback((orderDetails: OrderDetails) => {
    const message = `
🛍️ New Order Notification
Order ID: ${orderDetails.orderId}
Customer: ${orderDetails.customerName}
Total Amount: $${orderDetails.totalAmount.toFixed(2)}

Order Items:
${orderDetails.items
  .map((item) => `- ${item.productName} x ${item.quantity} @ $${item.price.toFixed(2)}`)
  .join("\n")}

Please check the admin panel for more details.
    `.trim();

    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  }, []);

  return {
    handleCustomerService,
    sendWhatsAppNotification,
  };
};

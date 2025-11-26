import { Session } from "@supabase/supabase-js";

/**
 * Type for authenticated session with user
 */
export type AuthenticatedSession = Session & {
  user: NonNullable<Session["user"]>;
};

/**
 * Type guard to check if session is authenticated
 */
export const isAuthenticatedSession = (session: Session | null): session is AuthenticatedSession => {
  return !!(session?.user?.id && session?.user?.email);
};

/**
 * Order details for WhatsApp notification
 */
export interface OrderDetails {
  orderId: number;
  customerName: string;
  totalAmount: number;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
}

/**
 * Review data for order submission
 */
export interface OrderReviewData {
  remarks: string;
  purchaseOrder: string;
  uploadedFiles: File[];
}


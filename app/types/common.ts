import { Session } from "@supabase/supabase-js";

export type { Session };

export type AuthenticatedSession = Session & {
  user: NonNullable<Session["user"]>;
};

export const isAuthenticatedSession = (
  session: Session | null
): session is AuthenticatedSession => {
  return !!(session?.user?.id && session?.user?.email);
};

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

export interface OrderReviewData {
  remarks: string;
  purchaseOrder: string;
  uploadedFiles: File[];
}

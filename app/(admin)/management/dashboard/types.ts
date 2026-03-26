import type { ReactElement } from "react";
import type { ProductVariant } from "@/app/types/product";

export interface DashboardSection {
  id: string;
  title: string;
  icon: ReactElement;
  description: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  avatar_url: string;
  created_at: string;
  name?: string;
}

export interface Product {
  id: number;
  Product: string;
  price: number;
  Category: string;
  "Item Code"?: string;
  Variation?: string;
  weight?: string;
  UOM?: string;
  Country?: string;
  countryName?: string;
  variants?: ProductVariant[];
  priceHistory?: {
    previous_price: number;
    original_price: number;
    last_price_update?: string;
    created_at?: string;
  }[];
  customerPriceHistory?: {
    customer_id: string;
    original_price: number;
    last_price_update?: string;
    created_at?: string;
  }[];
  order_items?: {
    order_id: number;
    price?: number;
    orders?: {
      customer_name: string;
      customer_phone: string;
      customer_id?: string;
    }[];
  }[];
}

export interface Category {
  id: string;
  name: string;
  chineseName?: string;
  products: Product[];
}

export interface OrderDetail {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  status: string;
}

export type OrderItemRow = {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  total_price: number;
  product_name: string;
  product_code: string;
};

export type CustomerRow = {
  id: string | number;
  name: string;
  phone?: string | null;
  email?: string | null;
  user_id?: string | null;
};

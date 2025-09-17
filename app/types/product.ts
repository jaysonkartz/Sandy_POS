export interface Product {
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

export interface ProductGroup {
  title: string;
  products: Product[];
  category: string;
}

export interface SelectedProduct {
  product: Product;
  quantity: number;
}

export interface SelectedOptions {
  [title: string]: {
    variation?: string;
    countryId?: string;
    weight?: string;
  };
}

export interface Country {
  id: string;
  name: string;
  chineseName: string;
}

export interface CountryMap {
  [key: string]: {
    name: string;
    chineseName: string;
  };
}

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

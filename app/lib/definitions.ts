// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
// For simplicity of teaching, we're manually defining these types.
// However, these types are generated automatically if you're using an ORM such as Prisma.
export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  image_url: string;
};

export type Invoice = {
  id: string;
  customer_id: string;
  amount: number;
  date: string;
  // In TypeScript, this is called a string union type.
  // It means that the "status" property can only be one of the two strings: 'pending' or 'paid'.
  status: "pending" | "paid";
};

export type Revenue = {
  month: string;
  revenue: number;
};

export type LatestInvoice = {
  id: string;
  name: string;
  image_url: string;
  email: string;
  amount: string;
};

// The database returns a number for amount, but we later format it to a string with the formatCurrency function
export type LatestInvoiceRaw = Omit<LatestInvoice, "amount"> & {
  amount: number;
};

export type InvoicesTable = {
  id: string;
  customer_id: string;
  name: string;
  email: string;
  image_url: string;
  date: string;
  amount: number;
  status: "pending" | "paid";
};

export type CustomersTableType = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: number;
  total_paid: number;
};

export type CustomersTableType2 = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  paid_invoices: number;
  pending_invoices: number;
  total_transactions: number;
  total_paid: number;
  total_pending: number;
  oldest_unpaid_invoice_date: string;
};

export type FormattedCustomersTable2 = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  paid_invoices: number;
  pending_invoices: number;
  total_transactions: string;
  total_paid: string;
  total_pending: string;
  oldest_unpaid_invoice_date: string;
};

export type FormattedCustomersTable = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: string;
  total_paid: string;
};

export type CustomerField = {
  id: string;
  name: string;
};

export type InvoiceForm = {
  id: string;
  customer_id: string;
  amount: number;
  status: "pending" | "paid";
};

export type DisplayColumns<T> = {
  name: string;
  uid: keyof T;
  sortable: boolean;
  type: string;
  required: boolean;
  createForm: boolean;
  editForm: boolean;
};

export type PageContext = {
  ENTITY: string;
  ENTITIES: string;
  BASE_URL: string;
};

export type Person = {
  p_id: string;
  p_phone: string;
  p_name: string;
  p_bazi_date: string;
  p_bazi_time: string;
  p_gender: string;
  p_address: string;
  p_postal: string;
  created_at: string;
  updated_at: string;
};

export type Event = {
  event_id: string;
  event_index: string;
  event_name: string;
  event_start_date: string;
  event_end_date: string;
  event_description: string;
  event_benefits: string;
  event_cn_name: string;
  event_lunar_start_date: string;
  event_lunar_end_date: string;
  event_cn_description: string;
  event_cn_benefits: string;
  event_price: string;
  event_remarks: string;
  registration_start_date: string;
  max_registration: string;
};

export type Plan = {
  plan_id: string;
  plan_name: string;
  plan_start_date: string;
  plan_end_date: string;
  plan_description: string;
  plan_benefits: string;
  plan_cn_name: string;
  plan_cn_description: string;
  plan_cn_benefits: string;
  plan_price: string;
  plan_renewable: string;
  plan_remarks: string;
  total_slots: string;
};

export type PlanOrder = {
  plan_o_id: string;
  purchaser: string;
  plan_id: string;
  plan_o_date: string;
  plan_o_price: string;
  plan_o_remarks: string;
  plan_o_slot: string;
  plan_o_payment_status: string;
};

export type EventOrder = {
  event_o_id: string;
  purchaser: string;
  event_id: string;
  event_o_date: string;
  event_o_price: string;
  event_o_remarks: string;
  attendee_id: string;
  event_attend: string;
  event_o_payment_status: string;
};

import { sql } from "@vercel/postgres";

import {
  CustomerField,
  CustomersTableType2,
  Event,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Person,
  Revenue,
  Plan,
  PlanOrder,
  EventOrder,
  DisplayColumns,
} from "./definitions";
import { formatCurrency } from "./utils";

export async function fetchRevenue() {
  try {
    // await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await sql<Revenue>`SELECT * FROM revenue`;

    return data.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch revenue data.");
  }
}

export async function fetchLatestInvoices() {
  try {
    const data = await sql<LatestInvoiceRaw>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.rows.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));

    return latestInvoices;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch the latest invoices.");
  }
}

export async function fetchCardData() {
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0].rows[0].count ?? "0");
    const numberOfCustomers = Number(data[1].rows[0].count ?? "0");
    const totalPaidInvoices = formatCurrency(data[2].rows[0].paid ?? "0");
    const totalPendingInvoices = formatCurrency(data[2].rows[0].pending ?? "0");

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch card data.");
  }
}

const ITEMS_PER_PAGE = 6;

export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await sql<InvoicesTable>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return invoices.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoices.");
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const count = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);

    return totalPages;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of invoices.");
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await sql<InvoiceForm>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.rows.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoice.");
  }
}

export async function fetchCustomers() {
  try {
    const data = await sql<CustomerField>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    const customers = data.rows;

    return customers;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch all customers.");
  }
}

export async function fetchFilteredCustomers(query: string) {
  console.log(query);
  try {
    const data = await sql<CustomersTableType2>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'paid' THEN 1 ELSE 0 END) AS paid_invoices,
      SUM(CASE WHEN invoices.status = 'pending' THEN 1 ELSE 0 END) AS pending_invoices,
      SUM(CASE WHEN invoices.status = 'pending' OR invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_transactions,
      SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid,
      SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
      MIN(CASE WHEN invoices.status = 'pending' THEN invoices.date ELSE NULL END) AS oldest_unpaid_invoice_date
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
      total_transactions: formatCurrency(customer.total_transactions),
    }));

    return customers;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch customer table.");
  }
}

export async function fetchFilteredOutstandingCustomers(query: string) {
  try {
    const data = await sql<CustomersTableType2>`
		SELECT
      customers.id,
      customers.name,
      customers.email,
      customers.image_url,
      COUNT(invoices.id) AS total_invoices,
      SUM(CASE WHEN invoices.status = 'paid' THEN 1 ELSE 0 END) AS paid_invoices,
      SUM(CASE WHEN invoices.status = 'pending' THEN 1 ELSE 0 END) AS pending_invoices,
      SUM(CASE WHEN invoices.status = 'pending' OR invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_transactions,
      SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid,
      SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
      MIN(CASE WHEN invoices.status = 'pending' THEN invoices.date ELSE NULL END) AS oldest_unpaid_invoice_date
    FROM customers
    LEFT JOIN invoices ON customers.id = invoices.customer_id
    WHERE
		  customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`}
    GROUP BY customers.id, customers.name, customers.email, customers.image_url
    HAVING 
      SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) > 0 AND
      MIN(CASE WHEN invoices.status = 'pending' THEN invoices.date ELSE NULL END) < (NOW() - INTERVAL '30 DAY')
    ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
      total_transactions: formatCurrency(customer.total_transactions),
    }));

    return customers;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch customer table.");
  }
}

export const personColumns: DisplayColumns<Person>[] = [
  {
    name: "CUSTOMER ID",
    uid: "p_id",
    sortable: true,
    type: "number",
    required: true,
    createForm: false,
    editForm: false,
  },
  {
    name: "PHONE",
    uid: "p_phone",
    sortable: true,
    type: "number",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "NAME",
    uid: "p_name",
    sortable: true,
    type: "text",
    required: false,
    createForm: true,
    editForm: true,
  },
  {
    name: "BAZI DATE",
    uid: "p_bazi_date",
    sortable: true,
    type: "date",
    required: false,
    createForm: true,
    editForm: true,
  },
  {
    name: "BAZI TIME",
    uid: "p_bazi_time",
    sortable: true,
    type: "time",
    required: false,
    createForm: true,
    editForm: true,
  },
  {
    name: "GENDER",
    uid: "p_gender",
    sortable: true,
    type: "text",
    required: false,
    createForm: true,
    editForm: true,
  },
  {
    name: "ADDRESS",
    uid: "p_address",
    sortable: true,
    type: "text",
    required: false,
    createForm: true,
    editForm: true,
  },
  {
    name: "POSTAL",
    uid: "p_postal",
    sortable: true,
    type: "text",
    required: false,
    createForm: true,
    editForm: true,
  },
];

export async function fetchPeople() {
  try {
    const data = await sql<Person>`
      SELECT * FROM person`;

    return data.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch people.");
  }
}

export async function fetchPersonById(id: string) {
  try {
    const data = await sql<Person>`
      SELECT * FROM person 
      WHERE person.p_id = ${id} 
      LIMIT 1
      `;

    return data.rows[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch people.");
  }
}

export const eventColumns: DisplayColumns<Event>[] = [
  {
    name: "EVENT ID",
    uid: "event_id",
    sortable: true,
    type: "number",
    required: true,
    createForm: false,
    editForm: false,
  },
  {
    name: "EVENT INDEX",
    uid: "event_index",
    sortable: true,
    type: "text",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "NAME",
    uid: "event_name",
    sortable: true,
    type: "text",
    required: false,
    createForm: true,
    editForm: true,
  },
  {
    name: "START DATE",
    uid: "event_start_date",
    sortable: true,
    type: "date",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "END DATE",
    uid: "event_end_date",
    sortable: true,
    type: "date",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "DESCRIPTION",
    uid: "event_description",
    sortable: true,
    type: "text",
    required: false,
    createForm: true,
    editForm: true,
  },
  {
    name: "BENEFITS",
    uid: "event_benefits",
    sortable: true,
    type: "text",
    required: false,
    createForm: true,
    editForm: true,
  },
  {
    name: "CHINESE NAME",
    uid: "event_cn_name",
    sortable: false,
    type: "text",
    required: false,
    createForm: true,
    editForm: true,
  },
  {
    name: "LUNAR START DATE",
    uid: "event_lunar_start_date",
    sortable: true,
    type: "text",
    required: false,
    createForm: true,
    editForm: true,
  },
  {
    name: "LUNAR END DATE",
    uid: "event_lunar_end_date",
    sortable: true,
    type: "text",
    required: false,
    createForm: true,
    editForm: true,
  },
  {
    name: "CHINESE DESCRIPTION",
    uid: "event_cn_description",
    type: "text",
    sortable: true,
    required: false,
    createForm: true,
    editForm: true,
  },
  {
    name: "CHINESE BENEFITS",
    uid: "event_cn_benefits",
    sortable: true,
    type: "text",
    required: false,
    createForm: true,
    editForm: true,
  },
  {
    name: "PRICE",
    uid: "event_price",
    sortable: true,
    type: "number",
    required: false,
    createForm: true,
    editForm: true,
  },
  {
    name: "REMARKS",
    uid: "event_remarks",
    sortable: true,
    type: "text",
    required: false,
    createForm: true,
    editForm: true,
  },
  {
    name: "REGISTRATION START",
    uid: "registration_start_date",
    sortable: false,
    type: "date",
    required: false,
    createForm: true,
    editForm: true,
  },
  {
    name: "MAX REGISTRATION",
    uid: "max_registration",
    sortable: true,
    type: "number",
    required: false,
    createForm: true,
    editForm: true,
  },
];

export async function fetchEvents() {
  try {
    const data = await sql<Event>`
      SELECT * FROM event`;

    return data.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch event.");
  }
}

export async function fetchEventsPresentOrFuture() {
  try {
    const data = await sql<Event>`
      SELECT * FROM event WHERE event_date >= CURRENT_DATE`;

    return data.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch event.");
  }
}

export async function fetchEventById(id: string) {
  try {
    const data = await sql<Event>`
      SELECT * FROM event 
      WHERE event.event_id = ${id} 
      LIMIT 1
      `;

    return data.rows[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch event.");
  }
}

export const planColumns: DisplayColumns<Plan>[] = [
  {
    name: "Plan ID",
    uid: "plan_id",
    sortable: true,
    type: "number",
    required: true,
    createForm: false,
    editForm: false,
  },
  {
    name: "NAME",
    uid: "plan_name",
    sortable: true,
    type: "text",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "PLAN START DATE",
    uid: "plan_start_date",
    sortable: true,
    type: "date",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "PLAN END DATE",
    uid: "plan_end_date",
    sortable: true,
    type: "date",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "DESCRIPTION",
    uid: "plan_description",
    sortable: true,
    type: "text",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "BENEFITS",
    uid: "plan_benefits",
    sortable: true,
    type: "text",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "CHINESE NAME",
    uid: "plan_cn_name",
    sortable: false,
    type: "text",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "CHINESE DESCRIPTION",
    uid: "plan_cn_description",
    sortable: true,
    type: "text",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "CHINESE BENEFITS",
    uid: "plan_cn_benefits",
    sortable: true,
    type: "text",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "PRICE",
    uid: "plan_price",
    sortable: true,
    type: "number",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "REMARKS",
    uid: "plan_remarks",
    sortable: true,
    type: "text",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "RENEWABLE",
    uid: "plan_renewable",
    sortable: false,
    type: "text",
    required: true,
    createForm: false,
    editForm: false,
  },
  {
    name: "Total Slots",
    uid: "total_slots",
    sortable: true,
    type: "number",
    required: true,
    createForm: true,
    editForm: true,
  },
];

export async function fetchPlans() {
  try {
    const data = await sql<Plan>`
      SELECT * FROM plan`;

    return data.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch plan.");
  }
}

export async function fetchPlansPresentOrFuture() {
  try {
    const data = await sql<Plan>`
      SELECT * FROM plan WHERE plan_end_date >= CURRENT_DATE`;

    return data.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch plan.");
  }
}

export async function fetchPlanById(id: string) {
  try {
    const data = await sql<Plan>`
      SELECT * FROM plan 
      WHERE plan.plan_id = ${id} 
      LIMIT 1
      `;

    return data.rows[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch plan.");
  }
}

export const planOrderColumns: DisplayColumns<PlanOrder>[] = [
  {
    name: "Plan Order ID",
    uid: "plan_o_id",
    sortable: true,
    type: "number",
    required: true,
    createForm: false,
    editForm: false,
  },
  {
    name: "PURCHASER",
    uid: "purchaser",
    sortable: true,
    type: "number",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "PLAN ID",
    uid: "plan_id",
    sortable: true,
    type: "number",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "ORDER DATE",
    uid: "plan_o_date",
    sortable: true,
    type: "date",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "PRICE",
    uid: "plan_o_price",
    sortable: true,
    type: "text",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "REMARKS",
    uid: "plan_o_remarks",
    sortable: true,
    type: "text",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "SLOT",
    uid: "plan_o_slot",
    sortable: false,
    type: "number",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "PAYMENT STATUS",
    uid: "plan_o_payment_status",
    sortable: true,
    type: "text",
    required: true,
    createForm: false,
    editForm: false,
  },
];

export async function fetchPlanOrders() {
  try {
    const data = await sql<PlanOrder>`
      SELECT * FROM plan_order`;

    return data.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch plan order.");
  }
}

export async function fetchPlanOrderById(id: string) {
  try {
    const data = await sql<PlanOrder>`
      SELECT * FROM plan_order 
      WHERE plan_order.plan_o_id = ${id} 
      LIMIT 1
      `;

    return data.rows[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch plan order.");
  }
}

export const eventOrderColumns: DisplayColumns<EventOrder>[] = [
  {
    name: "Event Order ID",
    uid: "event_o_id",
    sortable: true,
    type: "number",
    required: true,
    createForm: false,
    editForm: false,
  },
  {
    name: "PURCHASER",
    uid: "purchaser",
    sortable: true,
    type: "number",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "Event ID",
    uid: "event_id",
    sortable: true,
    type: "number",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "ORDER DATE",
    uid: "event_o_date",
    sortable: true,
    type: "date",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "PRICE",
    uid: "event_o_price",
    sortable: true,
    type: "text",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "REMARKS",
    uid: "event_o_remarks",
    sortable: true,
    type: "text",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "ATTENDEE",
    uid: "attendee_id",
    sortable: false,
    type: "number",
    required: true,
    createForm: true,
    editForm: true,
  },
  {
    name: "ATTENDED EVENT",
    uid: "event_attend",
    sortable: false,
    type: "text",
    required: true,
    createForm: false,
    editForm: false,
  },
  {
    name: "PAYMENT STATUS",
    uid: "event_o_payment_status",
    sortable: true,
    type: "text",
    required: true,
    createForm: false,
    editForm: false,
  },
];

export async function fetchEventOrders() {
  try {
    const data = await sql<EventOrder>`
      SELECT * FROM event_order`;

    return data.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch event order.");
  }
}

export async function fetchEventOrderById(id: string) {
  try {
    const data = await sql<EventOrder>`
      SELECT * FROM event_order 
      WHERE event_order.event_o_id = ${id} 
      LIMIT 1
      `;

    return data.rows[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch event order.");
  }
}

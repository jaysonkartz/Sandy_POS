import { supabase } from "../lib/supabaseClient";
import { invoices, customers, revenue, users } from "../lib/placeholder-data";
import { NextResponse } from "next/server";

// Simple hash function for development
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

async function seedInvoices() {
  const { error: createError } = await supabase.rpc("create_invoices_table");
  if (createError) throw createError;

  const { error: insertError } = await supabase.from("invoices").upsert(
    invoices.map((invoice) => ({
      customer_id: invoice.customer_id,
      amount: invoice.amount,
      status: invoice.status,
      date: invoice.date,
    }))
  );

  if (insertError) throw insertError;
}

async function seedCustomers() {
  const { error: createError } = await supabase.rpc("create_customers_table");
  if (createError) throw createError;

  const { error: insertError } = await supabase.from("customers").upsert(
    customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      image_url: customer.image_url,
    }))
  );

  if (insertError) throw insertError;
}

async function seedRevenue() {
  const { error: createError } = await supabase.rpc("create_revenue_table");
  if (createError) throw createError;

  const { error: insertError } = await supabase.from("revenue").upsert(
    revenue.map((rev) => ({
      month: rev.month,
      revenue: rev.revenue,
    }))
  );

  if (insertError) throw insertError;
}

async function seedUsers() {
  const { error: createError } = await supabase.rpc("create_users_table");
  if (createError) throw createError;

  const { error: insertError } = await supabase.from("users").upsert(
    users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      password: simpleHash(user.password),
      role: "user",
    }))
  );

  if (insertError) throw insertError;
}

export async function GET() {
  try {
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();

    return NextResponse.json({ message: "Database seeded successfully" });
  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}

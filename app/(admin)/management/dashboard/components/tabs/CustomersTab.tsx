"use client";

import CustomerManagement from "@/app/components/CustomerManagement";

export default function CustomersTab({ view }: { view?: "pending" }) {
  if (view === "pending") {
    return <CustomerManagement view="pending" />;
  }
  return <CustomerManagement />;
}

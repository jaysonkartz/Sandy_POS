"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { LazyMotion, domAnimation, m } from "framer-motion";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: boolean;
  created_at: string;
  user_id: string;
  user?: {
    id: string;
    email: string;
    role: string;
  } | null;
}

interface EditCustomer extends Customer {
  isEditing?: boolean;
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: true,
  });
  const [editingCustomer, setEditingCustomer] = useState<EditCustomer | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createBrowserClient(supabaseUrl, supabaseKey);

  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        setError(error.message || 'Failed to fetch customers');
        return;
      }

      if (!data) {
        console.error("No data returned from customers table");
        setCustomers([]);
        return;
      }

      // Fetch user data separately for each customer
      const customersWithUsers = await Promise.all(
        data.map(async (customer) => {
          if (customer.user_id) {
            try {
              const { data: userData, error: userError } = await supabase
                .from("users")
                .select("id, email, role")
                .eq("id", customer.user_id)
                .maybeSingle();

              if (userError && userError.code !== 'PGRST116') {
                console.error(`Error fetching user data for customer ${customer.id}:`, userError);
                return { ...customer, user: null };
              }

              // If user not found (PGRST116), just attach null user without logging error
              return {
                ...customer,
                user: userData || null,
              };

            } catch (error) {
              console.error(`Error fetching user data for customer ${customer.id}:`, error);
              return { ...customer, user: null };
            }
          }
          return customer;
        })
      );

      setCustomers(customersWithUsers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError('Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []); // Empty dependency array to run only once on mount

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newCustomer.name && newCustomer.email) {
      // Check if user exists
      const { data: existingUser, error: userCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("email", newCustomer.email)
        .single();

      if (userCheckError && userCheckError.code !== "PGRST116") {
        console.error("Error checking user:", userCheckError);
        return;
      }

      const customerData = {
        ...newCustomer,
        user_id: existingUser?.id, // Link to user if exists
      };

      const { error } = await supabase.from("customers").insert([customerData]);

      if (error) {
        console.error("Error adding customer:", error);
        setError(error.message || 'Failed to add customer');
        return;
      }

      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        address: "",
        status: true,
      });
      setIsModalOpen(false);
      await fetchCustomers();
    }
  };

  const handleStatusToggle = async (customerId: number, currentStatus: boolean) => {
    const { error } = await supabase
      .from("customers")
      .update({ status: !currentStatus })
      .eq("id", customerId);

    if (error) {
      console.error("Error updating customer status:", error);
      setError(error.message || 'Failed to update customer status');
      return;
    }

    await fetchCustomers();
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer({ ...customer, isEditing: true });
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer) return;

    try {
      const { error } = await supabase
        .from("customers")
        .update({
          name: editingCustomer.name,
          email: editingCustomer.email,
          phone: editingCustomer.phone,
          address: editingCustomer.address,
        })
        .eq("id", editingCustomer.id);

      if (error) throw error;

      setEditingCustomer(null);
      await fetchCustomers();
    } catch (error) {
      console.error("Error updating customer:", error);
      if (error instanceof Error) {
        setError(error.message || 'Failed to update customer');
      } else {
        setError('Failed to update customer');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Customer Management</h2>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          onClick={() => setIsModalOpen(true)}
        >
          Add Customer
        </button>
      </div>

      {/* Add Customer Modal */}
      <LazyMotion features={domAnimation}>
        {isModalOpen && (
          <m.div
            key="modal"
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
          >
            <m.div
              key="modal-content"
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              exit={{ opacity: 0, scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add New Customer</h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setIsModalOpen(false)}
                >
                  ✕
                </button>
              </div>
              <form className="space-y-4" onSubmit={handleAddCustomer}>
                <input
                  required
                  className="w-full border p-2 rounded"
                  placeholder="Name"
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                />
                <input
                  required
                  className="w-full border p-2 rounded"
                  placeholder="Email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Phone"
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Address"
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    type="submit"
                  >
                    Add Customer
                  </button>
                </div>
              </form>
            </m.div>
          </m.div>
        )}
      </LazyMotion>

      {/* Edit Customer Modal */}
      <LazyMotion features={domAnimation}>
        {editingCustomer && (
          <m.div
            key="edit-modal"
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
          >
            <m.div
              key="edit-modal-content"
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              exit={{ opacity: 0, scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Edit Customer</h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setEditingCustomer(null)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M6 18L18 6M6 6l12 12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <input
                  required
                  className="w-full border p-2 rounded"
                  placeholder="Name"
                  type="text"
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                />
                <input
                  required
                  className="w-full border p-2 rounded"
                  placeholder="Email"
                  type="email"
                  value={editingCustomer.email}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, email: e.target.value })
                  }
                />
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Phone"
                  type="tel"
                  value={editingCustomer.phone}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, phone: e.target.value })
                  }
                />
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Address"
                  type="text"
                  value={editingCustomer.address}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, address: e.target.value })
                  }
                />
                <div className="flex justify-end space-x-2">
                  <button
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                    type="button"
                    onClick={() => setEditingCustomer(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    onClick={handleSaveEdit}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </m.div>
          </m.div>
        )}
      </LazyMotion>

      {/* Customers List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Customers List</h2>
        </div>
        {error ? (
          <div className="p-4 text-red-500">
            Error loading customers: {error}
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <m.tr key={customer.id} animate={{ opacity: 1 }} initial={{ opacity: 0 }}>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          customer.status
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {customer.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleEdit(customer)}
                        >
                          Edit
                        </button>
                        <button
                          className={`${
                            customer.status
                              ? "text-red-600 hover:text-red-900"
                              : "text-green-600 hover:text-green-900"
                          }`}
                          onClick={() => handleStatusToggle(customer.id, customer.status)}
                        >
                          {customer.status ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </m.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

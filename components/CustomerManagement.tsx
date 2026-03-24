"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { LazyMotion, domAnimation, m } from "framer-motion";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: boolean;
  created_at: string;
  user_id: string;
  customer_code: string | null;
  whatsapp_notifications?: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
  } | null;
}

interface EditCustomer extends Customer {
  isEditing?: boolean;
}

type CustomerManagementView = "all" | "pending";

export default function CustomerManagement({ view = "all" }: { view?: CustomerManagementView }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: true,
    customer_code: "",
    whatsapp_notifications: true,
  });
  const [editingCustomer, setEditingCustomer] = useState<EditCustomer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [error, setError] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(customers.length / itemsPerPage));
  const offset = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = customers.slice(offset, offset + itemsPerPage);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("customers").select("*").order("created_at", { ascending: false });

      if (view === "pending") {
        query = query.eq("status", false);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Supabase error:", error);
        setError(error.message || "Failed to fetch customers");
        return;
      }

      if (!data) {
        setCustomers([]);
        return;
      }

      const customersWithUsers = await Promise.all(
        data.map(async (customer) => {
          if (customer.user_id) {
            try {
              const { data: userData, error: userError } = await supabase
                .from("users")
                .select("id, email, role")
                .eq("id", customer.user_id)
                .maybeSingle();

              if (userError && userError.code !== "PGRST116") {
                console.error(`Error fetching user data for customer ${customer.id}:`, userError);
                return { ...customer, user: null };
              }

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
      setError("Failed to fetch customers");
    } finally {
      setIsLoading(false);
    }
  }, [view]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    const nextTotalPages = Math.ceil(customers.length / itemsPerPage);
    if (currentPage > nextTotalPages && nextTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [customers.length, itemsPerPage, currentPage]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newCustomer.name && newCustomer.email) {
      try {
        const { data: existingUser, error: userCheckError } = await supabase
          .from("users")
          .select("id")
          .eq("email", newCustomer.email)
          .single();

        if (userCheckError && userCheckError.code !== "PGRST116") {
          return;
        }

        let userId = existingUser?.id;
        if (!userId) {
          const { data: anyUser } = await supabase.from("users").select("id").limit(1).single();
          userId = anyUser?.id;
        }

        const customerData: any = {
          name: newCustomer.name,
          email: newCustomer.email,
          phone: newCustomer.phone || null,
          address: newCustomer.address || null,
          status: newCustomer.status ?? true,
          user_id: userId,
          created_at: new Date().toISOString(),
          whatsapp_notifications: newCustomer.whatsapp_notifications ?? true,
        };

        if (newCustomer.customer_code && newCustomer.customer_code.trim()) {
          customerData.customer_code = newCustomer.customer_code.trim();
        }

        const { error } = await supabase.from("customers").insert([customerData]);

        if (error) {
          console.error("Error adding customer:", error);

          if (error.code === "PGRST204") {
            let retryData = { ...customerData };
            let errorMessage = "";

            if (error.message?.includes("customer_code")) {
              errorMessage =
                "The customer_code column doesn't exist in the database. Please run the migration script 'scripts/add-customer-code-column.sql' in your Supabase SQL Editor, or try adding the customer without a code.";
              delete retryData.customer_code;
            } else if (error.message?.includes("whatsapp_notifications")) {
              errorMessage =
                "The whatsapp_notifications column doesn't exist in the database. Please run the migration script 'scripts/add-whatsapp-notifications-column.sql' in your Supabase SQL Editor.";
              delete retryData.whatsapp_notifications;
            }

            if (errorMessage) {
              setError(errorMessage);

              const { error: retryError } = await supabase.from("customers").insert([retryData]);
              if (!retryError) {
                setError(null);
                setNewCustomer({
                  name: "",
                  email: "",
                  phone: "",
                  address: "",
                  status: true,
                  customer_code: "",
                  whatsapp_notifications: true,
                });
                setIsModalOpen(false);
                await fetchCustomers();
                return;
              }
            } else {
              setError(error.message || "Failed to add customer");
            }
          } else {
            setError(error.message || "Failed to add customer");
          }
          return;
        }

        setNewCustomer({
          name: "",
          email: "",
          phone: "",
          address: "",
          status: true,
          customer_code: "",
          whatsapp_notifications: true,
        });
        setIsModalOpen(false);
        setCurrentPage(1); // Reset to first page after adding
        await fetchCustomers();
      } catch (error) {
        alert("Failed to add customer. Please try again.");
      }
    }
  };

  const handleStatusToggle = async (customerId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("customers")
      .update({ status: !currentStatus })
      .eq("id", customerId);

    if (error) {
      console.error("Error updating customer status:", error);
      setError(error.message || "Failed to update customer status");
      return;
    }

    await fetchCustomers();
  };

  const handleEdit = (customer: Customer) => {
    setError(null); // Clear any previous errors
    setEditingCustomer({ ...customer, isEditing: true });
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer) return;

    try {
      setError(null);

      if (!editingCustomer.id) {
        setError("Invalid customer ID. Please refresh and try again.");
        return;
      }

      if (!editingCustomer.name || !editingCustomer.email) {
        setError("Name and email are required.");
        return;
      }

      const updateData: any = {
        name: editingCustomer.name,
        email: editingCustomer.email,
        phone: editingCustomer.phone || null,
        address: editingCustomer.address || null,
        whatsapp_notifications: editingCustomer.whatsapp_notifications ?? true,
      };

      if (editingCustomer.customer_code && editingCustomer.customer_code.trim()) {
        updateData.customer_code = editingCustomer.customer_code.trim();
      } else if (editingCustomer.customer_code === "") {
        updateData.customer_code = null;
      }

      console.warn("Updating customer with data:", {
        id: editingCustomer.id,
        ...updateData,
      });

      const { data, error } = await supabase
        .from("customers")
        .update(updateData)
        .eq("id", editingCustomer.id)
        .select();

      if (error) {
        const errorInfo: any = {
          errorExists: true,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          errorString: String(error),
          errorToString: error.toString(),
        };

        try {
          errorInfo.message = error.message;
          errorInfo.details = error.details;
          errorInfo.hint = error.hint;
          errorInfo.code = error.code;
          errorInfo.statusCode = (error as any).statusCode;
          errorInfo.status = (error as any).status;

          try {
            errorInfo.fullError = JSON.parse(JSON.stringify(error));
          } catch (e) {
            errorInfo.fullError = String(error);
            errorInfo.serializationError = String(e);
          }

          errorInfo.allProperties = Object.keys(error);
          errorInfo.propertyCount = Object.keys(error).length;

          for (const key in error) {
            if (Object.prototype.hasOwnProperty.call(error, key)) {
              errorInfo[`prop_${key}`] = (error as any)[key];
            }
          }

          try {
            const allProps = Object.getOwnPropertyNames(error);
            errorInfo.allOwnPropertyNames = allProps;
            allProps.forEach((prop) => {
              try {
                errorInfo[`ownProp_${prop}`] = (error as any)[prop];
              } catch (e) {
                errorInfo[`ownProp_${prop}_error`] = String(e);
              }
            });
          } catch (e) {
            errorInfo.getOwnPropertyNamesError = String(e);
          }
        } catch (e) {
          errorInfo.serializationError = String(e);
        }

        console.error("Supabase error updating customer - Full details:", errorInfo);
        console.error("Raw error object:", error);
        console.error("Error JSON:", JSON.stringify(error, null, 2));

        let errorMessage = "Failed to update customer";

        if (error.message) {
          errorMessage = error.message;
        } else if (error.details) {
          errorMessage = error.details;
        } else if (error.hint) {
          errorMessage = error.hint;
        } else if ((error as any).statusCode) {
          errorMessage = `Update failed with status ${(error as any).statusCode}`;
        } else if (String(error) !== "[object Object]") {
          errorMessage = String(error);
        } else {
          const keys = Object.keys(error);
          if (keys.length === 0) {
            errorMessage = "An unknown error occurred. Please check the console for details.";
            console.warn(
              "Empty error object detected. This might indicate a Supabase connection issue."
            );
          } else {
            errorMessage = `Update failed: ${keys.join(", ")}`;
          }
        }

        const errorCode = error.code || (error as any).statusCode;
        if (errorCode === "PGRST204") {
          let retryUpdateData = { ...updateData };
          let columnName = "";

          if (error.message?.includes("customer_code")) {
            columnName = "customer_code";
            delete retryUpdateData.customer_code;
            errorMessage =
              "The customer_code column doesn't exist in the database. The customer was updated without the code. Please run the migration script 'scripts/add-customer-code-column.sql' in your Supabase SQL Editor to enable customer codes.";
          } else if (error.message?.includes("whatsapp_notifications")) {
            columnName = "whatsapp_notifications";
            delete retryUpdateData.whatsapp_notifications;
            errorMessage =
              "The whatsapp_notifications column doesn't exist in the database. The customer was updated without this preference. Please run the migration script 'scripts/add-whatsapp-notifications-column.sql' in your Supabase SQL Editor.";
          } else {
            errorMessage = `Database schema error: ${error.message || "Column not found"}. Please check your database schema.`;
          }

          if (columnName) {
            console.warn(`Retrying update without ${columnName}...`);
            const { data: retryData, error: retryError } = await supabase
              .from("customers")
              .update(retryUpdateData)
              .eq("id", editingCustomer.id)
              .select();

            if (!retryError && retryData && retryData.length > 0) {
              setEditingCustomer(null);
              await fetchCustomers();
              return; // Exit early on success
            }

            if (retryError) {
              errorMessage = `Update partially completed. Customer info updated but ${columnName} failed: ${retryError.message || "Column not found"}. Please run the appropriate migration script in your Supabase SQL Editor.`;
              setEditingCustomer(null);
              await fetchCustomers();
              return;
            }
          }
        } else if (errorCode === "23505" || errorCode === 23505) {
          errorMessage = "A customer with this code or email already exists";
        } else if (errorCode === "23503" || errorCode === 23503) {
          errorMessage = "Invalid reference. Please check your data.";
        } else if (errorCode === "PGRST301" || errorCode === "PGRST116") {
          errorMessage = "No rows were updated. Customer may not exist.";
        } else if (errorCode === 404) {
          errorMessage = "Customer not found. Please refresh and try again.";
        } else if (errorCode === 401 || errorCode === 403) {
          errorMessage = "You don't have permission to update this customer.";
        }

        setError(errorMessage);
        return;
      }

      if (!data || data.length === 0) {
        setError("No rows were updated. Customer may not exist.");
        return;
      }

      setEditingCustomer(null);
      setCurrentPage(1); // Reset to first page after editing
      await fetchCustomers();
    } catch (error) {
      console.error("Unexpected error updating customer:", error);

      let errorMessage = "Failed to update customer";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      } else if (error && typeof error === "object") {
        const err = error as any;
        if (err.message) {
          errorMessage = err.message;
        } else if (err.details) {
          errorMessage = err.details;
        }
      }

      setError(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {view === "pending" ? "Pending Approvals" : "Customer Management"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {view === "pending"
              ? "Review and approve new customer accounts"
              : "Manage your customer database"}
          </p>
        </div>

        {view !== "pending" && (
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            onClick={() => setIsModalOpen(true)}
          >
            + Add Customer
          </button>
        )}
      </div>

      <LazyMotion features={domAnimation}>
        {view !== "pending" && isModalOpen && (
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter customer name"
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Code
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter customer code (optional)"
                    type="text"
                    value={newCustomer.customer_code || ""}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, customer_code: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter mobile number"
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter address"
                    type="text"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    checked={newCustomer.whatsapp_notifications ?? true}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    id="new_whatsapp_notifications"
                    type="checkbox"
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, whatsapp_notifications: e.target.checked })
                    }
                  />
                  <label
                    className="ml-2 block text-sm text-gray-700"
                    htmlFor="new_whatsapp_notifications"
                  >
                    Enable WhatsApp notifications
                  </label>
                </div>
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
                  onClick={() => {
                    setEditingCustomer(null);
                    setError(null);
                  }}
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
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter customer name"
                    type="text"
                    value={editingCustomer.name}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Code
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter customer code (optional)"
                    type="text"
                    value={editingCustomer.customer_code || ""}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, customer_code: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                    type="email"
                    value={editingCustomer.email}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phmobileone number"
                    type="tel"
                    value={editingCustomer.phone}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter address"
                    type="text"
                    value={editingCustomer.address}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, address: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center">
                  <input
                    checked={editingCustomer.whatsapp_notifications ?? true}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    id="edit_whatsapp_notifications"
                    type="checkbox"
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        whatsapp_notifications: e.target.checked,
                      })
                    }
                  />
                  <label
                    className="ml-2 block text-sm text-gray-700"
                    htmlFor="edit_whatsapp_notifications"
                  >
                    Enable WhatsApp notifications
                  </label>
                </div>
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
      <div className="bg-white rounded-lg shadow-sm overflow-hidden w-full">
        <div className="p-4 bg-gray-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Customers List</h2>
            <p className="text-sm text-gray-500 mt-1">
              {customers.length} customer{customers.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600" htmlFor="customer-records-per-page">
              Records
            </label>
            <select
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="customer-records-per-page"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error ? (
          <div className="p-4 text-red-500">Error loading customers: {error}</div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="w-full overflow-x-hidden overflow-y-visible">
            {customers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg mb-2">No customers found</p>
                <p className="text-sm">
                  Try adding a customer or check the console for debugging information.
                </p>
              </div>
            ) : (
              <table className="table-fixed w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-[10%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Code
                    </th>
                    <th className="w-[16%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="w-[20%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="w-[12%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="w-[20%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="w-[8%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="w-[8%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      WhatsApp
                    </th>
                    <th className="w-[14%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm text-gray-700 break-words">
                        <span
                          className={`font-medium ${customer.customer_code ? "text-gray-900" : "text-gray-400"}`}
                        >
                          {customer.customer_code || "-"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-gray-900 break-words">
                        {customer.name}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 break-all">
                        {customer.email}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 break-words">
                        {customer.phone || "-"}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 break-words">
                        {customer.address || "-"}
                      </td>
                      <td className="px-3 py-3">
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
                      <td className="px-3 py-3">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            customer.whatsapp_notifications !== false
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {customer.whatsapp_notifications !== false ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-left">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 font-medium text-sm text-left break-words"
                            onClick={() => handleEdit(customer)}
                          >
                            Edit
                          </button>
                          <button
                            className={`font-medium text-sm text-left break-words ${
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!isLoading && customers.length > 0 && (
          <div className="bg-white px-4 py-3 flex flex-col gap-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600" htmlFor="customer-records-per-page-footer">
                  Records per page
                </label>
                <select
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="customer-records-per-page-footer"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </button>
              <button
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{offset + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(offset + itemsPerPage, customers.length)}
                  </span>{" "}
                  of <span className="font-medium">{customers.length}</span> results
                </p>
              </div>
              <div>
                <nav
                  aria-label="Pagination"
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                >
                  <button
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        clipRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        fillRule="evenodd"
                      />
                    </svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                      const showEllipsisAfter =
                        index < array.length - 1 && array[index + 1] !== page + 1;

                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsisBefore && (
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                              ...
                            </span>
                          )}
                          <button
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                          {showEllipsisAfter && (
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                              ...
                            </span>
                          )}
                        </div>
                      );
                    })}
                  <button
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        clipRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        fillRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

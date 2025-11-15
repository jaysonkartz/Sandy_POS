"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
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
    customer_code: "",
    whatsapp_notifications: true,
  });
  const [editingCustomer, setEditingCustomer] = useState<EditCustomer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    throw new Error("Missing Supabase environment variables");
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
        setError(error.message || "Failed to fetch customers");
        return;
      }

      if (!data) {
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

              if (userError && userError.code !== "PGRST116") {
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
      setError("Failed to fetch customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []); // Empty dependency array to run only once on mount

  // Reset to first page if current page exceeds total pages
  useEffect(() => {
    const totalPages = Math.ceil(customers.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [customers.length, itemsPerPage, currentPage]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newCustomer.name && newCustomer.email) {
      try {
        // Check if user exists
        const { data: existingUser, error: userCheckError } = await supabase
          .from("users")
          .select("id")
          .eq("email", newCustomer.email)
          .single();

        if (userCheckError && userCheckError.code !== "PGRST116") {
          return;
        }

        // If no user exists, try to get any existing user or create a placeholder
        let userId = existingUser?.id;
        if (!userId) {
          const { data: anyUser } = await supabase.from("users").select("id").limit(1).single();
          userId = anyUser?.id;
        }

        // Prepare customer data, excluding customer_code if it's empty
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

        // Only include customer_code if it has a value (handle case where column might not exist)
        if (newCustomer.customer_code && newCustomer.customer_code.trim()) {
          customerData.customer_code = newCustomer.customer_code.trim();
        }

        const { error } = await supabase.from("customers").insert([customerData]);

        if (error) {
          console.error("Error adding customer:", error);
          
          // Handle PGRST204 error for missing columns
          if (error.code === "PGRST204") {
            let retryData = { ...customerData };
            let errorMessage = "";
            
            if (error.message?.includes("customer_code")) {
              errorMessage = "The customer_code column doesn't exist in the database. Please run the migration script 'scripts/add-customer-code-column.sql' in your Supabase SQL Editor, or try adding the customer without a code.";
              delete retryData.customer_code;
            } else if (error.message?.includes("whatsapp_notifications")) {
              errorMessage = "The whatsapp_notifications column doesn't exist in the database. Please run the migration script 'scripts/add-whatsapp-notifications-column.sql' in your Supabase SQL Editor.";
              delete retryData.whatsapp_notifications;
            }
            
            if (errorMessage) {
              setError(errorMessage);
              
              // Retry without the problematic column as a fallback
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
      // Clear any previous errors
      setError(null);
      
      // Validate input data before sending
      if (!editingCustomer.id) {
        setError("Invalid customer ID. Please refresh and try again.");
        return;
      }

      if (!editingCustomer.name || !editingCustomer.email) {
        setError("Name and email are required.");
        return;
      }

      // Prepare update data
      const updateData: any = {
        name: editingCustomer.name,
        email: editingCustomer.email,
        phone: editingCustomer.phone || null,
        address: editingCustomer.address || null,
        whatsapp_notifications: editingCustomer.whatsapp_notifications ?? true,
      };

      // Only include customer_code if it has a value
      if (editingCustomer.customer_code && editingCustomer.customer_code.trim()) {
        updateData.customer_code = editingCustomer.customer_code.trim();
      } else if (editingCustomer.customer_code === "") {
        // Explicitly set to null if empty string was provided
        updateData.customer_code = null;
      }

      console.log("Updating customer with data:", {
        id: editingCustomer.id,
        ...updateData,
      });

      const { data, error } = await supabase
        .from("customers")
        .update(updateData)
        .eq("id", editingCustomer.id)
        .select();

      // Check for error - handle both truthy errors and empty object errors
      if (error) {
        // Try to extract all possible error information
        const errorInfo: any = {
          errorExists: true,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          errorString: String(error),
          errorToString: error.toString(),
        };
        
        try {
          // Try to access all known Supabase error properties
          errorInfo.message = error.message;
          errorInfo.details = error.details;
          errorInfo.hint = error.hint;
          errorInfo.code = error.code;
          errorInfo.statusCode = (error as any).statusCode;
          errorInfo.status = (error as any).status;
          
          // Try to serialize the entire error object
          try {
            errorInfo.fullError = JSON.parse(JSON.stringify(error));
          } catch (e) {
            errorInfo.fullError = String(error);
            errorInfo.serializationError = String(e);
          }
          
          // Try to get all enumerable properties
          errorInfo.allProperties = Object.keys(error);
          errorInfo.propertyCount = Object.keys(error).length;
          
          for (const key in error) {
            if (Object.prototype.hasOwnProperty.call(error, key)) {
              errorInfo[`prop_${key}`] = (error as any)[key];
            }
          }
          
          // Try Object.getOwnPropertyNames for non-enumerable properties
          try {
            const allProps = Object.getOwnPropertyNames(error);
            errorInfo.allOwnPropertyNames = allProps;
            allProps.forEach(prop => {
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
        
        // Extract meaningful error message
        let errorMessage = "Failed to update customer";
        
        // Try multiple ways to extract the message
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
          // If error exists but appears empty, check if it's truly empty
          const keys = Object.keys(error);
          if (keys.length === 0) {
            errorMessage = "An unknown error occurred. Please check the console for details.";
            console.warn("Empty error object detected. This might indicate a Supabase connection issue.");
          } else {
            errorMessage = `Update failed: ${keys.join(", ")}`;
          }
        }
        
        // Handle specific error codes
        const errorCode = error.code || (error as any).statusCode;
        if (errorCode === "PGRST204") {
          let retryUpdateData = { ...updateData };
          let columnName = "";
          
          if (error.message?.includes("customer_code")) {
            columnName = "customer_code";
            delete retryUpdateData.customer_code;
            errorMessage = "The customer_code column doesn't exist in the database. The customer was updated without the code. Please run the migration script 'scripts/add-customer-code-column.sql' in your Supabase SQL Editor to enable customer codes.";
          } else if (error.message?.includes("whatsapp_notifications")) {
            columnName = "whatsapp_notifications";
            delete retryUpdateData.whatsapp_notifications;
            errorMessage = "The whatsapp_notifications column doesn't exist in the database. The customer was updated without this preference. Please run the migration script 'scripts/add-whatsapp-notifications-column.sql' in your Supabase SQL Editor.";
          } else {
            errorMessage = `Database schema error: ${error.message || "Column not found"}. Please check your database schema.`;
          }
          
          if (columnName) {
            // Try to retry the update without the problematic column
            console.log(`Retrying update without ${columnName}...`);
            const { data: retryData, error: retryError } = await supabase
              .from("customers")
              .update(retryUpdateData)
              .eq("id", editingCustomer.id)
              .select();
            
            if (!retryError && retryData && retryData.length > 0) {
              // Success! Update worked without the problematic column
              setEditingCustomer(null);
              await fetchCustomers();
              return; // Exit early on success
            }
            
            // If retry also failed, show that error instead
            if (retryError) {
              errorMessage = `Update partially completed. Customer info updated but ${columnName} failed: ${retryError.message || "Column not found"}. Please run the appropriate migration script in your Supabase SQL Editor.`;
              // Still exit since we updated the other fields
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
      
      // Handle various error types
      let errorMessage = "Failed to update customer";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      } else if (error && typeof error === "object") {
        // Handle Supabase-like error objects
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
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your customer database</p>
        </div>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
          onClick={() => setIsModalOpen(true)}
        >
          + Add Customer
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Code</label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter customer code (optional)"
                    type="text"
                    value={newCustomer.customer_code || ""}
                    onChange={(e) => setNewCustomer({ ...newCustomer, customer_code: e.target.value })}
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
                    placeholder="Enter phone number"
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
                    type="checkbox"
                    id="new_whatsapp_notifications"
                    checked={newCustomer.whatsapp_notifications ?? true}
                    onChange={(e) => setNewCustomer({ ...newCustomer, whatsapp_notifications: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="new_whatsapp_notifications" className="ml-2 block text-sm text-gray-700">
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
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Code</label>
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
                    placeholder="Enter phone number"
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
                    type="checkbox"
                    id="edit_whatsapp_notifications"
                    checked={editingCustomer.whatsapp_notifications ?? true}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, whatsapp_notifications: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="edit_whatsapp_notifications" className="ml-2 block text-sm text-gray-700">
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
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Customers List</h2>
          <p className="text-sm text-gray-500 mt-1">{customers.length} customer{customers.length !== 1 ? 's' : ''} total</p>
        </div>
        {error ? (
          <div className="p-4 text-red-500">Error loading customers: {error}</div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible">
            {customers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg mb-2">No customers found</p>
                <p className="text-sm">
                  Try adding a customer or check the console for debugging information.
                </p>
              </div>
            ) : (
              <table className="w-full divide-y divide-gray-200" style={{ minWidth: '100%' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      WhatsApp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '200px', width: '200px' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-medium ${customer.customer_code ? "text-gray-900" : "text-gray-400"}`}>
                          {customer.customer_code || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{customer.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{customer.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{customer.phone || "-"}</td>
                      <td className="px-6 py-4 text-gray-600">{customer.address || "-"}</td>
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
                      <td className="px-4 py-4 text-left" style={{ minWidth: '200px', width: '200px' }}>
                        <div className="flex items-center gap-3">
                          <button
                            className="text-blue-600 hover:text-blue-900 font-medium text-sm whitespace-nowrap"
                            onClick={() => handleEdit(customer)}
                          >
                            Edit
                          </button>
                          <button
                            className={`font-medium text-sm whitespace-nowrap ${
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
        
        {/* Pagination */}
        {!isLoading && customers.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(customers.length / itemsPerPage), prev + 1))}
                disabled={currentPage >= Math.ceil(customers.length / itemsPerPage)}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, customers.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{customers.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: Math.ceil(customers.length / itemsPerPage) }, (_, i) => i + 1)
                    .filter(page => {
                      const totalPages = Math.ceil(customers.length / itemsPerPage);
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      const totalPages = Math.ceil(customers.length / itemsPerPage);
                      const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                      const showEllipsisAfter = index < array.length - 1 && array[index + 1] !== page + 1;
                      
                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsisBefore && (
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
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
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(customers.length / itemsPerPage), prev + 1))}
                    disabled={currentPage >= Math.ceil(customers.length / itemsPerPage)}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
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

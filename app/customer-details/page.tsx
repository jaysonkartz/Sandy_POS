"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/supabase";
import { useRouter } from "next/navigation";

type Customer = {
  name: string;
  email: string;
  company_name: string;
  address: string;
  delivery_address: string;
  phone: string;
  status: boolean;
  created_at: string;
};

export default function CustomerDetails() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchCustomerData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data: customerData, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setCustomer(customerData);
      setEditedCustomer(customerData);
    } catch (error) {
      console.error("Error fetching customer data:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditedCustomer(customer);
  };

  const handleSave = async () => {
    if (!editedCustomer) return;

    try {
      setSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("customers")
        .update({
          name: editedCustomer.name,
          company_name: editedCustomer.company_name,
          address: editedCustomer.address,
          delivery_address: editedCustomer.delivery_address,
          phone: editedCustomer.phone,
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      setCustomer(editedCustomer);
      setEditMode(false);
      // Show success message
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Customer, value: string | boolean) => {
    if (editedCustomer) {
      setEditedCustomer({ ...editedCustomer, [field]: value });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!customer || !editedCustomer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">No customer data found</h1>
          <p className="text-gray-600 mt-2">
            Please contact support if you believe this is an error
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => router.push("/")}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            Back to Main Page
          </button>
          {!editMode ? (
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              onClick={handleEdit}
            >
              Edit Profile
            </button>
          ) : (
            <div className="space-x-2">
              <button
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={saving}
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Customer Profile</h1>
            <p className="text-blue-100 mt-1">
              Member since {new Date(customer.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-sm font-medium text-gray-500">Personal Information</h2>
                  <div className="mt-2 space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      {editMode ? (
                        <input
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          type="text"
                          value={editedCustomer.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                        />
                      ) : (
                        <p className="text-lg font-medium text-gray-900">{customer.name}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-lg font-medium text-gray-900">{customer.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      {editMode ? (
                        <input
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          type="text"
                          value={editedCustomer.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                        />
                      ) : (
                        <p className="text-lg font-medium text-gray-900">{customer.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-sm font-medium text-gray-500">Company Information</h2>
                  <div className="mt-2 space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Company Name</p>
                      {editMode ? (
                        <input
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          type="text"
                          value={editedCustomer.company_name}
                          onChange={(e) => handleChange("company_name", e.target.value)}
                        />
                      ) : (
                        <p className="text-lg font-medium text-gray-900">{customer.company_name}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Company Address</p>
                      {editMode ? (
                        <textarea
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          rows={3}
                          value={editedCustomer.address}
                          onChange={(e) => handleChange("address", e.target.value)}
                        />
                      ) : (
                        <p className="text-lg font-medium text-gray-900 whitespace-pre-line">
                          {customer.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-sm font-medium text-gray-500">Delivery Information</h2>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Delivery Address</p>
                    {editMode ? (
                      <textarea
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        rows={3}
                        value={editedCustomer.delivery_address}
                        onChange={(e) => handleChange("delivery_address", e.target.value)}
                      />
                    ) : (
                      <p className="text-lg font-medium text-gray-900 whitespace-pre-line">
                        {customer.delivery_address}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-sm font-medium text-gray-500">Account Details</h2>
                  <div className="mt-2 space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Account Status</p>
                      <p className="text-lg font-medium text-gray-900">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            customer.status
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {customer.status ? "Active" : "Inactive"}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="text-lg font-medium text-gray-900">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

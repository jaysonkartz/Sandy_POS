"use client";

import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import CustomerLoginModal from "./CustomerLoginModal";
import { useRouter } from "next/navigation";
import { Customer } from "@/app/lib/definitions";
import { supabase } from "@/app/lib/supabaseClient";

interface TopBarLoginProps {
  session?: any;
  userRole?: string;
}

export default function TopBarLogin({ session, userRole: propUserRole }: TopBarLoginProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Use the session passed from parent component
    if (session?.user) {
      setUser(session.user);
      setUserRole(propUserRole || "");

      // Check for customer data
      const checkCustomer = async () => {
        // Try to find customer by email since auth_user_id column doesn't exist
        const { data: customerData, error } = await supabase
          .from("customers")
          .select("*")
          .eq("email", session.user.email)
          .single();

        if (customerData) {
          setCustomer(customerData);
          setCustomerName(customerData.name);
        } else {
          // If no customer found, use the user's email as fallback
          setCustomerName(session.user.email?.split("@")[0] || "User");
        }
      };

      checkCustomer();
    } else {
      setUser(null);
      setUserRole("");
      setCustomer(null);
      setCustomerName("");
    }
  }, [session, propUserRole]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsDropdownOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {user ? (
        <>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="mr-2">{user.email?.split("@")[0]}</span>
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M19 9l-7 7-7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                  Welcome
                  <br />
                  <span className="font-medium">{customerName || user?.email?.split("@")[0]}</span>
                </div>
                {userRole === "ADMIN" && (
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      router.push("/management/dashboard");
                      setIsDropdownOpen(false);
                    }}
                  >
                    Management Portal
                  </button>
                )}
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    router.push("/customer-details");
                    setIsDropdownOpen(false);
                  }}
                >
                  View Profile
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    router.push("/order-history");
                    setIsDropdownOpen(false);
                  }}
                >
                  Order History
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <button
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={() => setIsModalOpen(true)}
        >
          Login
        </button>
      )}

      <CustomerLoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

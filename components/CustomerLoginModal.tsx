"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { supabase } from "@/app/lib/supabaseClient";
import { useSignInLogging } from "@/app/hooks/useSignInLogging";
import { USER_ROLES } from "@/app/constants/app-constants";
import { Eye, EyeOff } from "lucide-react";

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function CustomerLoginModal({
  isOpen,
  onClose,  
  onLoginSuccess,
}: CustomerLoginModalProps) {
  const router = useRouter();
  const { logSignInSuccess, logSignInFailure } = useSignInLogging();
  const [mounted, setMounted] = useState(false);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "USER",
    address: "",
    phone: "",
    customer_code: "",
    whatsapp_notifications: true, // Default to opt-in
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [postalCodeError, setPostalCodeError] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [resolvedPostalCode, setResolvedPostalCode] = useState("");
  const [isSearchingPostalCode, setIsSearchingPostalCode] = useState(false);
  const [unitNumber, setUnitNumber] = useState("");
  const [addressSource, setAddressSource] = useState<"manual" | "postal" | "geolocation">("manual");

  useEffect(() => {
    setMounted(true);

    const existing = document.getElementById("customer-login-modal-root");
    if (existing) {
      setPortalEl(existing);
      return;
    }

    const el = document.createElement("div");
    el.id = "customer-login-modal-root";
    document.body.appendChild(el);
    setPortalEl(el);

    return () => {
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  useEffect(() => {
    if (!mounted || !isOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // Password strength calculation
  const getPasswordStrength = (
    password: string
  ): { strength: "weak" | "medium" | "strong"; score: number; feedback: string } => {
    if (!password) {
      return { strength: "weak", score: 0, feedback: "" };
    }

    let score = 0;
    const feedback: string[] = [];

    // Length checks
    if (password.length >= 8) score += 1;
    else feedback.push("At least 8 characters");

    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("lowercase letter");

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("uppercase letter");

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push("number");

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push("special character");

    let strength: "weak" | "medium" | "strong";
    if (score <= 2) {
      strength = "weak";
    } else if (score <= 4) {
      strength = "medium";
    } else {
      strength = "strong";
    }

    return {
      strength,
      score,
      feedback: feedback.length > 0 ? `Add: ${feedback.slice(0, 2).join(", ")}` : "",
    };
  };

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  // Function to get current location and convert to address
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use OpenStreetMap Nominatim API for reverse geocoding (free, no API key needed)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                "User-Agent": "SandyPOS/1.0", // Required by Nominatim
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to get address from coordinates");
          }

          const data = await response.json();
          
          if (data && data.display_name) {
            setFormData((prev) => ({
              ...prev,
              address: data.display_name,
            }));
            setAddressSource("geolocation");
            setLocationError("");
          } else {
            throw new Error("Could not determine address from location");
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setLocationError("Failed to get address. Please enter manually.");
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Failed to get your location. ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please allow location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
            break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Function to format address from OneMap.sg data
  const formatOneMapAddress = (result: any): string => {
    const parts: string[] = [];

    // Building name or block number (skip if NIL)
    if (result.BUILDING && result.BUILDING.toUpperCase() !== "NIL") {
      parts.push(result.BUILDING);
    } else if (result.BLK_NO && result.BLK_NO.toUpperCase() !== "NIL") {
      parts.push(`Blk ${result.BLK_NO}`);
    }

    // Street name (skip if NIL)
    if (result.ROAD_NAME && result.ROAD_NAME.toUpperCase() !== "NIL") {
      parts.push(result.ROAD_NAME);
    }

    // Don't include unit/floor from API - user will enter separately
    // Don't include Singapore/postal code here - we'll add it at the end

    // Filter out NIL and empty values
    const formatted = parts.filter((part) => part && part.toUpperCase() !== "NIL").join(", ");
    return (
      formatted ||
      (result.ADDRESS && result.ADDRESS.toUpperCase() !== "NIL"
        ? result.ADDRESS.replace(/NIL,?\s*/gi, "")
            .replace(/,\s*Singapore\s+\d{6}$/i, "")
            .trim()
        : "")
    );
  };

  // Function to search address by postal code
  const searchAddressByPostalCode = async (code: string) => {
    if (!code || code.trim().length < 4) {
      return; // Don't search if postal code is too short
    }

    setIsSearchingPostalCode(true);
    setPostalCodeError("");
    setResolvedPostalCode("");

    try {
      // First, try OneMap.sg API (Singapore's official mapping service - more accurate)
      const oneMapResponse = await fetch(
        `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(code)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`
      );

      if (oneMapResponse.ok) {
        const oneMapData = await oneMapResponse.json();

        if (oneMapData.results && oneMapData.results.length > 0) {
          // Find the exact postal code match
          const exactMatch = oneMapData.results.find((r: any) => r.POSTAL === code);
          const result = exactMatch || oneMapData.results[0];

          let formattedAddress = formatOneMapAddress(result);

          // Remove NIL from address if present
          formattedAddress = formattedAddress
            .replace(/NIL,?\s*/gi, "")
            .replace(/,\s*,/g, ",")
            .trim();

          // Ensure Singapore and postal code are at the end
          if (formattedAddress) {
            // Remove existing "Singapore" and postal code if present
            formattedAddress = formattedAddress.replace(/,\s*Singapore\s+\d{6}$/i, '').replace(/Singapore\s+\d{6}$/i, '').trim();
            
            // Add Singapore and postal code at the end
            if (code && code.length === 6) {
              formattedAddress = `${formattedAddress}, Singapore ${code}`;
            }

            setFormData((prev) => ({
              ...prev,
              address: formattedAddress,
            }));
            setAddressSource("postal");
            setLocationError("");
            setResolvedPostalCode(code);
            setIsSearchingPostalCode(false);
            return;
          }
        }
      }

      // Fallback to Nominatim if OneMap doesn't work
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&postalcode=${encodeURIComponent(code)}&countrycodes=SG&addressdetails=1&limit=1`,
        {
          headers: {
            "User-Agent": "SandyPOS/1.0", // Required by Nominatim
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to search address");
      }

      const data = await response.json();

      if (data && data.length > 0 && data[0].display_name) {
        // Format Nominatim address better
        const addr = data[0].address || {};
        let formattedAddr = "";

        if (addr.house_number && addr.house_number.toUpperCase() !== "NIL")
          formattedAddr += `${addr.house_number} `;
        if (addr.road && addr.road.toUpperCase() !== "NIL") formattedAddr += `${addr.road}, `;
        if (addr.suburb || addr.neighbourhood) {
          const suburb = addr.suburb || addr.neighbourhood;
          if (suburb.toUpperCase() !== "NIL") formattedAddr += `${suburb}, `;
        }
        if (addr.city || addr.state) {
          const city = addr.city || addr.state;
          if (city.toUpperCase() !== "NIL") formattedAddr += `${city} `;
        }
        if (addr.postcode) formattedAddr += `${addr.postcode}`;
        
        formattedAddr = formattedAddr.trim().replace(/,$/, '').replace(/NIL,?\s*/gi, '').replace(/,\s*,/g, ',').trim() || data[0].display_name.replace(/NIL,?\s*/gi, '');
        
        // Ensure Singapore and postal code are at the end
        if (formattedAddr) {
          // Remove existing "Singapore" and postal code if present
          formattedAddr = formattedAddr.replace(/,\s*Singapore\s+\d{6}$/i, '').replace(/Singapore\s+\d{6}$/i, '').trim();
          
          // Add Singapore and postal code at the end
          if (code && code.length === 6) {
            formattedAddr = `${formattedAddr}, Singapore ${code}`;
          }
        }

        setFormData((prev) => ({
          ...prev,
          address: formattedAddr,
        }));
        setAddressSource("postal");
        setLocationError("");
        setResolvedPostalCode(code);
      } else {
        setPostalCodeError(`No address found for postal code ${code}`);
      }
    } catch (error) {
      console.error("Postal code search error:", error);
      setPostalCodeError("Failed to find address for this postal code. Please enter manually.");
    } finally {
      setIsSearchingPostalCode(false);
    }
  };

  // Handle postal code input with debounce
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow numbers
    setError("");
    setPostalCode(value);

    if (value !== resolvedPostalCode) {
      setResolvedPostalCode("");
      setPostalCodeError("");

      if (addressSource === "postal") {
        setFormData((prev) => ({
          ...prev,
          address: "",
        }));
        setAddressSource("manual");
      }
    }

    // Auto-search when postal code is 6 digits (Singapore postal code format)
    if (value.length === 6) {
      searchAddressByPostalCode(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        // Log failed sign-in attempt
        await logSignInFailure("", formData.email, signInError.message);
        throw signInError;
      }

      if (data?.user) {
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("status")
          .eq("user_id", data.user.id)
          .single();

        if (customerError || !customerData) {
          await supabase.auth.signOut();
          setError("Customer account not found. Please contact support.");
          return;
        }

        if (!customerData.status) {
          // Keep the session so the user can check approval status.
          router.push("/pending-approval");
          onClose();
          return;
        }

        // Log successful sign-in
        await logSignInSuccess(
          data.user.id,
          data.user.email || formData.email,
          data.session?.access_token
        );

        // Notify parent component of successful login
        onLoginSuccess?.();
        router.refresh();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate all mandatory fields
    if (!formData.name || !formData.name.trim()) {
      setError("Full name is required");
      setIsLoading(false);
      return;
    }

    if (!formData.phone || !formData.phone.trim()) {
      setError("Mobile number is required");
      setIsLoading(false);
      return;
    }

    if (!formData.address || !formData.address.trim()) {
      setError("Address is required");
      setIsLoading(false);
      return;
    }

    if (!formData.email || !formData.email.trim()) {
      setError("Email address is required");
      setIsLoading(false);
      return;
    }

    if (!formData.password || !formData.password.trim()) {
      setError("Password is required");
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    // Validate postal code if provided
    if (postalCode && postalCode.length > 0 && postalCode.length !== 6) {
      setError("Postal code must be exactly 6 digits");
      setIsLoading(false);
      return;
    }

    if (isSearchingPostalCode) {
      setError("Wait for postal code validation to finish");
      setIsLoading(false);
      return;
    }

    if (postalCode && resolvedPostalCode !== postalCode) {
      setError(postalCodeError || "Enter a valid postal code to continue");
      setIsLoading(false);
      return;
    }

    try {
      if (!formData.name.trim()) throw new Error("Full name is required");
      if (!formData.phone.trim()) throw new Error("Mobile number is required");
      if (!formData.address.trim()) throw new Error("Address is required");
      if (!formData.email.trim()) throw new Error("Email address is required");
      if (!formData.password.trim()) throw new Error("Password is required");
      if (formData.password.length < 8) throw new Error("Password must be at least 8 characters long");
      if (postalCode && postalCode.length !== 6) throw new Error("Postal code must be exactly 6 digits");

      const { data: existingCustomer, error: customerCheckError } = await supabase
        .from("customers")
        .select("email")
        .eq("email", formData.email)
        .maybeSingle();

      // If there's an error and it's not a "no rows" error, throw it
      if (customerCheckError && customerCheckError.code !== "PGRST116") {
        throw customerCheckError;
      }

      if (existingCustomer) {
        throw new Error("An account with this email already exists");
      }

      // 2. Sign up the user in auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        // Handle specific Supabase auth errors
        if (signUpError.message.includes("already registered")) {
          throw new Error("An account with this email already exists");
        }
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      // 3. Create user record in users table
      const userData = {
        id: authData.user.id,
        email: formData.email,
        role: USER_ROLES.USER,
        created_at: new Date().toISOString(),
      };

      const { error: userError } = await supabase.from("users").insert([userData]);

      if (userError) throw userError;

      // 4. Create customer record
      // Combine address with unit number if provided
      let finalAddress = formData.address;
      if (unitNumber && unitNumber.trim()) {
        // Add unit number to address if not already included
        if (finalAddress && !finalAddress.includes(unitNumber.trim())) {
          // Insert unit number before "Singapore" or at the end if no Singapore
          if (finalAddress.includes("Singapore")) {
            finalAddress = finalAddress.replace("Singapore", `#${unitNumber.trim()}, Singapore`);
          } else {
            // If no Singapore/postal code, add unit number and then Singapore + postal code
            if (postalCode && postalCode.length === 6) {
              finalAddress = `${finalAddress}, #${unitNumber.trim()}, Singapore ${postalCode}`;
            } else {
              finalAddress = `${finalAddress}, #${unitNumber.trim()}`;
            }
          }
        }
      } else {
        // If no unit number but we have postal code, ensure Singapore and postal code are at the end
        if (postalCode && postalCode.length === 6 && !finalAddress.includes("Singapore")) {
          finalAddress = `${finalAddress}, Singapore ${postalCode}`;
        }
      }

      const customerData = {
        name: formData.name,
        email: formData.email,
        user_id: authData.user.id,
        status: false,
        created_at: new Date().toISOString(),
        address: finalAddress,
        phone: formData.phone,
        customer_code: formData.customer_code || null,
        whatsapp_notifications: formData.whatsapp_notifications,
      };

      const { error: customerError } = await supabase.from("customers").insert([customerData]);

      if (customerError) throw customerError;

      // Success handling
      alert(
        "Account created successfully! Please check your email to verify your account. Your login will be enabled after admin approval."
      );
      onClose();
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !mounted || !portalEl) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
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

          <div className="p-8">
            <h1 className="text-2xl font-bold text-center mb-8">
              {isRegistering ? "Register Account" : "Customer Login"}
            </h1>

            <form className="space-y-6" onSubmit={isRegistering ? handleSignUp : handleSubmit}>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
                  {error}
                </div>
              )}

              {isRegistering && (
                <>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="phone">
                    Mobile Number
                  </label>
                  <input
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="phone"
                    placeholder="Enter your mobile number"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="postal_code">
                    Postal Code 
                  </label>
                  <input
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="postal_code"
                    placeholder="Enter postal code (e.g., 654321)"
                    type="text"
                    maxLength={6}
                    value={postalCode}
                    onChange={handlePostalCodeChange}
                  />
                  {isSearchingPostalCode && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching address...
                    </p>
                  )}
                  {postalCode && postalCode.length > 0 && postalCode.length !== 6 && (
                    <p className="text-xs text-red-600 mt-1">Postal code must be exactly 6 digits</p>
                  )}
                  {postalCodeError && (
                    <p className="text-xs text-red-600 mt-1">{postalCodeError}</p>
                  )}
                  {postalCode && postalCode.length === 6 && !isSearchingPostalCode && !postalCodeError && (
                    <p className="text-xs text-gray-500 mt-1">
                      {resolvedPostalCode === postalCode
                        ? "Address auto-filled from postal code"
                        : "Address will be auto-filled when you enter 6 digits"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="unit_number">
                    Unit Number (Optional)
                  </label>
                  <input
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="unit_number"
                    placeholder="Enter unit number (e.g., 01-123)"
                    type="text"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700" htmlFor="address">
                      Address
                    </label>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                      className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400"
                    >
                      {isGettingLocation ? "Getting..." : "Use My Location"}
                    </button>
                  </div>

                  <textarea
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="address"
                    placeholder="Enter your address"
                    rows={3}
                    value={(() => {
                      // Combine address with unit number for display
                      let displayAddress = formData.address;
                      if (unitNumber && unitNumber.trim() && displayAddress) {
                        // Check if unit number is already in address
                        if (!displayAddress.includes(unitNumber.trim())) {
                          if (displayAddress.includes("Singapore")) {
                            displayAddress = displayAddress.replace(
                              "Singapore",
                              `#${unitNumber.trim()}, Singapore`
                            );
                          } else {
                            displayAddress = `${displayAddress}, #${unitNumber.trim()}`;
                          }
                        }
                      }
                      return displayAddress;
                    })()}
                    onChange={(e) => {
                      // Extract base address (remove unit number if user edits)
                      let baseAddress = e.target.value;
                      if (unitNumber && unitNumber.trim()) {
                        baseAddress = baseAddress
                          .replace(`#${unitNumber.trim()}, `, "")
                          .replace(`, #${unitNumber.trim()}`, "")
                          .trim();
                      }
                      setLocationError("");
                      setAddressSource("manual");
                      setFormData((prev) => ({ ...prev, address: baseAddress }));
                    }}
                  />
                  {locationError && <p className="text-xs text-red-600 mt-1">{locationError}</p>}
                </div>


                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="whatsapp_notifications"
                      checked={formData.whatsapp_notifications}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, whatsapp_notifications: e.target.checked }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="whatsapp_notifications" className="ml-2 block text-sm text-gray-700">
                      I want to receive WhatsApp notifications
                    </label>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                  Email Address
                </label>
                <input
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="email"
                  placeholder="Enter your email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    required
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="password"
                    minLength={isRegistering ? 8 : undefined}
                    placeholder={
                      isRegistering
                        ? "Enter your password (minimum 8 characters)"
                        : "Enter your password"
                    }
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {isRegistering && formData.password && (
                  <div className="mt-2">
                    {/* Strength Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.strength === "weak"
                            ? "bg-red-500"
                            : passwordStrength.strength === "medium"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{
                          width: `${(passwordStrength.score / 6) * 100}%`,
                        }}
                      />
                    </div>
                    {/* Strength Text */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium ${
                          passwordStrength.strength === "weak"
                            ? "text-red-600"
                            : passwordStrength.strength === "medium"
                              ? "text-yellow-600"
                              : "text-green-600"
                        }`}
                      >
                        Password Strength:{" "}
                        {passwordStrength.strength.charAt(0).toUpperCase() +
                          passwordStrength.strength.slice(1)}
                      </span>
                    </div>
                    {/* Feedback */}
                    {passwordStrength.feedback && (
                      <p className="text-xs text-gray-500 mt-1">{passwordStrength.feedback}</p>
                    )}
                  </div>
                )}
              </div>

              {!isRegistering && (
                <div className="text-right">
                  <button
                    className="text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push("/forgot-password");
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {isRegistering && (
                <div className="flex items-center">
                  <input
                    checked={formData.whatsapp_notifications}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    id="whatsapp_notifications"
                    type="checkbox"
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, whatsapp_notifications: e.target.checked }))
                    }
                  />
                  <label
                    className="ml-2 block text-sm text-gray-700"
                    htmlFor="whatsapp_notifications"
                  >
                    I want to receive WhatsApp notifications about my orders and updates
                  </label>
                </div>
              )}

              <button
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? "Processing..." : isRegistering ? "Sign Up" : "Sign In"}
              </button>

              <div className="text-center text-sm text-gray-600">
                <button
                  className="text-blue-600 hover:underline"
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                >
                  {isRegistering
                    ? "Already have an account? Sign in"
                    : "New customer? Register here"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    portalEl
  );
}

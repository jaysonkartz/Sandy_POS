"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { USER_ROLES } from "@/app/constants/app-constants";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    address: "",
    phone: "",
    customer_code: "",
    whatsapp_notifications: true, // Default to opt-in
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isSearchingPostalCode, setIsSearchingPostalCode] = useState(false);
  const [unitNumber, setUnitNumber] = useState("");

  // Password strength calculation
  const getPasswordStrength = (password: string): { strength: "weak" | "medium" | "strong"; score: number; feedback: string } => {
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

    return { strength, score, feedback: feedback.length > 0 ? `Add: ${feedback.slice(0, 2).join(", ")}` : "" };
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
                'User-Agent': 'SandyPOS/1.0' // Required by Nominatim
              }
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
            setLocationError("");
          } else {
            throw new Error("Could not determine address from location");
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setLocationError("Failed to get address. Please enter manually.");
          // Still set coordinates as fallback
          setFormData((prev) => ({
            ...prev,
            address: `${latitude}, ${longitude}`,
          }));
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
    if (result.BUILDING && result.BUILDING.toUpperCase() !== 'NIL') {
      parts.push(result.BUILDING);
    } else if (result.BLK_NO && result.BLK_NO.toUpperCase() !== 'NIL') {
      parts.push(`Blk ${result.BLK_NO}`);
    }
    
    // Street name (skip if NIL)
    if (result.ROAD_NAME && result.ROAD_NAME.toUpperCase() !== 'NIL') {
      parts.push(result.ROAD_NAME);
    }
    
    // Don't include unit/floor from API - user will enter separately
    // Don't include Singapore/postal code here - we'll add it at the end
    
    // Filter out NIL and empty values
    const formatted = parts.filter(part => part && part.toUpperCase() !== 'NIL').join(', ');
    return formatted || (result.ADDRESS && result.ADDRESS.toUpperCase() !== 'NIL' ? result.ADDRESS.replace(/NIL,?\s*/gi, '').replace(/,\s*Singapore\s+\d{6}$/i, '').trim() : '');
  };

  // Function to search address by postal code
  const searchAddressByPostalCode = async (code: string) => {
    if (!code || code.trim().length < 4) {
      return; // Don't search if postal code is too short
    }

    setIsSearchingPostalCode(true);
    setLocationError("");

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
          formattedAddress = formattedAddress.replace(/NIL,?\s*/gi, '').replace(/,\s*,/g, ',').trim();
          
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
            setLocationError("");
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
            'User-Agent': 'SandyPOS/1.0' // Required by Nominatim
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to search address");
      }

      const data = await response.json();
      
      if (data && data.length > 0 && data[0].display_name) {
        // Format Nominatim address better
        const addr = data[0].address || {};
        let formattedAddr = '';
        
        if (addr.house_number && addr.house_number.toUpperCase() !== 'NIL') formattedAddr += `${addr.house_number} `;
        if (addr.road && addr.road.toUpperCase() !== 'NIL') formattedAddr += `${addr.road}, `;
        if (addr.suburb || addr.neighbourhood) {
          const suburb = (addr.suburb || addr.neighbourhood);
          if (suburb.toUpperCase() !== 'NIL') formattedAddr += `${suburb}, `;
        }
        if (addr.city || addr.state) {
          const city = (addr.city || addr.state);
          if (city.toUpperCase() !== 'NIL') formattedAddr += `${city} `;
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
        setLocationError("");
      } else {
        setLocationError(`No address found for postal code ${code}`);
      }
    } catch (error) {
      console.error("Postal code search error:", error);
      setLocationError("Failed to find address for this postal code. Please enter manually.");
    } finally {
      setIsSearchingPostalCode(false);
    }
  };

  // Handle postal code input with debounce
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow numbers
    setPostalCode(value);
    
    // Auto-search when postal code is 6 digits (Singapore postal code format)
    if (value.length === 6) {
      searchAddressByPostalCode(value);
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

    try {
      // 1. Check if customer already exists
      const { data: existingCustomer, error: customerCheckError } = await supabase
        .from("customers")
        .select("email")
        .eq("email", formData.email)
        .maybeSingle();

      // If there's an error and it's not a "no rows" error, throw it
      if (customerCheckError && customerCheckError.code !== 'PGRST116') {
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
          if (finalAddress.includes('Singapore')) {
            finalAddress = finalAddress.replace('Singapore', `#${unitNumber.trim()}, Singapore`);
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
        if (postalCode && postalCode.length === 6 && !finalAddress.includes('Singapore')) {
          finalAddress = `${finalAddress}, Singapore ${postalCode}`;
        }
      }

      const customerData = {
        name: formData.name,
        email: formData.email,
        user_id: authData.user.id,
        status: true,
        created_at: new Date().toISOString(),
        address: finalAddress,
        phone: formData.phone,
        customer_code: formData.customer_code || null,
        whatsapp_notifications: formData.whatsapp_notifications,
      };

      const { error: customerError } = await supabase.from("customers").insert([customerData]);

      if (customerError) throw customerError;

      // Success handling
      alert("Account created successfully! Please check your email to verify your account.");
      router.push("/login");
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
        {/* Back Button */}
        <button
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors"
          onClick={() => router.push("/")}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M15 19l-7-7 7-7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </button>

        <div className="p-8">
          <h1 className="text-2xl font-bold text-center mb-8">Register Account</h1>

          <form className="space-y-6" onSubmit={handleSignUp}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">
                Full Name
              </label>
              <input
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="name"
                placeholder="Enter your full name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

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
                Postal Code (Optional - Auto-fill address)
              </label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="postal_code"
                placeholder="Enter postal code (e.g., 640965)"
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
              {postalCode && postalCode.length === 6 && !isSearchingPostalCode && (
                <p className="text-xs text-gray-500 mt-1">Address will be auto-filled when you enter 6 digits</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="unit_number">
                Unit Number (Optional)
              </label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="unit_number"
                placeholder="Enter unit number (e.g., 04-211)"
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
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                  title="Get your current location"
                >
                  {isGettingLocation ? (
                    <>
                      <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Getting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Use My Location</span>
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-2">
                <textarea
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="address"
                  placeholder="Enter your address or click 'Use My Location' button above"
                  rows={3}
                  value={(() => {
                    // Combine address with unit number for display
                    let displayAddress = formData.address;
                    if (unitNumber && unitNumber.trim() && displayAddress) {
                      // Check if unit number is already in address
                      if (!displayAddress.includes(unitNumber.trim())) {
                        if (displayAddress.includes('Singapore')) {
                          displayAddress = displayAddress.replace('Singapore', `#${unitNumber.trim()}, Singapore`);
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
                      baseAddress = baseAddress.replace(`#${unitNumber.trim()}, `, '').replace(`, #${unitNumber.trim()}`, '').trim();
                    }
                    setFormData((prev) => ({ ...prev, address: baseAddress }));
                  }}
                />
                {locationError && (
                  <p className="text-xs text-red-600">{locationError}</p>
                )}
              </div>
            </div>

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
              <input
                required
                minLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="password"
                placeholder="Enter your password (minimum 8 characters)"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              />
              {formData.password && (
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
                      Password Strength: {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                    </span>
                  </div>
                  {/* Feedback */}
                  {passwordStrength.feedback && (
                    <p className="text-xs text-gray-500 mt-1">{passwordStrength.feedback}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="whatsapp_notifications"
                checked={formData.whatsapp_notifications}
                onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp_notifications: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="whatsapp_notifications" className="ml-2 block text-sm text-gray-700">
                I want to receive WhatsApp notifications about my orders and updates
              </label>
            </div>

            <button
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Processing..." : "Sign Up"}
            </button>

            <div className="text-center text-sm text-gray-600">
              <button
                className="text-blue-600 hover:underline"
                type="button"
                onClick={() => router.push("/login")}
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

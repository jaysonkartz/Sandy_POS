"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { supabase } from "@/app/lib/supabaseClient";
import { useSignInLogging } from "@/app/hooks/useSignInLogging";
import { USER_ROLES } from "@/app/constants/app-constants";
import { Eye, EyeOff } from "lucide-react";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function SignupModal({ isOpen, onClose, onLoginSuccess }: SignupModalProps) {
  const router = useRouter();
  const { logSignInSuccess, logSignInFailure } = useSignInLogging();

  const [mounted, setMounted] = useState(false);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);

    const existing = document.getElementById("signup-modal-root");
    if (existing) {
      setPortalEl(existing);
      return;
    }

    const el = document.createElement("div");
    el.id = "signup-modal-root";
    document.body.appendChild(el);
    setPortalEl(el);

    return () => {
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isOpen) return;

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

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    company_name: "",
    address: "",
    phone: "",
    customer_code: "",
    whatsapp_notifications: true,
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

  const getPasswordStrength = (
    password: string
  ): { strength: "weak" | "medium" | "strong"; score: number; feedback: string } => {
    if (!password) return { strength: "weak", score: 0, feedback: "" };

    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) score += 1;
    else feedback.push("At least 8 characters");

    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("lowercase letter");

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("uppercase letter");

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push("number");

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push("special character");

    let strength: "weak" | "medium" | "strong";
    if (score <= 2) strength = "weak";
    else if (score <= 4) strength = "medium";
    else strength = "strong";

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
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "User-Agent": "SandyPOS/1.0" } }
          );

          if (!response.ok) throw new Error("Failed to get address from coordinates");
          const data = await response.json();

          if (data?.display_name) {
            setFormData((prev) => ({ ...prev, address: data.display_name }));
            setAddressSource("geolocation");
            setLocationError("");
          } else {
            throw new Error("Could not determine address from location");
          }
        } catch {
          setLocationError("Failed to get address. Please enter manually.");
        } finally {
          setIsGettingLocation(false);
        }
      },
      (err) => {
        let msg = "Failed to get your location. ";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg += "Please allow location access in your browser settings.";
            break;
          case err.POSITION_UNAVAILABLE:
            msg += "Location information is unavailable.";
            break;
          case err.TIMEOUT:
            msg += "Location request timed out.";
            break;
          default:
            msg += "An unknown error occurred.";
            break;
        }
        setLocationError(msg);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const formatOneMapAddress = (result: any): string => {
    const parts: string[] = [];
    if (result.BUILDING && result.BUILDING.toUpperCase() !== "NIL") parts.push(result.BUILDING);
    else if (result.BLK_NO && result.BLK_NO.toUpperCase() !== "NIL")
      parts.push(`Blk ${result.BLK_NO}`);
    if (result.ROAD_NAME && result.ROAD_NAME.toUpperCase() !== "NIL") parts.push(result.ROAD_NAME);

    const formatted = parts.filter(Boolean).join(", ");
    return (
      formatted ||
      (result.ADDRESS && result.ADDRESS.toUpperCase() !== "NIL"
        ? result.ADDRESS.replace(/NIL,?\s*/gi, "")
            .replace(/,\s*Singapore\s+\d{6}$/i, "")
            .trim()
        : "")
    );
  };

  const searchAddressByPostalCode = async (code: string) => {
    if (!code || code.trim().length < 4) return;

    setIsSearchingPostalCode(true);
    setPostalCodeError("");
    setResolvedPostalCode("");

    try {
      const oneMapResponse = await fetch(
        `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
          code
        )}&returnGeom=Y&getAddrDetails=Y&pageNum=1`
      );

      if (oneMapResponse.ok) {
        const oneMapData = await oneMapResponse.json();
        if (oneMapData?.results?.length > 0) {
          const exact = oneMapData.results.find((r: any) => r.POSTAL === code);
          const result = exact || oneMapData.results[0];

          let formattedAddress = formatOneMapAddress(result)
            .replace(/NIL,?\s*/gi, "")
            .replace(/,\s*,/g, ",")
            .trim();

          if (formattedAddress) {
            formattedAddress = formattedAddress
              .replace(/,\s*Singapore\s+\d{6}$/i, "")
              .replace(/Singapore\s+\d{6}$/i, "")
              .trim();

            if (code.length === 6) formattedAddress = `${formattedAddress}, Singapore ${code}`;

            setFormData((prev) => ({ ...prev, address: formattedAddress }));
            setAddressSource("postal");
            setLocationError("");
            setResolvedPostalCode(code);
            setIsSearchingPostalCode(false);
            return;
          }
        }
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&postalcode=${encodeURIComponent(
          code
        )}&countrycodes=SG&addressdetails=1&limit=1`,
        { headers: { "User-Agent": "SandyPOS/1.0" } }
      );

      if (!response.ok) throw new Error("Failed to search address");
      const data = await response.json();

      if (data?.length > 0 && data[0]?.display_name) {
        let formattedAddr = String(data[0].display_name).replace(/NIL,?\s*/gi, "");
        formattedAddr = formattedAddr
          .replace(/,\s*Singapore\s+\d{6}$/i, "")
          .replace(/Singapore\s+\d{6}$/i, "")
          .trim();

        if (code.length === 6) formattedAddr = `${formattedAddr}, Singapore ${code}`;

        setFormData((prev) => ({ ...prev, address: formattedAddr }));
        setAddressSource("postal");
        setLocationError("");
        setResolvedPostalCode(code);
      } else {
        setPostalCodeError(`No address found for postal code ${code}`);
      }
    } catch {
      setPostalCodeError("Failed to find address for this postal code. Please enter manually.");
    } finally {
      setIsSearchingPostalCode(false);
    }
  };

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setError("");
    setPostalCode(value);

    if (value !== resolvedPostalCode) {
      setResolvedPostalCode("");
      setPostalCodeError("");

      if (addressSource === "postal") {
        setFormData((prev) => ({ ...prev, address: "" }));
        setAddressSource("manual");
      }
    }

    if (value.length === 6) searchAddressByPostalCode(value);
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
          router.push("/pending-approval");
          onClose();
          return;
        }

        await logSignInSuccess(
          data.user.id,
          data.user.email || formData.email,
          data.session?.access_token
        );

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

    if (!formData.name?.trim()) return (setError("Full name is required"), setIsLoading(false));
    if (!formData.phone?.trim())
      return (setError("Mobile number is required"), setIsLoading(false));
    if (!formData.address?.trim()) return (setError("Address is required"), setIsLoading(false));
    if (!formData.email?.trim())
      return (setError("Email address is required"), setIsLoading(false));
    if (!formData.password?.trim()) return (setError("Password is required"), setIsLoading(false));
    if (formData.password.length < 8)
      return (setError("Password must be at least 8 characters long"), setIsLoading(false));
    if (postalCode && postalCode.length !== 6)
      return (setError("Postal code must be exactly 6 digits"), setIsLoading(false));
    if (isSearchingPostalCode)
      return (setError("Wait for postal code validation to finish"), setIsLoading(false));
    if (postalCode && resolvedPostalCode !== postalCode)
      return (
        setError(postalCodeError || "Enter a valid postal code to continue"),
        setIsLoading(false)
      );

    try {
      const { data: existingCustomer, error: customerCheckError } = await supabase
        .from("customers")
        .select("email")
        .eq("email", formData.email)
        .maybeSingle();

      if (customerCheckError && customerCheckError.code !== "PGRST116") throw customerCheckError;
      if (existingCustomer) throw new Error("An account with this email already exists");

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          throw new Error("An account with this email already exists");
        }
        throw signUpError;
      }
      if (!authData.user) throw new Error("Failed to create user account");

      const { error: userError } = await supabase.from("users").insert([
        {
          id: authData.user.id,
          email: formData.email,
          role: USER_ROLES.USER,
          created_at: new Date().toISOString(),
        },
      ]);
      if (userError) throw userError;

      let finalAddress = formData.address;
      if (unitNumber?.trim()) {
        if (finalAddress && !finalAddress.includes(unitNumber.trim())) {
          if (finalAddress.includes("Singapore")) {
            finalAddress = finalAddress.replace("Singapore", `#${unitNumber.trim()}, Singapore`);
          } else if (postalCode?.length === 6) {
            finalAddress = `${finalAddress}, #${unitNumber.trim()}, Singapore ${postalCode}`;
          } else {
            finalAddress = `${finalAddress}, #${unitNumber.trim()}`;
          }
        }
      } else if (postalCode?.length === 6 && !finalAddress.includes("Singapore")) {
        finalAddress = `${finalAddress}, Singapore ${postalCode}`;
      }

      const { error: customerError } = await supabase.from("customers").insert([
        {
          name: formData.name,
          email: formData.email,
          user_id: authData.user.id,
          status: false,
          created_at: new Date().toISOString(),
          address: finalAddress,
          phone: formData.phone,
          customer_code: formData.customer_code || null,
          whatsapp_notifications: formData.whatsapp_notifications,
          company_name: formData.company_name || null,
        },
      ]);
      if (customerError) throw customerError;

      alert(
        "Account created successfully! Please check your email to verify your account. Your login will be enabled after admin approval."
      );

      setFormData({
        email: "",
        password: "",
        name: "",
        company_name: "",
        address: "",
        phone: "",
        customer_code: "",
        whatsapp_notifications: true,
      });
      setPostalCode("");
      setUnitNumber("");
      setIsRegistering(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !mounted || !portalEl) return null;

  const modalUI = (
    <div aria-modal="true" className="fixed inset-0 z-[9999]" role="dialog">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="
          absolute left-1/2 top-1/2
          w-[calc(100%-2rem)] max-w-md
          -translate-x-1/2 -translate-y-1/2
          rounded-2xl bg-white shadow-2xl
        "
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h1 className="text-lg font-bold">
            {isRegistering ? "Register Account" : "Customer Login"}
          </h1>

          <button
            aria-label="Close"
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            type="button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-5 py-5">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={isRegistering ? handleSignUp : handleSubmit}>
            {isRegistering && (
              <>
                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-gray-700"
                    htmlFor="company_name"
                  >
                    Company Name
                  </label>
                  <input
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="company_name"
                    placeholder="Enter your company name"
                    type="text"
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, company_name: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    required
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="name"
                    placeholder="Enter your full name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="phone">
                    Mobile Number
                  </label>
                  <input
                    required
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="phone"
                    placeholder="Enter your mobile number"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-gray-700"
                    htmlFor="postal_code"
                  >
                    Postal Code
                  </label>
                  <input
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="postal_code"
                    maxLength={6}
                    placeholder="Enter postal code (e.g., 640965)"
                    type="text"
                    value={postalCode}
                    onChange={handlePostalCodeChange}
                  />
                  {isSearchingPostalCode && (
                    <p className="mt-1 text-xs text-blue-600">Searching address...</p>
                  )}
                  {postalCode && postalCode.length > 0 && postalCode.length !== 6 && (
                    <p className="mt-1 text-xs text-red-600">
                      Postal code must be exactly 6 digits
                    </p>
                  )}
                  {postalCodeError && (
                    <p className="mt-1 text-xs text-red-600">{postalCodeError}</p>
                  )}
                  {postalCode &&
                    postalCode.length === 6 &&
                    !isSearchingPostalCode &&
                    !postalCodeError && (
                      <p className="mt-1 text-xs text-gray-500">
                        {resolvedPostalCode === postalCode
                          ? "Address auto-filled from postal code"
                          : "Address will be auto-filled when you enter 6 digits"}
                      </p>
                    )}
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-gray-700"
                    htmlFor="unit_number"
                  >
                    Unit Number (Optional)
                  </label>
                  <input
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="unit_number"
                    placeholder="Enter unit number (e.g., 04-211)"
                    type="text"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700" htmlFor="address">
                      Address
                    </label>
                    <button
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
                      disabled={isGettingLocation}
                      type="button"
                      onClick={getCurrentLocation}
                    >
                      {isGettingLocation ? "Getting..." : "Use My Location"}
                    </button>
                  </div>

                  <textarea
                    required
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="address"
                    placeholder="Enter your address"
                    rows={3}
                    value={(() => {
                      let displayAddress = formData.address;
                      if (
                        unitNumber?.trim() &&
                        displayAddress &&
                        !displayAddress.includes(unitNumber.trim())
                      ) {
                        if (displayAddress.includes("Singapore")) {
                          displayAddress = displayAddress.replace(
                            "Singapore",
                            `#${unitNumber.trim()}, Singapore`
                          );
                        } else {
                          displayAddress = `${displayAddress}, #${unitNumber.trim()}`;
                        }
                      }
                      return displayAddress;
                    })()}
                    onChange={(e) => {
                      let base = e.target.value;
                      if (unitNumber?.trim()) {
                        base = base
                          .replace(`#${unitNumber.trim()}, `, "")
                          .replace(`, #${unitNumber.trim()}`, "")
                          .trim();
                      }
                      setLocationError("");
                      setAddressSource("manual");
                      setFormData((prev) => ({ ...prev, address: base }));
                    }}
                  />
                  {locationError && <p className="mt-1 text-xs text-red-600">{locationError}</p>}
                </div>
              </>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="email">
                Email Address
              </label>
              <input
                required
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="email"
                placeholder="Enter your email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-2 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="password"
                  minLength={8}
                  placeholder="Enter your password (min 8 chars)"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-2 text-gray-600 hover:text-gray-900"
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {formData.password && (
                <div className="mt-2">
                  <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        passwordStrength.strength === "weak"
                          ? "bg-red-500"
                          : passwordStrength.strength === "medium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                      style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-600">
                    Password Strength:{" "}
                    <span className="font-semibold">
                      {passwordStrength.strength.charAt(0).toUpperCase() +
                        passwordStrength.strength.slice(1)}
                    </span>
                  </div>
                  {passwordStrength.feedback && (
                    <p className="mt-1 text-xs text-gray-500">{passwordStrength.feedback}</p>
                  )}
                </div>
              )}
            </div>

            {isRegistering && (
              <div className="flex items-start gap-2">
                <input
                  checked={formData.whatsapp_notifications}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  id="whatsapp_notifications"
                  type="checkbox"
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, whatsapp_notifications: e.target.checked }))
                  }
                />
                <label className="text-sm text-gray-700" htmlFor="whatsapp_notifications">
                  I want to receive WhatsApp notifications about my orders and updates
                </label>
              </div>
            )}

            <button
              className="w-full rounded-md bg-blue-600 py-2.5 text-white hover:bg-blue-700 disabled:bg-blue-400"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Processing..." : isRegistering ? "Sign Up" : "Sign In"}
            </button>

            <div className="text-center text-sm text-gray-600">
              <button
                className="text-blue-600 hover:underline"
                type="button"
                onClick={() => setIsRegistering((v) => !v)}
              >
                {isRegistering ? "Already have an account? Sign in" : "New customer? Register here"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalUI, portalEl);
}

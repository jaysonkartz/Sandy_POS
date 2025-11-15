import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/app/lib/supabaseClient";

interface Country {
  id: string;
  name: string;
  chineseName: string;
}

interface UseCountriesReturn {
  countryMap: { [key: string]: { name: string; chineseName: string } };
  loading: boolean;
  error: string | null;
}

export const useCountries = (): UseCountriesReturn => {
  const [countryMap, setCountryMap] = useState<{ [key: string]: { name: string; chineseName: string } }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCountries = useCallback(async () => {
    try {
      setError(null);
      
      // Check if Supabase is properly configured before making requests
      if (!isSupabaseConfigured()) {
        const configError = "Supabase is not configured. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local and restart your dev server.";
        console.error("❌", configError);
        console.error("💡 If you just added these variables, please restart your Next.js development server.");
        setError(configError);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase.from("countries").select("*");

      if (error) throw error;

      const countryMapping: { [key: string]: { name: string; chineseName: string } } = {};
      data?.forEach((country: any) => {
        countryMapping[country.id] = {
          name: country.country,
          chineseName: country.chineseName,
        };
      });

      setCountryMap(countryMapping);
    } catch (error: any) {
      // Helper to safely extract error message
      const getErrorMessage = (err: any): string => {
        if (err instanceof Error) {
          return err.message;
        }
        if (typeof err === "string") {
          return err;
        }
        if (err?.message) {
          return String(err.message);
        }
        if (err?.toString) {
          return err.toString();
        }
        return "Unknown error";
      };

      const errorMessage = getErrorMessage(error);
      
      // Check for API key errors and provide helpful guidance
      if (errorMessage.includes("No API key found") || errorMessage.includes("API key")) {
        const apiKeyError = "Missing Supabase API key. Please ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is set in your environment variables.";
        console.error("❌", apiKeyError);
        console.error("Error details:", errorMessage);
        setError(apiKeyError);
        return;
      }
      
      console.error("Error fetching countries:", errorMessage);
      
      // Log additional details if available
      if (error && typeof error === "object") {
        const errorDetails: any = {};
        if (error?.code) errorDetails.code = error.code;
        if (error?.details) errorDetails.details = error.details;
        if (error?.hint) errorDetails.hint = error.hint;
        if (Object.keys(errorDetails).length > 0) {
          console.error("Error details:", errorDetails);
        }
      }
      
      setError(errorMessage || "Failed to load countries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  return {
    countryMap,
    loading,
    error,
  };
};

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
        setError(configError);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase.from("countries").select("*");

      if (error) throw error;

      interface CountryData {
        id: number | string;
        country: string;
        chineseName?: string;
      }

      const countryMapping: { [key: string]: { name: string; chineseName: string } } = {};
      (data as CountryData[])?.forEach((country) => {
        countryMapping[String(country.id)] = {
          name: country.country,
          chineseName: country.chineseName || "",
        };
      });

      setCountryMap(countryMapping);
    } catch (error: unknown) {
      // Helper to safely extract error message
      const getErrorMessage = (err: unknown): string => {
        if (err instanceof Error) {
          return err.message;
        }
        if (typeof err === "string") {
          return err;
        }
        if (err instanceof Error && err.message) {
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
        setError(apiKeyError);
        return;
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

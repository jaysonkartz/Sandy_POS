import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/app/lib/supabaseClient";

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
    } catch (error) {
      console.error("Error fetching countries:", error);
      setError(error instanceof Error ? error.message : "Failed to load countries");
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

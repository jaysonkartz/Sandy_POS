"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/app/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Tag, Search, ShoppingCart, Loader2, Camera } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import { useRouter } from "next/navigation";
import React from "react";
import { Session } from "@supabase/supabase-js";
import { AuthChangeEvent } from "@supabase/supabase-js";
import SignupModal from "@/components/SignupModal";
import { CATEGORY_ID_NAME_MAP } from "./(admin)/const/category";
import ProductPhotoEditor from "@/components/ProductPhotoEditor";

// Custom WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="#25D366"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
  </svg>
);

interface Product {
  id: number;
  "Item Code": string;
  Product: string;
  Category: string;
  weight: string;
  UOM: string;
  Country: string;
  Product_CH?: string;
  Category_CH?: string;
  Country_CH?: string;
  Variation?: string;
  Variation_CH?: string;
  price: number;
  uom: string;
  stock_quantity: number;
  image_url?: string;
}


export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isEnglish, setIsEnglish] = useState(true);
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<
    { product: Product; quantity: number }[]
  >([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [expandedCountries, setExpandedCountries] = useState<string[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<number[]>([]);
  const [countryMap, setCountryMap] = useState<{ [key: string]: { name: string; chineseName: string } }>({});
  const [selectedOptions, setSelectedOptions] = useState<{ [title: string]: { variation?: string; countryId?: string; weight?: string } }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  

  const { addToCart, cart, updateQuantity } = useCart();
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const router = useRouter();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  // Add error state for better error handling
  const [error, setError] = useState<string | null>(null);
  

  
  // Photo editor state
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [selectedProductForPhoto, setSelectedProductForPhoto] = useState<Product | null>(null);

  // Get category name by id - moved here to avoid initialization error
  const getCategoryName = (category: string | number) => {
    return CATEGORY_ID_NAME_MAP[String(category)] || "Unknown Category";
  };

  // Get category Chinese name - moved here to avoid initialization error
  const getCategoryChineseName = (category: string) => {
    // Map the category value to the correct folder name
    const categoryMap: { [key: string]: string } = {
      "1": "Dried Chilli",
      "2": "Beans & Legumes",
      "3": "Nuts & Seeds",
      "4": "Herbs and Spices",
      "5": "Grains",
      "6": "Dried Seafood",
      "7": "Vegetables",
      "8": "Dried Mushroom & Fungus"
    };
    return categoryMap[category] || "Unknown Category";
  };

  interface ProductGroup {
    title: string;
    products: Product[];
    category: string;
  }

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    
    const searchLower = searchTerm.toLowerCase();
    return products.filter(product => 
      product.Product.toLowerCase().includes(searchLower) ||
      (product.Product_CH && product.Product_CH.toLowerCase().includes(searchLower)) ||
      product["Item Code"].toLowerCase().includes(searchLower) ||
      product.Category.toLowerCase().includes(searchLower)
    );
  }, [products, searchTerm]);

  const productGroups = useMemo(() => {
    // First, group products by category
    const categoryGroups: { [category: string]: Product[] } = {};
    filteredProducts.forEach((p) => {
      const category = isEnglish ? getCategoryName(p.Category) : (p.Category_CH || getCategoryName(p.Category));
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(p);
    });

    // Then, within each category, group by product name
    const result: { title: string; products: Product[]; category: string }[] = [];
    
    Object.entries(categoryGroups).forEach(([category, categoryProducts]) => {
      const productGroups: { [title: string]: Product[] } = {};
      
      categoryProducts.forEach((p) => {
        const title = isEnglish ? p.Product : (p.Product_CH || p.Product);
        if (!productGroups[title]) {
          productGroups[title] = [];
        }
        productGroups[title].push(p);
      });

      // Add each product group with category info
      Object.values(productGroups).forEach((products) => {
        result.push({
          title: isEnglish ? products[0].Product : (products[0].Product_CH || products[0].Product),
          products,
          category: category
        });
      });
    });

    // Sort by category first, then by product name
    return result.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.title.localeCompare(b.title);
    });
  }, [filteredProducts, isEnglish]);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value);
    }, 300);
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setError(null);
        let query = supabase.from("products").select("*");

        if (selectedCategory !== "all") {
          query = query.eq("Category", String(selectedCategory));
        }

        const { data, error } = await query;
        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        setError(error instanceof Error ? error.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    }

    // Only fetch products if we have a valid session or if we're not in loading state
    // This prevents the infinite loading when session recovery is in progress
    if (session?.user || !loading) {
      fetchProducts();
    }
  }, [supabase, selectedCategory, session?.user, loading]);

  // Function to fetch user role
  const fetchUserRole = useCallback(async (userId: string) => {
    try {

      const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (userData && !error) {
        setUserRole(userData.role);
      } else {
        setUserRole("");

      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole("");
    }
  }, [supabase]);

  // Function to fetch user role with retry
  const fetchUserRoleWithRetry = useCallback(async (userId: string, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const { data: userData, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", userId)
          .single();

        if (userData && !error) {
          setUserRole(userData.role);
          return userData.role; // Return the role on success
        } else {
          if (i < retries - 1) {
            // Wait 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (error) {
        console.error(`Attempt ${i + 1} error:`, error);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    setUserRole("");
    return null; // Return null on failure
  }, [supabase]);

  // Helper function to check if session is valid
  const isSessionValid = useCallback(() => {
    // Check if session exists and has a valid user with ID and email
    const isValid = !!(session && 
           session.user && 
           session.user.id && 
           session.user.email);
    
    return isValid;
  }, [session]);







  // Aggressive session recovery function
  const aggressiveSessionRecovery = useCallback(async () => {
    // Method 1: Try refreshSession
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
              // Check for specific "session_not_found" error
        if (error?.message?.includes('session_not_found') || error?.code === 'session_not_found') {
          // Clear all invalid session data
          const keys = Object.keys(localStorage);
          const supabaseKeys = keys.filter(key => key.includes('supabase') || key.includes('sb-'));
          
          supabaseKeys.forEach(key => {
            localStorage.removeItem(key);
          });
          
          localStorage.removeItem('sandy_pos_session');
          
          // Clear React state
          setSession(null);
          setUserRole("");
          
          return false;
        }
      
      if (!error && session?.user) {
        setSession(session);
        if (session.user.id) {
          await fetchUserRole(session.user.id);
        }
        return true;
      }
            } catch (error) {
          // Session refresh failed
        }
    
    // Method 2: Check localStorage for stored session and restore Supabase context
    try {
      const keys = Object.keys(localStorage);
      const supabaseKeys = keys.filter(key => key.includes('supabase') || key.includes('sb-'));
      
      for (const key of supabaseKeys) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (parsed?.user || parsed?.access_token) {
              // If we have access_token, try to set it in Supabase
              if (parsed.access_token) {
                try {
                  // Set the session in Supabase client
                  const { data: { session: restoredSession }, error } = await supabase.auth.setSession({
                    access_token: parsed.access_token,
                    refresh_token: parsed.refresh_token || ''
                  });
                  
                  // Check for "session_not_found" error
                  if (error?.message?.includes('session_not_found') || error?.code === 'session_not_found') {
                    // Clear this specific invalid token
                    localStorage.removeItem(key);
                    
                    return false;
                  }
                  
                  if (!error && restoredSession?.user) {
                    setSession(restoredSession);
                    if (restoredSession.user.id) {
                      await fetchUserRole(restoredSession.user.id);
                    }
                    return true;
                  }
                } catch (setSessionError) {
                  // Failed to set Supabase session
                }
              }
              
              // Fallback: try to use user data directly
              if (parsed.user) {
                setSession(parsed);
                if (parsed.user.id) {
                  await fetchUserRole(parsed.user.id);
                }
                return true;
              }
            }
          }
        } catch (parseError) {
          // Failed to parse localStorage key
        }
      }
    } catch (error) {
      // Method 2 failed
    }
    
    // Method 3: Try to get session from cookies
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        if (cookie.includes('supabase') || cookie.includes('sb-')) {
          // Try to decode and use cookie data
          try {
            const decoded = decodeURIComponent(cookie.split('=')[1]);
            const parsed = JSON.parse(decoded);
            if (parsed?.user) {
              setSession(parsed);
              if (parsed.user.id) {
                await fetchUserRole(parsed.user.id);
              }
              return true;
            }
          } catch (parseError) {
            // Failed to parse cookie data
          }
        }
      }
    } catch (error) {
      // Method 3 failed
    }
    
    return false;
  }, [supabase.auth, fetchUserRole]);



  // Function to force refresh session and role
  const forceRefreshSession = useCallback(async () => {
    try {
      // Step 1: Check if we have a session but it might be stale
      if (session?.user) {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error || !currentSession?.user) {
          const recovered = await aggressiveSessionRecovery();
          if (recovered) {
            return;
          }
        } else {
          return;
        }
      }
      
      // Step 2: No session, try to recover (same as tab switch)
      const recovered = await aggressiveSessionRecovery();
      
      if (recovered) {
        return;
      }
      
      // Step 3: If aggressive recovery fails, try the basic methods as fallback
      
      // First try to get the session
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        return;
      }
      
      // If no session from getSession, try multiple recovery methods
      if (!freshSession?.user) {
        // Method 1: Try to refresh the session
        try {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (!refreshError && refreshedSession?.user) {
            setSession(refreshedSession);
            
            if (refreshedSession.user.id) {
              await fetchUserRoleWithRetry(refreshedSession.user.id);
            }
            return;
          }
        } catch (refreshError) {
          // Session refresh failed
        }
        
        // Method 2: Try to get user from local storage or cookies
        try {
          const storedSession = localStorage.getItem('sb-qtluqqnpxplpujiawqwx-auth-token');
          if (storedSession) {
            // Try to restore from stored data
            const parsedSession = JSON.parse(storedSession);
            if (parsedSession?.user) {
              setSession(parsedSession);
              if (parsedSession.user.id) {
                await fetchUserRoleWithRetry(parsedSession.user.id);
              }
              return;
            }
          }
        } catch (storageError) {
          // Storage recovery failed
        }
        
        // Method 3: Try to get user directly (this might fail but worth trying)
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (!userError && user) {
            const userSession = { user } as any;
            setSession(userSession);
            
            if (user.id) {
              await fetchUserRoleWithRetry(user.id);
            }
            return;
          }
        } catch (userError) {
          console.log('Direct user check failed:', userError);
        }
        
        // If all methods fail, show the expired message
        console.log('All recovery methods failed - session truly expired');
        setSession(null);
        setUserRole("");
        return;
      }
      
      // Use the session from getSession
      setSession(freshSession);
      
      // If session exists, fetch role
      if (freshSession?.user?.id) {
        console.log('Fetching user role for:', freshSession.user.id);
        await fetchUserRoleWithRetry(freshSession.user.id);
      } else {
        console.log('No user ID in fresh session, clearing role');
        setUserRole("");
      }
      
    } catch (error) {
      console.error('Error in force refresh:', error);
    }
  }, [session?.user, supabase.auth, fetchUserRoleWithRetry, aggressiveSessionRecovery]);

  useEffect(() => {
    // NEW: Try immediate localStorage recovery first, before any Supabase calls
    const immediateRecovery = async () => {
      try {
        // NEW: First check our custom persisted session
        try {
          const customSession = localStorage.getItem('sandy_pos_session');
          if (customSession) {
            const parsed = JSON.parse(customSession);
            if (parsed?.access_token && parsed?.user) {
              try {
                const { data: { session: restoredSession }, error: restoreError } = await supabase.auth.setSession({
                  access_token: parsed.access_token,
                  refresh_token: parsed.refresh_token || ''
                });
                
                if (!restoreError && restoredSession?.user) {
                  setSession(restoredSession);
                  if (restoredSession.user.id) {
                    await fetchUserRole(restoredSession.user.id);
                  }
                  // NEW: Set loading to false after successful recovery
                  setLoading(false);
                  return true; // Success!
                }
              } catch (setSessionError) {
                // Exception during custom session recovery
              }
            }
          }
        } catch (customError) {
          // Custom session recovery attempt failed
        }
        
        // Fallback: Check standard Supabase localStorage keys
        const keys = Object.keys(localStorage);
        const supabaseKeys = keys.filter(key => key.includes('supabase') || key.includes('sb-'));
        
        for (const key of supabaseKeys) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const parsed = JSON.parse(value);
              
              // If we have access_token, immediately restore Supabase context
              if (parsed?.access_token) {
                try {
                  const { data: { session: restoredSession }, error: restoreError } = await supabase.auth.setSession({
                    access_token: parsed.access_token,
                    refresh_token: parsed.refresh_token || ''
                  });
                  
                  if (!restoreError && restoredSession?.user) {
                    setSession(restoredSession);
                    if (restoredSession.user.id) {
                      await fetchUserRole(restoredSession.user.id);
                    }
                    // NEW: Set loading to false after successful recovery
                    setLoading(false);
                    return true; // Success!
                  }
                } catch (setSessionError) {
                  // Exception during localStorage recovery
                }
              }
            }
          } catch (parseError) {
            // Failed to parse localStorage key
          }
        }
        return false; // No recovery possible
      } catch (error) {
        // Immediate recovery attempt failed
        return false;
      }
    };

    // NEW: Immediate loading state reset if no session recovery is possible
    const resetLoadingIfNoSession = async () => {
      const hasSession = await immediateRecovery();
      if (!hasSession) {
        // If no session recovery possible, reset loading after a short delay
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    };

    resetLoadingIfNoSession();
    
    // NEW: Additional safety - force loading to false after 3 seconds if still stuck
    const forceLoadingReset = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 3000);
    
    return () => clearTimeout(forceLoadingReset);

    // Get initial session with aggressive recovery
    const getInitialSession = async () => {
      try {
        // NEW: Check for stored session first (same as Header component)
        const storedSession = localStorage.getItem('sandy_pos_session');
        if (storedSession) {
          try {
            const parsed = JSON.parse(storedSession);
            
            if (parsed?.user) {
              setSession(parsed);
              
              if (parsed.user.id) {
                await fetchUserRole(parsed.user.id);
              }
              return;
            }
          } catch (parseError) {
            // Failed to parse stored session
          }
        }
        
        // NEW: Try immediate recovery first
        const immediateSuccess = await immediateRecovery();
        if (immediateSuccess) {
          return;
        }
        
        // First try to get the session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
        }
        
        // If we have a valid session, use it
        if (session?.user) {
          setSession(session);
          
          if (session.user.id) {
            await fetchUserRole(session.user.id);
          }
          return;
        }
        
        // If no session, try aggressive recovery
        const recovered = await aggressiveSessionRecovery();
        
        if (recovered) {
          return;
        }
        
        // If all recovery methods fail, try one more time with a delay
        setTimeout(async () => {
          const retryRecovered = await aggressiveSessionRecovery();
          if (retryRecovered) {
            // Session recovered on retry
          } else {
            setSession(null);
            setUserRole("");
            // NEW: Set loading to false if all recovery attempts fail
            setLoading(false);
          }
        }, 2000); // Wait 2 seconds before retry
        
        // NEW: Add a safety timeout to prevent infinite loading
        setTimeout(() => {
          if (loading) {
            setLoading(false);
          }
        }, 5000); // Reduced to 5 seconds for faster recovery
        
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      
      // NEW: Persist session to localStorage for immediate recovery on refresh
      if (session?.user) {
        try {
          const sessionData = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: session.user,
            expires_at: session.expires_at
          };
          localStorage.setItem('sandy_pos_session', JSON.stringify(sessionData));
        } catch (persistError) {
          console.error('Failed to persist session:', persistError);
        }
      } else {
        // Clear persisted session if no session
        try {
          localStorage.removeItem('sandy_pos_session');
        } catch (clearError) {
          console.error('Failed to clear persisted session:', clearError);
        }
      }
      
      // Fetch user role if session exists
      if (session?.user?.id) {
        await fetchUserRole(session.user.id);
      } else {
        setUserRole("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, fetchUserRole]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-refresh session to keep it alive - much more aggressive
  useEffect(() => {
    if (!session?.user) return;

    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('Error refreshing session:', error);
          return;
        }
        
        if (refreshedSession) {
          setSession(refreshedSession);
        }
      } catch (error) {
        console.error('Exception refreshing session:', error);
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes instead of 15

    return () => clearInterval(refreshInterval);
  }, [session?.user, supabase.auth]);

  // Persistent session monitoring - checks session status every 1 minute
  useEffect(() => {
    const sessionCheckInterval = setInterval(async () => {
      try {
        // Check if we have a session but it might be stale
        if (session?.user) {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          
          if (error || !currentSession?.user) {
            const recovered = await aggressiveSessionRecovery();
            if (!recovered) {
              setSession(null);
              setUserRole("");
            }
          } else {
            // Session is valid, proactively refresh it to keep it alive
            try {
              const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
              if (!refreshError && refreshedSession) {
                setSession(refreshedSession);
              }
            } catch (refreshError) {
              // Proactive refresh failed
            }
          }
        } else {
          // No session, try to recover
          const recovered = await aggressiveSessionRecovery();
          if (recovered) {
            // Session recovered during periodic check
          }
        }
      } catch (error) {
        console.error('Error in periodic session check:', error);
      }
    }, 1 * 60 * 1000); // Check every 1 minute instead of 2

    return () => clearInterval(sessionCheckInterval);
  }, [session?.user, aggressiveSessionRecovery]);

  // Handle page visibility changes to restore session when user returns
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // If we don't have a session, try to recover
        if (!session?.user) {
          const recovered = await aggressiveSessionRecovery();
          if (recovered) {
            // Session recovered when page became visible
          }
        } else {
          // Verify current session is still valid
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (!currentSession?.user) {
            const recovered = await aggressiveSessionRecovery();
            if (!recovered) {
              setSession(null);
              setUserRole("");
            }
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session?.user, aggressiveSessionRecovery]);

  // User activity detection to keep session alive
  useEffect(() => {
    let activityTimeout: NodeJS.Timeout;
    
    const handleUserActivity = async () => {
      // Clear existing timeout
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      
      // Set new timeout for 30 seconds of inactivity
      activityTimeout = setTimeout(async () => {
        // If user is inactive and we have a session, refresh it
        if (session?.user) {
          try {
            const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
            if (!error && refreshedSession) {
              setSession(refreshedSession);
            }
          } catch (error) {
            // Failed to refresh session on user activity
          }
        }
      }, 30 * 1000); // 30 seconds
    };

    // Listen for user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [session?.user, supabase.auth]);

  // Debug effect to monitor session and role changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Session or role changed:', {
        session: session ? { 
          hasUser: !!session.user, 
          hasId: !!session.user?.id, 
          hasEmail: !!session.user?.email,
          sessionKeys: Object.keys(session),
          userKeys: session.user ? Object.keys(session.user) : []
        } : null,
        userRole,
        isSessionValid: isSessionValid()
      });
    }
  }, [session, userRole, isSessionValid]);

  useEffect(() => {
    async function fetchCountries() {
      try {
        const { data, error } = await supabase
          .from("countries")
          .select("*");
        
        if (error) throw error;
        
        const countryMapping: { [key: string]: { name: string; chineseName: string } } = {};
        data?.forEach((country: any) => {
          countryMapping[country.id] = {
            name: country.country,
            chineseName: country.chineseName
          };
        });
        
        setCountryMap(countryMapping);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    }

    fetchCountries();
  }, [supabase]);



  //Send Whatsapp enquiry
  const handleCustomerService = useCallback(() => {
    const phoneNumber = "6593254825";
    const message = "Hi, I would like to inquire about your products.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  }, []);

  //Add to order
  const handleAddToOrder = useCallback((product: Product) => {
    const existingProduct = selectedProducts.find((item) => item.product.id === product.id);
    if (existingProduct) {
      setSelectedProducts((prev) =>
        prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setSelectedProducts((prev) => [...prev, { product, quantity: 1 }]);
    }
  }, [selectedProducts]);

  //Update quantity
  const handleUpdateQuantity = useCallback((productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      setSelectedProducts((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      setSelectedProducts((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  }, []);

  //Send Whatsapp notification after submit order
  const sendWhatsAppNotification = useCallback((orderDetails: {
    orderId: number;
    customerName: string;
    totalAmount: number;
    items: Array<{
      productName: string;
      quantity: number;
      price: number;
    }>;
  }) => {
    // Format the message
    const message = `
🛍️ New Order Notification
Order ID: ${orderDetails.orderId}
Customer: ${orderDetails.customerName}
Total Amount: $${orderDetails.totalAmount.toFixed(2)}

Order Items:
${orderDetails.items
  .map((item) => `- ${item.productName} x ${item.quantity} @ $${item.price.toFixed(2)}`)
  .join("\n")}

Please check the admin panel for more details.
    `.trim();

    // Create WhatsApp URL (using your business phone number)
    const phoneNumber = "6593254825"; // Replace with your business phone number
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp in a new window
    window.open(whatsappUrl, "_blank");
  }, []);

  // Open photo editor for a product
  const openPhotoEditor = useCallback((product: Product) => {
    setSelectedProductForPhoto(product);
    setIsPhotoEditorOpen(true);
  }, []);

  // Close photo editor
  const closePhotoEditor = useCallback(() => {
    setIsPhotoEditorOpen(false);
    setSelectedProductForPhoto(null);
  }, []);

  // Handle image update from photo editor
  const handleImageUpdate = useCallback((imageUrl: string) => {
    if (selectedProductForPhoto) {
      // Update the product in the local state
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === selectedProductForPhoto.id 
            ? { ...p, image_url: imageUrl }
            : p
        )
      );
    }
  }, [selectedProductForPhoto]);

  const handleSubmitOrder = useCallback(async () => {
    // Check if user is authenticated
    if (!session) {
      alert(isEnglish ? "Please log in to submit an order" : "请登录以提交订单");
      return;
    }

    if (selectedProducts.length === 0) {
      alert(
        isEnglish ? "Please add at least one product to the order" : "请至少添加一个产品到订单"
      );
      return;
    }

    if (!customerName || !customerPhone) {
      alert(
        isEnglish ? "Please provide customer name and phone number" : "请提供客户姓名和电话号码"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate total amount
      const totalAmount = selectedProducts.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );

      // Create order with user_id
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            status: "pending",
            total_amount: totalAmount,
            created_at: new Date().toISOString(),
            user_id: session.user.id,
            customer_name: customerName,
            customer_phone: customerPhone,
          },
        ])
        .select()
        .single();

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw orderError;
      }

      // Create order items
      const orderItems = selectedProducts.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        total_price: item.product.price * item.quantity,
        product_name: isEnglish ? item.product.Product : item.product.Product_CH,
        product_code: item.product["Item Code"] || "N/A",
        created_at: new Date().toISOString(),
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

      if (itemsError) {
        console.error("Error creating order items:", itemsError);
        throw itemsError;
      }

      // Send WhatsApp notification
      sendWhatsAppNotification({
        orderId: order.id,
        customerName,
        totalAmount,
        items: selectedProducts.map((item) => ({
          productName: isEnglish
            ? item.product.Product
            : item.product.Product_CH || item.product.Product,
          quantity: item.quantity,
          price: item.product.price,
        })),
      });

      // Reset form and close panel
      setSelectedProducts([]);
      setCustomerName("");
      setCustomerPhone("");
      setIsOrderPanelOpen(false);

      // Show success message
      alert(isEnglish ? "Order submitted successfully!" : "订单提交成功！");
    } catch (error) {
      console.error("Error submitting order:", error);
      alert(isEnglish ? "Error submitting order. Please try again." : "提交订单时出错，请重试。");
    } finally {
      setIsSubmitting(false);
    }
  }, [session, selectedProducts, customerName, customerPhone, isEnglish, supabase, sendWhatsAppNotification]);

  const toggleCountryExpansion = useCallback((country: string) => {
    setExpandedCountries((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]
    );
  }, []);

  const toggleProductExpansion = useCallback((productId: number) => {
    setExpandedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, []);

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <div className="p-4 space-y-3">
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isEnglish ? "Error Loading Products" : "加载产品时出错"}
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            {isEnglish ? "Try Again" : "重试"}
          </button>
        </div>
      </div>
    );
  }

  // Get unique countries and sort them
  const uniqueCountries = Array.from(new Set(products.map((p) => p.Country))).sort();

  return (
    <div className="container mx-auto p-4">


      {/* Debug Panel - Remove this after fixing the issue */}




      {/* Language Toggle, Search, and Category Filter */}
      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
            onClick={() => setIsEnglish(!isEnglish)}
          >
            <span>{isEnglish ? "中文" : "English"}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M3 5h12M9 3v18m0-18l-4 4m4-4l4 4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </button>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={isEnglish ? "Search products..." : "搜索产品..."}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.currentTarget.blur();
                  setSearchTerm("");
                }
              }}
              aria-label={isEnglish ? "Search products" : "搜索产品"}
            />
          </div>
        </div>

        <select
          className="p-2 border rounded-md"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">{isEnglish ? "All Categories" : "所有类别"}</option>
          {Object.entries(CATEGORY_ID_NAME_MAP).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="mb-4 text-sm text-gray-600">
          {isEnglish ? "Search results for" : "搜索结果："} "{searchTerm}" - {productGroups.length} {isEnglish ? "products" : "产品"}
        </div>
      )}

      {/* Product Grid - Grouped by Category */}
      <div className="space-y-8">
        {(() => {
          // Group products by category for display
          const categoryDisplayGroups: { [category: string]: typeof productGroups } = {};
          productGroups.forEach((group) => {
            if (!categoryDisplayGroups[group.category]) {
              categoryDisplayGroups[group.category] = [];
            }
            categoryDisplayGroups[group.category].push(group);
          });

          return Object.entries(categoryDisplayGroups).map(([category, groups]) => (
            <div key={category} className="space-y-4">
              {/* Category Header */}
              <div className="border-b border-gray-200 pb-2">
                <h2 className="text-2xl font-bold text-gray-800">
                  {isEnglish ? category : (groups[0]?.products[0]?.Category_CH || category)}
                </h2>
              </div>
              
              {/* Products in this category */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {groups.map((group) => {
                  const { title, products: groupProducts } = group;

                  // Helper to get selected product based on dropdowns
                  const getSelectedProduct = () => {
                    const selected = selectedOptions[title] || {};
                    let product = groupProducts.find(p => 
                      (!selected.variation || p.Variation === selected.variation) &&
                      (!selected.countryId || p.Country === selected.countryId) &&
                      (!selected.weight || p.weight === selected.weight)
                    );
                    return product || groupProducts[0];
                  };

                  const product = getSelectedProduct();
                  const cartItem = cart.find((item) => item.id === product.id);

                  const variations = [...new Set(groupProducts.map(p => p.Variation).filter(Boolean))];
                  const origins = [...new Set(groupProducts.map(p => p.Country).filter(Boolean))];
                  const weights = [...new Set(groupProducts.map(p => p.weight).filter(Boolean))];

                  const handleOptionChange = (type: 'variation' | 'countryId' | 'weight', value: string) => {
                    setSelectedOptions(prev => ({
                      ...prev,
                      [title]: {
                        ...prev[title],
                        [type]: value,
                      }
                    }));
                  };

                  return (
                    <motion.div 
                      key={title} 
                      className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      role="article"
                      aria-label={`${isEnglish ? product.Product : product.Product_CH} product card`}
                    >
                      {/* Product Image */}
                      <div className="relative h-48 bg-gray-100">
                        <ProductImage
                          src={product.image_url || `/Img/${getCategoryName(product.Category)}/${product.Product}${product.Variation ? ` (${product.Variation})` : ''}.png`}
                          alt={isEnglish ? product.Product : (product.Product_CH || product.Product)}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Photo Editor Button - Only show for admin users */}
                        {isSessionValid() && userRole === 'ADMIN' && (
                          <button
                            onClick={() => openPhotoEditor(product)}
                            className="absolute top-2 right-2 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors shadow-lg"
                            title={isEnglish ? "Edit Photo (Admin Only)" : "编辑照片（仅管理员）"}
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-4 flex flex-col flex-grow">
                        <div className="flex-grow">
                          <h3 className="text-xl font-bold text-gray-800 truncate">
                            {isEnglish ? product.Product : product.Product_CH}
                          </h3>
                          <p className="text-xs text-gray-400 mb-3">{product["Item Code"]}</p>

                          {/* Dropdowns */}
                          <div className="space-y-2 mb-4">
                            {variations.length > 0 && (
                              <div>
                                <label className="text-xs font-medium text-gray-500">{isEnglish ? "Variation" : "规格"}</label>
                                <select
                                  className="w-full p-2 mt-1 text-sm border-gray-200 border bg-gray-50 rounded-md focus:border-blue-500 focus:ring-blue-500 transition"
                                  value={selectedOptions[title]?.variation || variations[0]}
                                  onChange={(e) => handleOptionChange('variation', e.target.value)}
                                >
                                  {variations.map(v => (
                                    <option key={v} value={v}>{isEnglish ? v : (groupProducts.find(p=>p.Variation === v)?.Variation_CH || v)}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {origins.length > 0 && (
                              <div>
                                <label className="text-xs font-medium text-gray-500">{isEnglish ? "Origin" : "产地"}</label>
                                <select
                                   className="w-full p-2 mt-1 text-sm border-gray-200 border bg-gray-50 rounded-md focus:border-blue-500 focus:ring-blue-500 transition"
                                   value={selectedOptions[title]?.countryId || origins[0]}
                                   onChange={(e) => handleOptionChange('countryId', e.target.value)}
                                >
                                  {origins.map(o => (
                                    <option key={o} value={o}>{isEnglish ? (countryMap[o]?.name || o) : (countryMap[o]?.chineseName || o)}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {weights.length > 0 && (
                              <div>
                                <label className="text-xs font-medium text-gray-500">{isEnglish ? "Weight" : "重量"}</label>
                                <select
                                   className="w-full p-2 mt-1 text-sm border-gray-200 border bg-gray-50 rounded-md focus:border-blue-500 focus:ring-blue-500 transition"
                                   value={selectedOptions[title]?.weight || weights[0]}
                                   onChange={(e) => handleOptionChange('weight', e.target.value)}
                                >
                                  {weights.map(w => (
                                    <option key={w} value={w}>{w}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Price */}
                          {isSessionValid() && (
                            <div className="mb-4">
                              <p className="text-2xl font-extrabold text-gray-800">
                                ${product.price.toFixed(2)}
                                <span className="text-base font-medium text-gray-500">/{product.UOM}</span>
                              </p>
                              
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}

                        <div className="mt-auto pt-4 border-t border-gray-100">
                          {!isSessionValid() ? (
                             <button
                                className="w-full text-center text-blue-600 font-semibold hover:text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setIsSignupModalOpen(true)}
                                disabled={isLoggingIn}
                              >
                                {isLoggingIn 
                                  ? (isEnglish ? "Logging in..." : "登录中...") 
                                  : (isEnglish ? "Login to see price" : "登录查看价格")
                                }
                              </button>
                          ) : (
                            <div className="flex items-center justify-between w-full gap-1 py-3 px-3 bg-gray-50 rounded-lg border border-gray-200">
                              {/* Left: Quantity controls */}
                              <div className="flex items-center gap-4">
                                {/* Minus button */}
                                <button
                                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors text-base font-semibold min-w-[40px] h-10 flex items-center justify-center"
                                  onClick={() => {
                                    const existingProduct = selectedProducts.find(p => p.product.id === product.id);
                                    if (existingProduct && existingProduct.quantity > 1) {
                                      handleUpdateQuantity(product.id, existingProduct.quantity - 1);
                                    } else if (existingProduct && existingProduct.quantity === 1) {
                                      // Remove product if quantity would become 0
                                      handleUpdateQuantity(product.id, 0);
                                    }
                                    // If product not in cart, do nothing for minus button
                                  }}
                                >
                                  -
                                </button>
                                
                                {/* Editable quantity input */}
                                {selectedProducts.find(p => p.product.id === product.id) ? (
                                  <input
                                    type="number"
                                    min="1"
                                    value={selectedProducts.find(p => p.product.id === product.id)?.quantity || 0}
                                    onChange={(e) => {
                                      const newQuantity = parseInt(e.target.value) || 0;
                                      if (newQuantity > 0) {
                                        handleUpdateQuantity(product.id, newQuantity);
                                      } else if (newQuantity === 0) {
                                        handleUpdateQuantity(product.id, 0);
                                      }
                                    }}
                                    onBlur={(e) => {
                                      const newQuantity = parseInt(e.target.value) || 0;
                                      if (newQuantity < 1) {
                                        handleUpdateQuantity(product.id, 1);
                                      }
                                    }}
                                    className="w-28 text-center border border-gray-300 rounded px-3 py-2 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10"
                                  />
                                ) : (
                                  <input
                                    type="number"
                                    min="1"
                                    value="0"
                                    onChange={(e) => {
                                      const newQuantity = parseInt(e.target.value) || 0;
                                      if (newQuantity > 0) {
                                        handleAddToOrder(product);
                                        // Set the quantity after adding
                                        setTimeout(() => {
                                          handleUpdateQuantity(product.id, newQuantity);
                                        }, 100);
                                      }
                                    }}
                                    onBlur={(e) => {
                                      const newQuantity = parseInt(e.target.value) || 0;
                                      if (newQuantity < 1) {
                                        e.target.value = "0";
                                      }
                                    }}
                                    className="w-28 text-center border border-gray-300 rounded px-3 py-2 text-base font-semibold focus:outline-none focus:border-transparent text-gray-400 h-10"
                                    placeholder="0"
                                  />
                                )}
                                
                                {/* Plus button */}
                                <button
                                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors text-base font-semibold min-w-[40px] h-10 flex items-center justify-center"
                                  onClick={() => {
                                    const existingProduct = selectedProducts.find(p => p.product.id === product.id);
                                    if (existingProduct) {
                                      handleUpdateQuantity(product.id, existingProduct.quantity + 1);
                                    } else {
                                      // If product not in cart, add it with quantity 1
                                      handleAddToOrder(product);
                                    }
                                  }}
                                >
                                  +
                                </button>
                              </div>
                              
                              {/* Right: WhatsApp Icon */}
                              <button
                                className="flex-shrink-0 bg-gray-100 text-gray-600 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors h-10 flex items-center justify-center"
                                onClick={() => handleCustomerService()}
                                title={isEnglish ? "Inquire via WhatsApp" : "通过WhatsApp询价"}
                              >
                                <WhatsAppIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ));
        })()}
      </div>

      {/* No Results Message */}
      {productGroups.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isEnglish ? "No products found" : "未找到产品"}
          </h3>
          <p className="text-gray-500">
            {isEnglish ? "Try adjusting your search terms or category filter" : "请尝试调整搜索词或类别筛选"}
          </p>
        </div>
      )}

      {/* Floating Order Button */}
      {selectedProducts.length > 0 && (
        <motion.button
          animate={{ scale: 1 }}
          className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-40"
          initial={{ scale: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOrderPanelOpen(true)}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{isEnglish ? "View Order" : "查看订单"}</span>
            <span className="bg-white text-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              {selectedProducts.length}
            </span>
          </div>
        </motion.button>
      )}

      {/* Order Panel */}
      <AnimatePresence>
        {isOrderPanelOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsOrderPanelOpen(false);
              }
            }}
          >
            <motion.div
              animate={{ x: 0 }}
              className="w-full max-w-md bg-white h-full p-4 overflow-y-auto"
              exit={{ x: "100%" }}
              initial={{ x: "100%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{isEnglish ? "Create Order" : "创建订单"}</h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setIsOrderPanelOpen(false)}
                >
                  ✕
                </button>
              </div>

              {/* Customer Information */}
              <div className="mb-4 space-y-3">
                <h3 className="font-semibold">{isEnglish ? "Customer Information" : "客户信息"}</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isEnglish ? "Customer Name" : "客户姓名"}
                    </label>
                    <input
                      required
                      className="w-full p-2 border rounded-md"
                      placeholder={isEnglish ? "Enter customer name" : "输入客户姓名"}
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isEnglish ? "Phone Number" : "电话号码"}
                    </label>
                    <input
                      required
                      className="w-full p-2 border rounded-md"
                      placeholder={isEnglish ? "Enter phone number" : "输入电话号码"}
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {selectedProducts.length > 0 && (
                <div className="mb-4 space-y-2">
                  <h3 className="font-semibold mb-2">
                    {isEnglish ? "Selected Products" : "已选产品"}
                  </h3>
                  {selectedProducts.map(({ product, quantity }) => (
                    <div key={product.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-medium">
                          {isEnglish ? product.Product : product.Product_CH}
                        </p>
                        <span className="text-sm text-gray-600">
                          ${product.price.toFixed(2)}/{product.UOM}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                            onClick={() => handleUpdateQuantity(product.id, quantity - 1)}
                          >
                            -
                          </button>
                          <span className="text-sm">{quantity}</span>
                          <button
                            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                            onClick={() => handleUpdateQuantity(product.id, quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="text-red-500 hover:text-red-700 text-sm"
                          onClick={() => handleUpdateQuantity(product.id, 0)}
                        >
                          {isEnglish ? "Remove" : "移除"}
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="text-right font-semibold mt-2">
                    {isEnglish ? "Total:" : "总计:"} $
                    {selectedProducts
                      .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
                      .toFixed(2)}
                  </div>
                </div>
              )}

              <button
                className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
                disabled={selectedProducts.length === 0 || isSubmitting}
                onClick={handleSubmitOrder}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEnglish ? "Submitting..." : "提交中..."}
                  </>
                ) : (
                  <>
                    {isEnglish ? "Submit Order" : "提交订单"}
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to Top Arrow */}
      {showScrollTop && (
        <motion.button
          onClick={handleScrollToTop}
          className="fixed bottom-20 right-4 z-50 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
          aria-label="Scroll to top"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </motion.button>
      )}

      {/* Signup Modal */}
      <SignupModal 
        isOpen={isSignupModalOpen} 
        onClose={() => setIsSignupModalOpen(false)}
        onLoginSuccess={async () => {
          try {
            setIsLoggingIn(true);
            
            // Force refresh the session to ensure we have the latest data
            await forceRefreshSession();
            
            // Close the modal after successful login
            setIsSignupModalOpen(false);
          } catch (error) {
            console.error('Error in login success callback:', error);
          } finally {
            setIsLoggingIn(false);
          }
        }}
      />

      {/* Photo Editor Modal */}
      {selectedProductForPhoto && (
        <ProductPhotoEditor
          productId={selectedProductForPhoto.id}
          productName={selectedProductForPhoto.Product}
          currentImageUrl={selectedProductForPhoto.image_url}
          onImageUpdate={handleImageUpdate}
          onClose={closePhotoEditor}
          isOpen={isPhotoEditorOpen}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

interface Product {
  id: number;
  title: string;
  price: number;
  heroImage?: string;
  imagesUrl: string;
  maxQuantity: number;
  category: number;
  Variation?: string;
  Country_of_origin?: string;
}

interface ProductGroup {
  title: string;
  products: Product[];
}

export default function ProductsPage({ params }: { params: { categoryId: string } }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track selected variation and origin for each product group
  const [selectedOptions, setSelectedOptions] = useState<{ [title: string]: { variation: string; origin: string } }>({});
  // Add global filter state
  const [globalVariation, setGlobalVariation] = useState<string>("All");
  const [globalOrigin, setGlobalOrigin] = useState<string>("All");

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "SIGNED_OUT") {
        router.push("/");
      }
    });

    fetchProducts();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProducts() {
    try {
      console.log("Starting fetchProducts...");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("Session:", session);

      if (!session) {
        console.log("No session, redirecting to login...");
        localStorage.setItem("intendedCategory", params.categoryId);
        router.push("/login");
        return;
      }

      console.log("Fetching products for category:", params.categoryId);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", params.categoryId);

      console.log("Supabase response:", { data, error });

      if (error) throw error;
      setProducts(data || []);
      
      // Debug: Log the products data
      console.log("Loaded products:", data);
      console.log("Products with variations:", data?.filter(p => p.Variation));
      console.log("Products with origins:", data?.filter(p => p.Country_of_origin));

      const initialQuantities = (data || []).reduce(
        (acc: { [key: number]: number }, product: Product) => ({
          ...acc,
          [product.id]: 0,
        }),
        {}
      );
      setQuantities(initialQuantities);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }

  // Group products by title
  const productGroups: ProductGroup[] = useMemo(() => {
    const groups: { [title: string]: Product[] } = {};
    products.forEach((p) => {
      if (!groups[p.title]) groups[p.title] = [];
      groups[p.title].push(p);
    });
    return Object.entries(groups).map(([title, products]) => ({ title, products }));
  }, [products]);

  // Extract all unique variations and origins from all products for global dropdowns
  const allVariations = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.Variation) set.add(p.Variation);
    });
    return ["All", ...Array.from(set)];
  }, [products]);

  const allOrigins = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.Country_of_origin) set.add(p.Country_of_origin);
    });
    return ["All", ...Array.from(set)];
  }, [products]);

  // Filter product groups based on global filters
  const filteredProductGroups: ProductGroup[] = useMemo(() => {
    return productGroups
      .map((group) => {
        // Filter products in group by global filters
        const filteredProducts = group.products.filter((p) => {
          const matchVariation = globalVariation === "All" || p.Variation === globalVariation;
          const matchOrigin = globalOrigin === "All" || p.Country_of_origin === globalOrigin;
          return matchVariation && matchOrigin;
        });
        return { ...group, products: filteredProducts };
      })
      .filter((group) => group.products.length > 0);
  }, [productGroups, globalVariation, globalOrigin]);

  // Helper to get unique variations and origins for a group
  const getVariations = (group: ProductGroup) => {
    const variations = [...new Set(
      group.products
        .filter((p) => globalOrigin === "All" || p.Country_of_origin === globalOrigin)
        .map((p) => p.Variation)
        .filter(Boolean)
    )];
    console.log(`Variations for ${group.title}:`, variations); // Debug log
    return variations;
  };
  
  const getOrigins = (group: ProductGroup) => {
    const origins = [...new Set(
      group.products
        .filter((p) => globalVariation === "All" || p.Variation === globalVariation)
        .map((p) => p.Country_of_origin)
        .filter(Boolean)
    )];
    console.log(`Origins for ${group.title}:`, origins); // Debug log
    return origins;
  };

  // Helper to get the selected product for a group
  const getSelectedProduct = (group: ProductGroup) => {
    const sel = selectedOptions[group.title] || {};
    return (
      group.products.find(
        (p) =>
          (!sel.variation || p.Variation === sel.variation) &&
          (!sel.origin || p.Country_of_origin === sel.origin)
      ) || group.products[0]
    );
  };

  // Handler for dropdown changes
  const handleOptionChange = (title: string, type: "variation" | "origin", value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [title]: {
        ...prev[title],
        [type]: value,
      },
    }));
  };

  const handleQuantityChange = (productId: number, newQuantity: number, maxQuantity: number) => {
    const validQuantity = Math.max(0, Math.min(newQuantity, maxQuantity));
    setQuantities((prev) => ({
      ...prev,
      [productId]: validQuantity,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Debug information at the top */}
      <div className="bg-yellow-100 p-4 mb-4 rounded">
        <h3 className="font-bold">Debug Information:</h3>
        <p>Products loaded: {products.length}</p>
        <p>Product groups: {productGroups.length}</p>
        <p>Filtered groups: {filteredProductGroups.length}</p>
        <p>Is loading: {isLoading.toString()}</p>
        <p>Error: {error || 'None'}</p>
        <p>Category ID: {params.categoryId}</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <button className="text-blue-500 hover:text-blue-700" onClick={() => router.push("/")}>
          ← Back to Categories
        </button>
      </div>

      {/* Global Dropdowns for Variation and Origin */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="mr-2 font-medium">Variation:</label>
          <select
            className="border rounded px-2 py-1"
            value={globalVariation}
            onChange={(e) => setGlobalVariation(e.target.value)}
          >
            {allVariations.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mr-2 font-medium">Origin:</label>
          <select
            className="border rounded px-2 py-1"
            value={globalOrigin}
            onChange={(e) => setGlobalOrigin(e.target.value)}
          >
            {allOrigins.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Test card to see if rendering works */}
        <div className="bg-blue-200 rounded-lg p-4 shadow-md">
          <h3 className="font-semibold text-lg">TEST CARD</h3>
          <p>This is a test card to see if rendering works</p>
          <div className="flex gap-2 mb-2">
            <div>
              <label className="mr-1 text-sm">Test Variation:</label>
              <select className="border rounded px-2 py-1 text-sm">
                <option>Test Option 1</option>
                <option>Test Option 2</option>
              </select>
            </div>
            <div>
              <label className="mr-1 text-sm">Test Origin:</label>
              <select className="border rounded px-2 py-1 text-sm">
                <option>Test Origin 1</option>
                <option>Test Origin 2</option>
              </select>
            </div>
          </div>
        </div>

        {filteredProductGroups.map((group) => {
          const variations = getVariations(group);
          const origins = getOrigins(group);
          const selectedProduct = getSelectedProduct(group);
          return (
            <div key={group.title} className="bg-red-200 rounded-lg p-4 shadow-md">
              <h3 className="font-semibold text-lg">{group.title}</h3>
              {selectedProduct.heroImage && (
                <div className="my-2">
                  <img
                    alt={selectedProduct.title}
                    className="w-full h-48 object-cover rounded"
                    src={selectedProduct.heroImage}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <div className="flex gap-2 mb-2">
                  {/* Always show variation dropdown if there are products */}
                  <div>
                    <label className="mr-1 text-sm">Variation:</label>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={selectedOptions[group.title]?.variation || (variations[0] || "Default")}
                      onChange={(e) => handleOptionChange(group.title, "variation", e.target.value)}
                    >
                      {variations.length > 0 ? (
                        variations.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))
                      ) : (
                        <option value="Default">Default</option>
                      )}
                    </select>
                  </div>
                  
                  {/* Always show origin dropdown if there are products */}
                  <div>
                    <label className="mr-1 text-sm">Origin:</label>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={selectedOptions[group.title]?.origin || (origins[0] || "Default")}
                      onChange={(e) => handleOptionChange(group.title, "origin", e.target.value)}
                    >
                      {origins.length > 0 ? (
                        origins.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))
                      ) : (
                        <option value="Default">Default</option>
                      )}
                    </select>
                  </div>
                </div>
                
                {/* Debug info - remove this later */}
                <div className="text-xs text-gray-500 mb-2">
                  Debug: {variations.length} variations, {origins.length} origins
                </div>
                <div className="text-right font-semibold">S${selectedProduct.price.toFixed(2)}/kg</div>
                <div className="flex justify-between">
                  <span>Availability:</span>
                  <span>{selectedProduct.maxQuantity > 0 ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lead Time:</span>
                  <span>13 Days</span>
                </div>
                <div className="flex justify-between">
                  <span>Origin:</span>
                  <span>{selectedProduct.Country_of_origin}</span>
                </div>
                <div className="flex justify-between">
                  <span>MOQ:</span>
                  <span>9 kg/bag</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Quantity:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      className="px-2 py-0.5 bg-white rounded"
                      onClick={() =>
                        handleQuantityChange(
                          selectedProduct.id,
                          quantities[selectedProduct.id] - 1,
                          selectedProduct.maxQuantity
                        )
                      }
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{quantities[selectedProduct.id]}</span>
                    <button
                      className="px-2 py-0.5 bg-white rounded"
                      onClick={() =>
                        handleQuantityChange(
                          selectedProduct.id,
                          quantities[selectedProduct.id] + 1,
                          selectedProduct.maxQuantity
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Sub-Total:</span>
                  <span>{(selectedProduct.price * quantities[selectedProduct.id]).toFixed(2)}</span>
                </div>
                <div className="flex space-x-2">
                  <button className="flex-1 px-3 py-1 bg-green-500 text-white rounded text-sm">
                    Make Offer
                  </button>
                  <button className="flex-1 px-3 py-1 bg-blue-500 text-white rounded text-sm">
                    Add to Cart
                  </button>
                </div>
                <button className="w-full flex items-center justify-center space-x-2 px-3 py-1 bg-green-600 text-white rounded text-sm">
                  <span>Customer Service</span>
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  </svg>
                </button>
                <div className="mt-2">
                  <h4 className="font-semibold">Description</h4>
                  <p className="text-sm">
                    It is a long established fact that a reader will be distracted by the readable
                    content of a page when looking at its layout.
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

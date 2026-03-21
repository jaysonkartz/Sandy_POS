"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { CldImage } from "next-cloudinary";

interface ProductImageRow {
  id: number;
  product_id: number;
  image_url: string;
  sort_order: number;
  is_cover: boolean;
}

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
  image_url?: string;
  product_images?: ProductImageRow[];
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
  const [selectedOptions, setSelectedOptions] = useState<{
    [title: string]: { variation: string; origin: string };
  }>({});
  const [globalVariation, setGlobalVariation] = useState<string>("All");
  const [globalOrigin, setGlobalOrigin] = useState<string>("All");
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<Record<string, string>>({});

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
      setIsLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        localStorage.setItem("intendedCategory", params.categoryId);
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_images (
            id,
            product_id,
            image_url,
            sort_order,
            is_cover
          )
        `)
        .eq("category", params.categoryId);

      if (error) throw error;

      const normalized = (data || []).map((product: any) => ({
        ...product,
        product_images: [...(product.product_images || [])].sort((a: ProductImageRow, b: ProductImageRow) => {
          if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
          return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        }),
      }));

      setProducts(normalized);

      const initialQuantities = normalized.reduce(
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

  const productGroups: ProductGroup[] = useMemo(() => {
    const groups: { [title: string]: Product[] } = {};
    products.forEach((p) => {
      if (!groups[p.title]) groups[p.title] = [];
      groups[p.title].push(p);
    });
    return Object.entries(groups).map(([title, products]) => ({ title, products }));
  }, [products]);

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

  const filteredProductGroups: ProductGroup[] = useMemo(() => {
    return productGroups
      .map((group) => {
        const filteredProducts = group.products.filter((p) => {
          const matchVariation = globalVariation === "All" || p.Variation === globalVariation;
          const matchOrigin = globalOrigin === "All" || p.Country_of_origin === globalOrigin;
          return matchVariation && matchOrigin;
        });
        return { ...group, products: filteredProducts };
      })
      .filter((group) => group.products.length > 0);
  }, [productGroups, globalVariation, globalOrigin]);

  const getVariations = (group: ProductGroup) => {
    return [
      ...new Set(
        group.products
          .filter((p) => globalOrigin === "All" || p.Country_of_origin === globalOrigin)
          .map((p) => p.Variation)
          .filter(Boolean)
      ),
    ];
  };

  const getOrigins = (group: ProductGroup) => {
    return [
      ...new Set(
        group.products
          .filter((p) => globalVariation === "All" || p.Variation === globalVariation)
          .map((p) => p.Country_of_origin)
          .filter(Boolean)
      ),
    ];
  };

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

  const getGalleryImages = (product: Product) => {
    const imageList = (product.product_images || []).map((img) => img.image_url).filter(Boolean);

    if (imageList.length > 0) return imageList;
    if (product.image_url) return [product.image_url];
    if (product.heroImage) return [product.heroImage];

    return [];
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <button className="text-blue-500 hover:text-blue-700" onClick={() => router.push("/")}>
          ← Back to Categories
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="mr-2 font-medium">Variation:</label>
          <select
            className="rounded border px-2 py-1"
            value={globalVariation}
            onChange={(e) => setGlobalVariation(e.target.value)}
          >
            {allVariations.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mr-2 font-medium">Origin:</label>
          <select
            className="rounded border px-2 py-1"
            value={globalOrigin}
            onChange={(e) => setGlobalOrigin(e.target.value)}
          >
            {allOrigins.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProductGroups.map((group) => {
          const variations = getVariations(group);
          const origins = getOrigins(group);
          const selectedProduct = getSelectedProduct(group);
          const galleryImages = getGalleryImages(selectedProduct);
          const activeImage =
            selectedGalleryImage[group.title] || galleryImages[0] || "";

          return (
            <div key={group.title} className="rounded-lg bg-white p-4 shadow-md">
              <h3 className="text-lg font-semibold">{group.title}</h3>

              {activeImage && (
                <div className="my-2">
                  <CldImage
                    alt={selectedProduct.title}
                    className="h-48 w-full rounded object-cover"
                    src={activeImage}
                    width={640}
                  />
                </div>
              )}

              {galleryImages.length > 1 && (
                <div className="mb-3 flex gap-2 overflow-x-auto">
                  {galleryImages.slice(0, 5).map((img, index) => (
                    <button
                      key={`${img}-${index}`}
                      type="button"
                      onClick={() =>
                        setSelectedGalleryImage((prev) => ({
                          ...prev,
                          [group.title]: img,
                        }))
                      }
                      className={`shrink-0 overflow-hidden rounded border-2 ${
                        activeImage === img ? "border-blue-500" : "border-gray-200"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${selectedProduct.title} ${index + 1}`}
                        className="h-14 w-14 object-cover"
                      />
                    </button>
                  ))}

                  {galleryImages.length > 5 && (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded border bg-gray-50 text-xs text-gray-500">
                      +{galleryImages.length - 5}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="mb-2 flex gap-2">
                  <div>
                    <label className="mr-1 text-sm">Variation:</label>
                    <select
                      className="rounded border px-2 py-1 text-sm"
                      value={selectedOptions[group.title]?.variation || variations[0] || "Default"}
                      onChange={(e) => handleOptionChange(group.title, "variation", e.target.value)}
                    >
                      {variations.length > 0 ? (
                        variations.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))
                      ) : (
                        <option value="Default">Default</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mr-1 text-sm">Origin:</label>
                    <select
                      className="rounded border px-2 py-1 text-sm"
                      value={selectedOptions[group.title]?.origin || origins[0] || "Default"}
                      onChange={(e) => handleOptionChange(group.title, "origin", e.target.value)}
                    >
                      {origins.length > 0 ? (
                        origins.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))
                      ) : (
                        <option value="Default">Default</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="text-right font-semibold">
                  S${selectedProduct.price.toFixed(2)}/kg
                </div>

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

                <div className="flex items-center justify-between">
                  <span>Quantity:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      className="rounded bg-gray-100 px-2 py-0.5"
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
                      className="rounded bg-gray-100 px-2 py-0.5"
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
                  <button className="flex-1 rounded bg-green-500 px-3 py-1 text-sm text-white">
                    Make Offer
                  </button>
                  <button className="flex-1 rounded bg-blue-500 px-3 py-1 text-sm text-white">
                    Add to Cart
                  </button>
                </div>

                <button className="flex w-full items-center justify-center space-x-2 rounded bg-green-600 px-3 py-1 text-sm text-white">
                  <span>Customer Service</span>
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
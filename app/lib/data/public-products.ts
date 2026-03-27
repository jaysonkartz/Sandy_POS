import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Product, ProductImageRow } from "@/app/types/product";

function normalizeProductImages(
  product: Product & { product_images?: ProductImageRow[] }
): Product {
  return {
    ...product,
    product_images: [...(product.product_images || [])].sort((a, b) => {
      if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    }),
  };
}

/** Public catalog fetch for the home page (all categories). Returns null if Supabase is not configured or the query fails. */
export async function fetchPublicProductsForHome(): Promise<Product[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) {
    return null;
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: productsData, error } = await supabase.from("products").select(`
      *,
      product_images (
        id,
        product_id,
        image_url,
        sort_order,
        is_cover
      )
    `);

  if (error) {
    console.error("fetchPublicProductsForHome:", error);
    return null;
  }

  return ((productsData as Product[]) || []).map((p) => normalizeProductImages(p));
}

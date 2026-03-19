"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { CldImage, CldUploadWidget } from "next-cloudinary";
import { supabase } from "@/app/lib/supabaseClient";

type ProductImageRow = {
  id: number;
  product_id: number;
  image_url: string;
  sort_order: number;
  is_cover: boolean;
};

type Props = {
  currentImageUrl?: string | null;
  isOpen: boolean;
  productId: number;
  productName: string;
  onClose: () => void;
  onImageUpdate: (imageUrl: string) => void;
};

export default function ProductPhotoEditorModal({
  currentImageUrl,
  isOpen,
  productId,
  productName,
  onClose,
  onImageUpdate,
}: Props) {
  const [images, setImages] = useState<ProductImageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // ✅ atomic sort order counter for multi-upload
  const nextSortRef = useRef(0);

  useEffect(() => {
    if (!isOpen || !productId) return;

    let alive = true;

    (async () => {
      console.warn("[PhotoEditor] loading images for product:", productId);
      setLoading(true);

      const { data, error } = await supabase
        .from("product_images")
        .select("id,product_id,image_url,sort_order,is_cover")
        .eq("product_id", productId)
        .order("is_cover", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });

      if (!alive) return;

      if (error) {
        console.error("[PhotoEditor] load images error:", error);
        setImages([]);
      } else {
        const list = (data as ProductImageRow[]) || [];
        console.warn("[PhotoEditor] loaded images:", list);
        setImages(list);

        // ✅ initialize counter based on current max sort_order
        const maxSort = list.reduce((m, x) => Math.max(m, x.sort_order ?? 0), -1);
        nextSortRef.current = maxSort + 1;
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [isOpen, productId]);

  const coverUrl = useMemo(() => {
    const cover = images.find((x) => x.is_cover)?.image_url;
    return cover || currentImageUrl || "";
  }, [images, currentImageUrl]);

  if (!isOpen) return null;

  async function setAsCover(url: string) {
    console.warn("[PhotoEditor] setAsCover:", url);

    // 1) mark all as not cover
    const { error: clearErr } = await supabase
      .from("product_images")
      .update({ is_cover: false })
      .eq("product_id", productId);

    if (clearErr) console.error("[PhotoEditor] clear cover error:", clearErr);

    // 2) mark chosen url as cover
    const { error: setErr } = await supabase
      .from("product_images")
      .update({ is_cover: true })
      .eq("product_id", productId)
      .eq("image_url", url);

    if (setErr) console.error("[PhotoEditor] set cover error:", setErr);

    // 3) update products.image_url
    const { error: prodErr } = await supabase
      .from("products")
      .update({ image_url: url })
      .eq("id", productId);

    if (prodErr) {
      console.error("[PhotoEditor] update products.image_url error:", prodErr);
    } else {
      onImageUpdate(url);
    }

    setImages((prev) => prev.map((x) => ({ ...x, is_cover: x.image_url === url })));
  }

  async function insertImage(url: string) {
    console.warn("[PhotoEditor] insertImage called with:", url);

    const sortOrder = nextSortRef.current++;
    const makeCover = images.length === 0 && !currentImageUrl && sortOrder === 0;

    const { data, error } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        image_url: url,
        sort_order: sortOrder,
        is_cover: makeCover,
      })
      .select("id,product_id,image_url,sort_order,is_cover")
      .single();

    if (error) {
      console.error("[PhotoEditor] insert product_images error:", error);
      throw error;
    }

    console.warn("[PhotoEditor] inserted row:", data);

    setImages((prev) => [...prev, data as ProductImageRow]);

    if (makeCover) await setAsCover(url);
  }

  async function deleteImage(row: ProductImageRow) {
    console.warn("[PhotoEditor] deleteImage:", row);

    const { error } = await supabase.from("product_images").delete().eq("id", row.id);
    if (error) {
      console.error("[PhotoEditor] delete error:", error);
      return;
    }

    setImages((prev) => prev.filter((x) => x.id !== row.id));
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <div className="font-semibold">Edit Product Photo</div>
            <div className="text-sm text-gray-500">{productName}</div>
          </div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Cover preview */}
          <div className="rounded-lg border bg-gray-50 p-3">
            <div className="text-sm font-medium mb-2">Cover</div>
            {coverUrl ? (
              <CldImage
                alt={`${productName} cover image`}
                className="w-full h-56 object-contain bg-white rounded"
                height={560}
                src={coverUrl}
                width={1200}
              />
            ) : (
              <div className="h-56 flex items-center justify-center text-gray-400">
                No image yet
              </div>
            )}
          </div>

          {/* Upload */}
          <div className="flex items-center gap-3 flex-wrap">
            <CldUploadWidget
              options={{
                multiple: true,
                maxFiles: 10,
                folder: `products/${productId}`,
                resourceType: "image",
              }}
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!}
              onUpload={async (result: any) => {
                // ✅ you should now see MANY events, not just "Uploading to Cloudinary"
                console.warn("[Cloudinary] event:", result?.event);
                if (result?.event === "success") {
                  console.warn("[Cloudinary] full success result:", result);
                  const url = result?.info?.secure_url;
                  console.warn("[Cloudinary] secure_url:", url);

                  if (!url) return;

                  try {
                    setIsUploading(true);
                    await insertImage(url);
                  } catch (e) {
                    console.error("[Supabase] insertImage failed:", e);
                  } finally {
                    setIsUploading(false);
                  }
                }

                if (result?.event === "error") {
                  console.error("[Cloudinary] upload error:", result);
                  setIsUploading(false);
                }
              }}
            >
              {({ open }) => (
                <button
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  type="button"
                  onClick={() => {
                    console.warn("[Cloudinary] open clicked");
                    open?.();
                  }}
                >
                  Upload Photos (Multiple)
                </button>
              )}
            </CldUploadWidget>

            {loading && <div className="text-sm text-gray-500">Loading...</div>}
            {isUploading && <div className="text-sm text-blue-600">Uploading…</div>}
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative group rounded-lg border overflow-hidden bg-white"
              >
                <CldImage
                  alt={`${productName} thumbnail`}
                  className="w-full h-24 object-cover"
                  height={192}
                  src={img.image_url}
                  width={320}
                />

                <div className="absolute inset-x-0 bottom-0 p-1 flex gap-1 bg-black/40 opacity-0 group-hover:opacity-100 transition">
                  <button
                    className="flex-1 text-xs bg-white/90 rounded px-2 py-1"
                    onClick={() => setAsCover(img.image_url)}
                  >
                    {img.is_cover ? "Cover" : "Set cover"}
                  </button>

                  <button
                    className="p-2 bg-white/90 rounded"
                    title="Delete"
                    onClick={() => deleteImage(img)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {images.length === 0 && !loading && (
            <div className="text-sm text-gray-500">No extra photos yet. Upload some!</div>
          )}
        </div>
      </div>
    </div>
  );
}

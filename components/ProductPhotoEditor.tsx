"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { CldImage } from "next-cloudinary";
import { supabase } from "@/app/lib/supabaseClient";
import ImageCropEditor from "@/components/ImageCropEditor";

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
  onRefetchProducts: () => Promise<void>;
};

export default function ProductPhotoEditor({
  currentImageUrl,
  isOpen,
  productId,
  productName,
  onClose,
  onImageUpdate,
  onRefetchProducts,
}: Props) {
  const [images, setImages] = useState<ProductImageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [cropOpen, setCropOpen] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<ProductImageRow | null>(null);
  const [pendingFileName, setPendingFileName] = useState("edited-image.jpg");

  const nextSortRef = useRef(0);
  const uploadEditInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !productId) return;
  
    let alive = true;
  
    const loadImages = async () => {
      setLoading(true);
  
      let { data, error } = await supabase
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
        setLoading(false);
        return;
      }
  
      let list = (data as ProductImageRow[]) || [];
  
      // Sync current cover into product_images if missing
      if (currentImageUrl && !list.some((img) => img.image_url === currentImageUrl)) {
        console.log("[PhotoEditor] syncing currentImageUrl into product_images:", currentImageUrl);
  
        // clear old covers first
        await supabase
          .from("product_images")
          .update({ is_cover: false })
          .eq("product_id", productId);
  
        const maxSort = list.reduce((m, x) => Math.max(m, x.sort_order ?? 0), -1);
  
        const { error: insertErr } = await supabase.from("product_images").insert({
          product_id: productId,
          image_url: currentImageUrl,
          sort_order: maxSort + 1,
          is_cover: true,
        });
  
        if (insertErr) {
          console.error("[PhotoEditor] sync insert failed:", insertErr);
        } else {
          const reload = await supabase
            .from("product_images")
            .select("id,product_id,image_url,sort_order,is_cover")
            .eq("product_id", productId)
            .order("is_cover", { ascending: false })
            .order("sort_order", { ascending: true })
            .order("id", { ascending: true });
  
          list = (reload.data as ProductImageRow[]) || [];
        }
      }
  
      setImages(list);
  
      const maxSort = list.reduce((m, x) => Math.max(m, x.sort_order ?? 0), -1);
      nextSortRef.current = maxSort + 1;
  
      setLoading(false);
    };
  
    loadImages();
  
    return () => {
      alive = false;
    };
  }, [isOpen, productId, currentImageUrl]);

  const coverUrl = useMemo(() => {
    const cover = images.find((x) => x.is_cover)?.image_url;
    return cover || currentImageUrl || "";
  }, [images, currentImageUrl]);

  async function uploadBlobToCloudinary(blob: Blob, fileName: string) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    console.log("[Cloudinary] cloudName:", cloudName);
    console.log("[Cloudinary] uploadPreset:", uploadPreset);
    console.log("[Cloudinary] fileName:", fileName);
    console.log("[Cloudinary] blob size:", blob.size);
    console.log("[Cloudinary] blob type:", blob.type);

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary configuration missing.");
    }

    const formData = new FormData();
    formData.append("file", blob, fileName);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", `products/${productId}`);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const text = await response.text();
    console.log("[Cloudinary] raw response:", text);

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.status} - ${text}`);
    }

    const json = JSON.parse(text);
    return json.secure_url as string;
  }

  async function setAsCover(url: string) {
    const { error: clearErr } = await supabase
      .from("product_images")
      .update({ is_cover: false })
      .eq("product_id", productId);

    if (clearErr) console.error("[PhotoEditor] clear cover error:", clearErr);

    const { error: setErr } = await supabase
      .from("product_images")
      .update({ is_cover: true })
      .eq("product_id", productId)
      .eq("image_url", url);

    if (setErr) console.error("[PhotoEditor] set cover error:", setErr);

    const { error: prodErr } = await supabase
      .from("products")
      .update({ image_url: url })
      .eq("id", productId);

    if (prodErr) {
      console.error("[PhotoEditor] update products.image_url error:", prodErr);
    } else {
      onImageUpdate(url);
      await onRefetchProducts();
    }

    setImages((prev) => prev.map((x) => ({ ...x, is_cover: x.image_url === url })));
  }

  async function insertImage(url: string) {
    const sortOrder = nextSortRef.current++;
    const hasCover = images.some((x) => x.is_cover) || !!currentImageUrl;
    const makeCover = !hasCover;

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

    if (error) throw error;

    setImages((prev) => [...prev, data as ProductImageRow]);

    if (makeCover) {
      await setAsCover(url);
    }
  }

  async function replaceExistingImage(row: ProductImageRow, newUrl: string) {
    console.log("[PhotoEditor] replaceExistingImage row:", row);
    console.log("[PhotoEditor] replaceExistingImage newUrl:", newUrl);

    const { error } = await supabase
      .from("product_images")
      .update({ image_url: newUrl })
      .eq("id", row.id);

    if (error) {
      console.error("[PhotoEditor] update product_images failed:", error);
      throw error;
    }

    if (row.is_cover) {
      const { error: prodErr } = await supabase
        .from("products")
        .update({ image_url: newUrl })
        .eq("id", productId);

      if (prodErr) {
        console.error("[PhotoEditor] update products cover failed:", prodErr);
        throw prodErr;
      }

      onImageUpdate(newUrl);
    }

    setImages((prev) =>
      prev.map((img) => (img.id === row.id ? { ...img, image_url: newUrl } : img))
    );

    await onRefetchProducts();
  }

  async function deleteImage(row: ProductImageRow) {
    const { error } = await supabase.from("product_images").delete().eq("id", row.id);
    if (error) {
      console.error("[PhotoEditor] delete error:", error);
      return;
    }

    const nextImages = images.filter((x) => x.id !== row.id);
    setImages(nextImages);

    if (row.is_cover) {
      if (nextImages.length === 0) {
        const { error: prodErr } = await supabase
          .from("products")
          .update({ image_url: null })
          .eq("id", productId);

        if (!prodErr) onImageUpdate("");
      } else {
        await setAsCover(nextImages[0].image_url);
      }
    }

    await onRefetchProducts();
  }

  function openEditorForNewFile(file: File) {
    const blobUrl = URL.createObjectURL(file);
    setPendingFileName(file.name || `edited-${Date.now()}.jpg`);
    setEditingRow(null);
    setCropSource(blobUrl);
    setCropOpen(true);
  }

  async function openEditorForExisting(row: ProductImageRow) {
    try {
      const response = await fetch(row.image_url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      setEditingRow(row);
      setPendingFileName(`edited-${row.id}-${Date.now()}.jpg`);
      setCropSource(blobUrl);
      setCropOpen(true);
    } catch (err) {
      console.error("[PhotoEditor] failed to load existing image for editing:", err);
      alert("Failed to open image editor");
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <div className="font-semibold">Edit Product Photo</div>
              <div className="text-sm text-gray-500">{productName}</div>
            </div>
            <button onClick={onClose} className="rounded p-2 hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4 p-4">
            <div className="rounded-lg border bg-gray-50 p-3">
              <div className="mb-2 text-sm font-medium">Cover</div>
              {coverUrl ? (
                <CldImage
                  src={coverUrl}
                  alt={`${productName} cover image`}
                  width={1200}
                  height={560}
                  className="h-56 w-full rounded bg-white object-contain"
                />
              ) : (
                <div className="flex h-56 items-center justify-center text-gray-400">
                  No image yet
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => uploadEditInputRef.current?.click()}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Add Photo
              </button>

              <input
                ref={uploadEditInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  openEditorForNewFile(file);
                  e.target.value = "";
                }}
              />

              {loading && <div className="text-sm text-gray-500">Loading...</div>}
              {isUploading && <div className="text-sm text-blue-600">Saving...</div>}
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
  {images.map((img) => (
    <div
      key={img.id}
      className="group relative overflow-hidden rounded-lg border bg-white"
      title="Click to edit this photo"
    >
      <div
        role="button"
        tabIndex={0}
        className="cursor-pointer"
        onClick={() => openEditorForExisting(img)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openEditorForExisting(img);
          }
        }}
      >
        <CldImage
          src={img.image_url}
          alt={`${productName} thumbnail`}
          width={320}
          height={192}
          className="h-24 w-full object-cover"
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/40 p-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          className="flex-1 rounded bg-white/90 px-2 py-1 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            setAsCover(img.image_url);
          }}
        >
          {img.is_cover ? "Cover" : "Set cover"}
        </button>

        <button
          type="button"
          className="rounded bg-white/90 p-2"
          onClick={(e) => {
            e.stopPropagation();
            deleteImage(img);
          }}
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  ))}
</div>

            <div className="text-sm text-gray-500">
              Click an existing photo to edit it.
            </div>

            {images.length === 0 && !loading && (
              <div className="text-sm text-gray-500">
                No extra photos yet. Add one to start.
              </div>
            )}
          </div>
        </div>
      </div>

      {cropSource && (
        <ImageCropEditor
          isOpen={cropOpen}
          imageSrc={cropSource}
          title={editingRow ? "Edit Existing Photo" : "Add Photo"}
          onClose={() => {
            if (cropSource.startsWith("blob:")) {
              URL.revokeObjectURL(cropSource);
            }
            setCropOpen(false);
            setCropSource(null);
            setEditingRow(null);
          }}
          onConfirm={async (croppedBlob) => {
            try {
              setIsUploading(true);
              console.log("[PhotoEditor] croppedBlob:", croppedBlob);
              console.log("[PhotoEditor] editingRow:", editingRow);

              const uploadedUrl = await uploadBlobToCloudinary(croppedBlob, pendingFileName);
              console.log("[PhotoEditor] uploadedUrl:", uploadedUrl);

              if (editingRow) {
                console.log("[PhotoEditor] replacing existing image...");
                await replaceExistingImage(editingRow, uploadedUrl);
                console.log("[PhotoEditor] existing image replaced");
              } else {
                console.log("[PhotoEditor] inserting new image...");
                await insertImage(uploadedUrl);
                console.log("[PhotoEditor] new image inserted");
                await onRefetchProducts();
              }

              if (cropSource?.startsWith("blob:")) {
                URL.revokeObjectURL(cropSource);
              }

              setCropOpen(false);
              setCropSource(null);
              setEditingRow(null);
            } catch (err) {
              console.error("[PhotoEditor] save failed:", err);
              alert(err instanceof Error ? err.message : "Failed to save image");
            } finally {
              setIsUploading(false);
            }
          }}
        />
      )}
    </>
  );
}
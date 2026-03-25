"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Trash2, Pencil } from "lucide-react";
import { CldImage, CldUploadWidget } from "next-cloudinary";
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
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<ProductImageRow | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string>("edited-image.jpg");

  const nextSortRef = useRef(0);
  const editOneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !productId) return;

    let alive = true;

    (async () => {
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
        setImages(list);

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

  async function uploadBlobToCloudinary(blob: Blob, fileName: string) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

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

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Cloudinary upload failed: ${response.status} - ${text}`);
    }

    const json = await response.json();
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

    if (error) {
      console.error("[PhotoEditor] insert product_images error:", error);
      throw error;
    }

    setImages((prev) => [...prev, data as ProductImageRow]);

    if (makeCover) {
      await setAsCover(url);
    }
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

        if (prodErr) {
          console.error("[PhotoEditor] clear cover in products error:", prodErr);
        } else {
          onImageUpdate("");
        }
      } else {
        await setAsCover(nextImages[0].image_url);
      }
    }
  }

  function openBeforeUploadEditor(file: File) {
    const blobUrl = URL.createObjectURL(file);
    setPendingFileName(file.name || `edited-${Date.now()}.jpg`);
    setEditingRow(null);
    setCropSource(blobUrl);
    setCropOpen(true);
  }

  async function replaceExistingImage(row: ProductImageRow, blob: Blob) {
    const newUrl = await uploadBlobToCloudinary(blob, `edited-${row.id}-${Date.now()}.jpg`);

    const { error } = await supabase
      .from("product_images")
      .update({ image_url: newUrl })
      .eq("id", row.id);

    if (error) {
      throw error;
    }

    if (row.is_cover) {
      const { error: prodErr } = await supabase
        .from("products")
        .update({ image_url: newUrl })
        .eq("id", productId);

      if (prodErr) {
        throw prodErr;
      }
      onImageUpdate(newUrl);
    }

    setImages((prev) =>
      prev.map((img) => (img.id === row.id ? { ...img, image_url: newUrl } : img))
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <div className="font-semibold">Edit Product Photo</div>
              <div className="text-sm text-gray-500">{productName}</div>
            </div>
            <button className="rounded p-2 hover:bg-gray-100" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4 p-4">
            <div className="rounded-lg border bg-gray-50 p-3">
              <div className="mb-2 text-sm font-medium">Cover</div>
              {coverUrl ? (
                <CldImage
                  alt={`${productName} cover image`}
                  className="h-56 w-full rounded bg-white object-contain"
                  height={560}
                  src={coverUrl}
                  width={1200}
                />
              ) : (
                <div className="flex h-56 items-center justify-center text-gray-400">
                  No image yet
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <CldUploadWidget
                options={{
                  multiple: true,
                  maxFiles: 10,
                  folder: `products/${productId}`,
                  resourceType: "image",
                  sources: ["local", "camera"],
                  clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
                  cropping: false,
                }}
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!}
                onError={(err) => {
                  console.error("Upload error:", err);
                  setIsUploading(false);
                }}
                onSuccess={async (result: any) => {
                  const url = result?.info?.secure_url;
                  if (!url) return;

                  try {
                    setIsUploading(true);
                    await insertImage(url);
                  } catch (err) {
                    console.error("Insert error:", err);
                  } finally {
                    setIsUploading(false);
                  }
                }}
              >
                {({ open }) => (
                  <button
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    type="button"
                    onClick={() => open?.()}
                  >
                    Upload Photos
                  </button>
                )}
              </CldUploadWidget>

              <button
                className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-800"
                type="button"
                onClick={() => editOneInputRef.current?.click()}
              >
                Edit One Before Upload
              </button>

              <input
                ref={editOneInputRef}
                accept="image/*"
                className="hidden"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  openBeforeUploadEditor(file);
                  e.target.value = "";
                }}
              />

              {loading && <div className="text-sm text-gray-500">Loading...</div>}
              {isUploading && <div className="text-sm text-blue-600">Uploading...</div>}
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative overflow-hidden rounded-lg border bg-white"
                >
                  <CldImage
                    alt={`${productName} thumbnail`}
                    className="h-24 w-full object-cover"
                    height={192}
                    src={img.image_url}
                    width={320}
                  />

                  <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/40 p-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      className="flex-1 rounded bg-white/90 px-2 py-1 text-xs"
                      onClick={() => setAsCover(img.image_url)}
                    >
                      {img.is_cover ? "Cover" : "Set cover"}
                    </button>

                    <button
                      className="rounded bg-white/90 p-2"
                      title="Edit"
                      onClick={() => {
                        setEditingRow(img);
                        setPendingFileName(`edited-${img.id}-${Date.now()}.jpg`);
                        setCropSource(img.image_url);
                        setCropOpen(true);
                      }}
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      className="rounded bg-white/90 p-2"
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

      {cropSource && (
        <ImageCropEditor
          imageSrc={cropSource}
          isOpen={cropOpen}
          title={editingRow ? "Edit Uploaded Photo" : "Edit Before Upload"}
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

              if (editingRow) {
                await replaceExistingImage(editingRow, croppedBlob);
              } else {
                const newUrl = await uploadBlobToCloudinary(croppedBlob, pendingFileName);
                await insertImage(newUrl);
              }

              if (cropSource.startsWith("blob:")) {
                URL.revokeObjectURL(cropSource);
              }

              setCropOpen(false);
              setCropSource(null);
              setEditingRow(null);
            } catch (err) {
              console.error("[PhotoEditor] crop save failed:", err);
            } finally {
              setIsUploading(false);
            }
          }}
        />
      )}
    </>
  );
}

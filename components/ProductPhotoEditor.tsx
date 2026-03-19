"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence as FramerAnimatePresence } from "framer-motion";
import { CldImage } from "next-cloudinary";
import { Upload, X, Loader2, Check, Trash2 } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";

const AnimatePresence = FramerAnimatePresence as unknown as React.FC<
  React.PropsWithChildren<Record<string, unknown>>
>;

interface ProductPhotoEditorProps {
  productId: number;
  productName: string;
  currentImageUrl?: string;
  onImageUpdate: (imageUrl: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface UploadResult {
  secure_url: string;
  public_id: string;
}

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

type CropInteraction =
  | { mode: "move"; startX: number; startY: number; startCrop: CropRect }
  | { mode: "resize"; handle: ResizeHandle; startX: number; startY: number; startCrop: CropRect };

const DEFAULT_CROP_SIZE = 200;
const MIN_CROP_SIZE = 40;

export default function ProductPhotoEditor({
  productId,
  productName,
  currentImageUrl,
  onImageUpdate,
  onClose,
  isOpen,
}: ProductPhotoEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const interactionRef = useRef<CropInteraction | null>(null);
  const [cropData, setCropData] = useState<CropRect | null>(null);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setIsEditing(true);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
        setIsEditing(true);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const getSafeCrop = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (!cropData) {
        return {
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height,
        };
      }

      const width = Math.max(1, Math.min(cropData.width, canvas.width));
      const height = Math.max(1, Math.min(cropData.height, canvas.height));
      const x = Math.max(0, Math.min(cropData.x, canvas.width - width));
      const y = Math.max(0, Math.min(cropData.y, canvas.height - height));

      return { x, y, width, height };
    },
    [cropData]
  );

  const getCanvasMetrics = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height || !canvas.width || !canvas.height) return null;

    return {
      canvas,
      rect,
      scaleX: canvas.width / rect.width,
      scaleY: canvas.height / rect.height,
    };
  }, []);

  const clampCrop = useCallback(
    (crop: CropRect, canvasWidth: number, canvasHeight: number): CropRect => {
      const width = Math.max(MIN_CROP_SIZE, Math.min(crop.width, canvasWidth));
      const height = Math.max(MIN_CROP_SIZE, Math.min(crop.height, canvasHeight));
      const x = Math.max(0, Math.min(crop.x, canvasWidth - width));
      const y = Math.max(0, Math.min(crop.y, canvasHeight - height));

      return { x, y, width, height };
    },
    []
  );

  const startCropInteraction = useCallback(
    (mode: CropInteraction["mode"], event: React.PointerEvent, handle?: ResizeHandle) => {
      if (!cropData) return;
      const metrics = getCanvasMetrics();
      if (!metrics) return;

      event.preventDefault();
      event.stopPropagation();

      activePointerIdRef.current = event.pointerId;
      interactionRef.current =
        mode === "move"
          ? {
              mode,
              startX: event.clientX,
              startY: event.clientY,
              startCrop: cropData,
            }
          : {
              mode,
              handle: handle!,
              startX: event.clientX,
              startY: event.clientY,
              startCrop: cropData,
            };

      surfaceRef.current?.setPointerCapture(event.pointerId);
    },
    [cropData, getCanvasMetrics]
  );

  const handleSurfacePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const activePointerId = activePointerIdRef.current;
      const interaction = interactionRef.current;
      if (activePointerId === null || activePointerId !== event.pointerId || !interaction) return;

      const metrics = getCanvasMetrics();
      if (!metrics) return;

      event.preventDefault();

      const dx = (event.clientX - interaction.startX) * metrics.scaleX;
      const dy = (event.clientY - interaction.startY) * metrics.scaleY;

      if (interaction.mode === "move") {
        const movedCrop = clampCrop(
          {
            ...interaction.startCrop,
            x: interaction.startCrop.x + dx,
            y: interaction.startCrop.y + dy,
          },
          metrics.canvas.width,
          metrics.canvas.height
        );
        setCropData(movedCrop);
        return;
      }

      const { startCrop, handle } = interaction;
      let left = startCrop.x;
      let top = startCrop.y;
      let right = startCrop.x + startCrop.width;
      let bottom = startCrop.y + startCrop.height;

      if (handle.includes("w")) left += dx;
      if (handle.includes("e")) right += dx;
      if (handle.includes("n")) top += dy;
      if (handle.includes("s")) bottom += dy;

      if (right - left < MIN_CROP_SIZE) {
        if (handle.includes("w") && !handle.includes("e")) {
          left = right - MIN_CROP_SIZE;
        } else {
          right = left + MIN_CROP_SIZE;
        }
      }

      if (bottom - top < MIN_CROP_SIZE) {
        if (handle.includes("n") && !handle.includes("s")) {
          top = bottom - MIN_CROP_SIZE;
        } else {
          bottom = top + MIN_CROP_SIZE;
        }
      }

      left = Math.max(0, left);
      top = Math.max(0, top);
      right = Math.min(metrics.canvas.width, right);
      bottom = Math.min(metrics.canvas.height, bottom);

      if (right - left < MIN_CROP_SIZE) {
        if (handle.includes("w") && !handle.includes("e")) {
          left = Math.max(0, right - MIN_CROP_SIZE);
        } else {
          right = Math.min(metrics.canvas.width, left + MIN_CROP_SIZE);
        }
      }

      if (bottom - top < MIN_CROP_SIZE) {
        if (handle.includes("n") && !handle.includes("s")) {
          top = Math.max(0, bottom - MIN_CROP_SIZE);
        } else {
          bottom = Math.min(metrics.canvas.height, top + MIN_CROP_SIZE);
        }
      }

      setCropData({
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
      });
    },
    [clampCrop, getCanvasMetrics]
  );

  const endCropInteraction = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    activePointerIdRef.current = null;
    interactionRef.current = null;
    if (surfaceRef.current?.hasPointerCapture(event.pointerId)) {
      surfaceRef.current.releasePointerCapture(event.pointerId);
    }
  }, []);

  const cropOverlayStyle = useMemo(() => {
    const metrics = getCanvasMetrics();
    if (!metrics || !cropData) return null;

    return {
      left: cropData.x / metrics.scaleX,
      top: cropData.y / metrics.scaleY,
      width: cropData.width / metrics.scaleX,
      height: cropData.height / metrics.scaleY,
    };
  }, [cropData, getCanvasMetrics]);

  const dataUrlToFile = useCallback(
    async (dataUrl: string) => {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      return new File([blob], `${productName}-${Date.now()}.jpg`, { type: "image/jpeg" });
    },
    [productName]
  );

  const getEditedFile = useCallback(async (): Promise<File> => {
    if (!previewUrl) {
      throw new Error("No image selected");
    }

    if (!isEditing || !canvasRef.current) {
      return dataUrlToFile(previewUrl);
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return dataUrlToFile(previewUrl);
    }

    return new Promise<File>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const crop = getSafeCrop(canvas);
        const outputCanvas = document.createElement("canvas");
        outputCanvas.width = crop.width;
        outputCanvas.height = crop.height;
        const outputCtx = outputCanvas.getContext("2d");

        if (!outputCtx) {
          reject(new Error("Failed to initialize image editor"));
          return;
        }

        outputCtx.drawImage(
          canvas,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          crop.width,
          crop.height
        );

        outputCanvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to prepare edited image"));
              return;
            }

            resolve(
              new File([blob], `${productName}-${Date.now()}.jpg`, {
                type: "image/jpeg",
              })
            );
          },
          "image/jpeg",
          0.9
        );
      };
      img.onerror = () => reject(new Error("Failed to load selected image"));
      img.src = previewUrl;
    });
  }, [dataUrlToFile, getSafeCrop, isEditing, previewUrl, productName]);

  // Draw image on canvas when editing mode is enabled
  useEffect(() => {
    if (isEditing && canvasRef.current && previewUrl) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        const img = new Image();
        img.onload = () => {
          // Set canvas dimensions to match image
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw the image on canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          if (!cropData) {
            const side = Math.max(
              MIN_CROP_SIZE,
              Math.min(DEFAULT_CROP_SIZE, Math.min(canvas.width, canvas.height) * 0.7)
            );
            setCropData({
              x: Math.max(0, (canvas.width - side) / 2),
              y: Math.max(0, (canvas.height - side) / 2),
              width: side,
              height: side,
            });
          }
        };
        img.src = previewUrl;
      }
    }
  }, [cropData, getSafeCrop, isEditing, previewUrl]);

  // Upload to Cloudinary
  const uploadToCloudinary = useCallback(async (file: File): Promise<UploadResult> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary configuration missing. Please check environment variables.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "sandy-pos-products");

    console.warn("Uploading to Cloudinary:", {
      cloudName,
      uploadPreset,
      fileName: file.name,
      fileSize: file.size,
    });

    return new Promise<UploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
      xhr.timeout = 60000;

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const progress = Math.min(99, Math.round((event.loaded / event.total) * 100));
        setUploadProgress(progress);
      };

      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          console.error("Cloudinary upload failed:", xhr.status, xhr.responseText);
          reject(new Error(`Upload failed: ${xhr.status} - ${xhr.responseText}`));
          return;
        }

        try {
          const data = JSON.parse(xhr.responseText) as UploadResult;
          setUploadProgress(100);
          resolve(data);
        } catch {
          reject(new Error("Upload failed: invalid Cloudinary response"));
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed: network error"));
      xhr.ontimeout = () => reject(new Error("Upload timed out. Please try again."));

      xhr.send(formData);
    });
  }, []);

  // Save image to database
  const saveImageToDatabase = useCallback(
    async (imageUrl: string) => {
      const { error } = await supabase
        .from("products")
        .update({
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId);

      if (error) {
        throw error;
      }
    },
    [productId]
  );

  const processUpload = useCallback(
    async (file: File) => {
      try {
        // Validate file
        if (!file || file.size === 0) {
          throw new Error("Invalid file: File is empty or undefined");
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("File too large. Maximum size is 10MB.");
        }

        // Check file type
        if (!file.type.startsWith("image/")) {
          throw new Error("Invalid file type. Only images are allowed.");
        }

        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(file);

        // Save to database
        await saveImageToDatabase(uploadResult.secure_url);

        // Update parent component
        onImageUpdate(uploadResult.secure_url);

        // Reset state
        setPreviewUrl(null);
        setIsEditing(false);
        setCropData(null);
        setUploadProgress(0);
        setIsUploading(false);

        // Close modal after successful upload
        setTimeout(() => onClose(), 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [onClose, onImageUpdate, saveImageToDatabase, uploadToCloudinary]
  );

  // Handle image upload
  const handleUpload = useCallback(async () => {
    if (!previewUrl) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const file = await getEditedFile();
      await processUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [previewUrl, getEditedFile, processUpload]);

  // Handle crop
  const handleCrop = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const displayX = event.clientX - rect.left;
    const displayY = event.clientY - rect.top;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const centerX = displayX * scaleX;
    const centerY = displayY * scaleY;
    const side = Math.max(
      MIN_CROP_SIZE,
      Math.min(DEFAULT_CROP_SIZE, Math.min(canvas.width, canvas.height))
    );

    const x = Math.max(0, Math.min(centerX - side / 2, canvas.width - side));
    const y = Math.max(0, Math.min(centerY - side / 2, canvas.height - side));

    setCropData({ x, y, width: side, height: side });
  }, []);

  const cropHandles: Array<{
    key: ResizeHandle;
    className: string;
    cursor: string;
  }> = [
    { key: "nw", className: "-top-2 -left-2", cursor: "nwse-resize" },
    { key: "ne", className: "-top-2 -right-2", cursor: "nesw-resize" },
    { key: "sw", className: "-bottom-2 -left-2", cursor: "nesw-resize" },
    { key: "se", className: "-bottom-2 -right-2", cursor: "nwse-resize" },
    { key: "n", className: "-top-2 left-1/2 -translate-x-1/2", cursor: "ns-resize" },
    { key: "s", className: "-bottom-2 left-1/2 -translate-x-1/2", cursor: "ns-resize" },
    { key: "w", className: "-left-2 top-1/2 -translate-y-1/2", cursor: "ew-resize" },
    { key: "e", className: "-right-2 top-1/2 -translate-y-1/2", cursor: "ew-resize" },
  ];

  // Remove current image
  const handleRemoveImage = useCallback(async () => {
    try {
      await saveImageToDatabase("");
      onImageUpdate("");
      onClose();
    } catch (err) {
      setError("Failed to remove image");
    }
  }, [saveImageToDatabase, onImageUpdate, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          exit={{ scale: 0.9, opacity: 0 }}
          initial={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Edit Product Photo</h2>
            <button
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onClick={onClose}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Current Image */}
            {currentImageUrl && !previewUrl && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Current Image</h3>
                <div className="relative inline-block">
                  <CldImage
                    unoptimized
                    alt={productName}
                    className="w-48 h-48 object-cover rounded-lg border"
                    height={192}
                    src={currentImageUrl}
                    width={192}
                  />
                  <button
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    title="Remove image"
                    onClick={handleRemoveImage}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Upload Area */}
            {!previewUrl && (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">Upload Product Photo</p>
                <p className="text-sm text-gray-500 mb-4">
                  Drag and drop an image here, or click to select
                </p>
                <p className="text-xs text-gray-400">Supports JPG, PNG, GIF up to 5MB</p>
                <input
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  type="file"
                  onChange={handleFileSelect}
                />
              </div>
            )}

            {/* Preview and Edit */}
            {previewUrl && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">Edit Image</h3>
                  <button
                    className="bg-gray-500 text-white p-2 rounded-full hover:bg-gray-600 transition-colors"
                    title="Cancel"
                    onClick={() => {
                      setPreviewUrl(null);
                      setIsEditing(false);
                      setCropData(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="border rounded-lg p-4">
                  <div
                    ref={surfaceRef}
                    className="relative inline-block touch-none"
                    onPointerCancel={endCropInteraction}
                    onPointerMove={handleSurfacePointerMove}
                    onPointerUp={endCropInteraction}
                  >
                    <canvas
                      ref={canvasRef}
                      className="border rounded cursor-crosshair"
                      style={{ maxWidth: "100%", height: "auto" }}
                      onClick={handleCrop}
                    />

                    {cropOverlayStyle && (
                      <div
                        className="absolute border-2 border-blue-500 bg-blue-200/15 cursor-move"
                        style={{
                          left: `${cropOverlayStyle.left}px`,
                          top: `${cropOverlayStyle.top}px`,
                          width: `${cropOverlayStyle.width}px`,
                          height: `${cropOverlayStyle.height}px`,
                        }}
                        onPointerDown={(event) => startCropInteraction("move", event)}
                      >
                        {cropHandles.map((handle) => (
                          <button
                            key={handle.key}
                            aria-label={`Resize crop ${handle.key}`}
                            className={`absolute h-4 w-4 rounded-full border border-white bg-blue-500 ${handle.className}`}
                            style={{ cursor: handle.cursor }}
                            type="button"
                            onPointerDown={(event) =>
                              startCropInteraction("resize", event, handle.key)
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Drag the box to move it. Drag blue handles to resize. Click image to recenter.
                  </p>
                </div>

                {/* Upload Button */}
                <div className="flex gap-3">
                  <button
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    disabled={isUploading}
                    onClick={handleUpload}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading... {uploadProgress}%
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Save Image
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Progress Bar */}
            {isUploading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">Uploading... {uploadProgress}%</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

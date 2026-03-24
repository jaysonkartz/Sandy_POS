"use client";

import React, { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

type Props = {
  imageSrc: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (croppedBlob: Blob) => void | Promise<void>;
};

const createImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob failed"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.92
    );
  });
}

export default function ImageCropEditor({
  imageSrc,
  title = "Edit Image",
  isOpen,
  onClose,
  onConfirm,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      return;
    }

    setSaving(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);

      await onConfirm(blob);
    } catch (err) {
      console.error("[CropEditor] Error:", err);
      alert(err instanceof Error ? err.message : "Failed to crop image");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded px-4 py-2 text-gray-600 hover:bg-gray-100"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="relative h-[400px] w-full shrink-0">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { borderRadius: 8 },
            }}
          />
        </div>

        <div className="space-y-2 border-t p-4">
          <label className="block text-sm font-medium text-gray-700">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

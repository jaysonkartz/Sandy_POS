"use client";

import { CldUploadWidget } from "next-cloudinary";

export default function ProductMultiImageUpload({
  productId,
  onUploaded,
}: {
  productId: number;
  onUploaded: (urls: string[]) => void;
}) {
  return (
    <CldUploadWidget
      options={{
        multiple: true,
        maxFiles: 10,
        folder: `products/${productId}`,
      }}
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!}
      onSuccess={(result: any, { widget }) => {
        const info = result?.info;
        if (info?.secure_url) onUploaded([info.secure_url]);
      }}
    >
      {({ open }) => (
        <button
          className="px-3 py-2 rounded-md bg-blue-600 text-white"
          type="button"
          onClick={() => open()}
        >
          Upload Photos
        </button>
      )}
    </CldUploadWidget>
  );
}

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
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!}
      options={{
        multiple: true,
        maxFiles: 10,
        folder: `products/${productId}`,
      }}
      onSuccess={(result: any, { widget }) => {
        // Cloudinary fires once per file; easiest is to use "queuesEnd"
        // But quick approach: capture URL on each success and let parent handle batching if needed.
        const info = result?.info;
        if (info?.secure_url) onUploaded([info.secure_url]);
      }}
    >
      {({ open }) => (
        <button
          type="button"
          onClick={() => open()}
          className="px-3 py-2 rounded-md bg-blue-600 text-white"
        >
          Upload Photos
        </button>
      )}
    </CldUploadWidget>
  );
}
export { CldImage } from "next-cloudinary";

export const getCloudinaryCloudName = (): string =>
  (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "") as string;

export const getCloudinaryUploadPreset = (): string =>
  (process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "") as string;

export const isCloudinaryConfigured = (): boolean => {
  const name = getCloudinaryCloudName();
  const preset = getCloudinaryUploadPreset();
  return !!(name?.trim() && preset?.trim());
};

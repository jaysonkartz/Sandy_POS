export const IMAGE_PLACEHOLDER = "/product-placeholder.svg";

const CLOUDINARY_FOLDER = "sandy-pos-products";
const CLOUDINARY_BASE = "https://res.cloudinary.com/dkfpmot1j/image/upload";

function normalizePublicId(publicId?: string | null) {
  const trimmed = String(publicId || "").trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("http")) return trimmed;

  if (trimmed.startsWith(`${CLOUDINARY_FOLDER}/`)) return trimmed;

  return `${CLOUDINARY_FOLDER}/${trimmed}`;
}

export function toCloudinaryUrl(publicId?: string | null) {
  const normalized = normalizePublicId(publicId);
  if (!normalized) return "";
  if (normalized.startsWith("http")) return normalized;
  return `${CLOUDINARY_BASE}/${normalized}`;
}

export function resolveImageSrc(imageUrl?: string | null, publicId?: string | null) {
  const trimmedUrl = String(imageUrl || "").trim();
  const trimmedPublicId = String(publicId || "").trim();

  if (trimmedUrl) {
    if (trimmedUrl.startsWith("http")) return trimmedUrl;
    return toCloudinaryUrl(trimmedUrl);
  }

  if (trimmedPublicId) {
    return toCloudinaryUrl(trimmedPublicId);
  }

  return IMAGE_PLACEHOLDER;
}
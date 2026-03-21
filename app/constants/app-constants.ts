// UI constants
export const SCROLL_THRESHOLD = 100;
export const SEARCH_DEBOUNCE_DELAY = 300;
export const LOADING_TIMEOUT = 3000;
export const SESSION_TIMEOUT_MS = 4000;
export const LOGOUT_TIMEOUT_MS = SESSION_TIMEOUT_MS;
export const FORCE_LOADING_RESET_DELAY = SESSION_TIMEOUT_MS;

// Session constants
export const SESSION_REFRESH_INTERVAL = 60 * 1000; // 1 minute
export const SESSION_CHECK_INTERVAL = 30 * 1000; // 30 seconds
export const USER_ACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export const STORAGE_KEYS = {
  SESSION: "supabase_session",
  SUPABASE_PREFIX: "sb-",
} as const;

// WhatsApp constants
export const WHATSAPP_PHONE_NUMBER = "6593254825";
export const WHATSAPP_DEFAULT_MESSAGE = "Hi, I would like to inquire about your products.";

// Category mapping
export const CATEGORY_MAP: { [key: string]: string } = {
  "1": "Dried Chilli",
  "2": "Beans & Legumes",
  "3": "Nuts & Seeds",
  "4": "Herbs and Spices",
  "5": "Grains",
  "6": "Dried Seafood",
  "7": "Vegetables",
  "8": "Dried Mushroom & Fungus",
};

// User roles
export const USER_ROLES = {
  ADMIN: "ADMIN",
  CUSTOMER: "CUSTOMER",
  USER: "USER",
} as const;

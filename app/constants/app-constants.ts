// Session management constants
export const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
export const SESSION_CHECK_INTERVAL = 1 * 60 * 1000; // 1 minute
export const USER_ACTIVITY_TIMEOUT = 30 * 1000; // 30 seconds
export const SESSION_RETRY_DELAY = 1000; // 1 second
export const MAX_SESSION_RETRIES = 3;

// UI constants
export const SCROLL_THRESHOLD = 100;
export const SEARCH_DEBOUNCE_DELAY = 300;
export const LOADING_TIMEOUT = 3000;
export const FORCE_LOADING_RESET_DELAY = 5000;

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

// Local storage keys
export const STORAGE_KEYS = {
  SESSION: "sandy_pos_session",
  SUPABASE_PREFIX: "sb-",
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: "ADMIN",
  CUSTOMER: "CUSTOMER",
  USER: "USER",
} as const;

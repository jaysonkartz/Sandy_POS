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

// User roles
export const USER_ROLES = {
  ADMIN: "ADMIN",
  CUSTOMER: "CUSTOMER",
  USER: "USER",
} as const;

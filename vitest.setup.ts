import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage with support for Object.keys()
// Store keys as enumerable properties on the mock object itself
const store: Record<string, string> = {};

const localStorageMock: any = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => {
    store[key] = String(value);
    // Make the key enumerable on the mock object for Object.keys()
    Object.defineProperty(localStorageMock, key, {
      value: String(value),
      enumerable: true,
      configurable: true,
      writable: true,
    });
  },
  removeItem: (key: string) => {
    delete store[key];
    try {
      delete localStorageMock[key];
    } catch {
      // Ignore errors
    }
  },
  clear: () => {
    // Clear store
    Object.keys(store).forEach(key => {
      delete store[key];
      try {
        delete localStorageMock[key];
      } catch {
        // Ignore errors
      }
    });
  },
  get length() {
    return Object.keys(store).length;
  },
  key: (index: number) => {
    const keys = Object.keys(store);
    return keys[index] || null;
  },
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Mock window.open
window.open = vi.fn();

// Set environment variables for Supabase to prevent initialization errors
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';


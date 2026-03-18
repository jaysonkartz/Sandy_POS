import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSession } from "../useSession";
import { Session } from "@supabase/supabase-js";

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignOut = vi.fn();
const mockFromSelect = vi.fn();
const mockFromEq = vi.fn();
const mockFromSingle = vi.fn();

vi.mock("@/app/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
    from: vi.fn(() => ({
      select: mockFromSelect,
      eq: mockFromEq,
      single: mockFromSingle,
    })),
  },
}));

const buildSession = (overrides: Partial<Session> = {}): Session =>
  ({
    access_token: "token",
    refresh_token: "refresh",
    expires_at: 9999999999,
    expires_in: 3600,
    token_type: "bearer",

    user: {
      id: "user-1",
      email: "user@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-01-01T00:00:00.000Z",
    },

    ...overrides,
  }) as Session;

describe("useSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFromSelect.mockReturnValue({ eq: mockFromEq });
    mockFromEq.mockReturnValue({ single: mockFromSingle });
    mockFromSingle.mockResolvedValue({ data: { role: "ADMIN" }, error: null });

    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    mockGetSession.mockResolvedValue({
      data: { session: null },
    });
  });

  it("loads initial session and role", async () => {
    const session = buildSession();
    mockGetSession.mockResolvedValueOnce({ data: { session } });

    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.session?.user?.id).toBe("user-1");
    expect(result.current.userRole).toBe("ADMIN");
    expect(result.current.isSessionValid).toBe(true);
  });

  it("updates state on auth state changes", async () => {
    const session = buildSession();
    let authCallback: ((event: any, nextSession: Session | null) => void) | undefined;

    mockOnAuthStateChange.mockImplementation((cb: typeof authCallback) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      authCallback?.("SIGNED_IN", session);
    });

    await waitFor(() => expect(result.current.session?.user?.email).toBe("user@example.com"));
    expect(result.current.userRole).toBe("ADMIN");
  });

  it("forceRefreshSession resyncs from Supabase", async () => {
    const firstSession = buildSession({ user: { ...buildSession().user, id: "user-1" } as any });
    const secondSession = buildSession({ user: { ...buildSession().user, id: "user-2" } as any });

    mockGetSession
      .mockResolvedValueOnce({ data: { session: firstSession } })
      .mockResolvedValueOnce({ data: { session: secondSession } });

    const { result } = renderHook(() => useSession());
    await waitFor(() => expect(result.current.session?.user?.id).toBe("user-1"));

    await act(async () => {
      await result.current.forceRefreshSession();
    });

    expect(result.current.session?.user?.id).toBe("user-2");
  });

  it("signOut clears state", async () => {
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });

    try {
      const session = buildSession();
      mockGetSession.mockResolvedValueOnce({ data: { session } });

      const { result } = renderHook(() => useSession());
      await waitFor(() => expect(result.current.session?.user?.id).toBe("user-1"));

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(result.current.session).toBeNull();
      expect(result.current.userRole).toBe("");
      expect(window.location.href).toBe("/");
    } finally {
      Object.defineProperty(window, "location", {
        value: originalLocation,
        writable: true,
      });
    }
  });
});

"use client";

export default function ManagementDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto max-w-lg p-8 text-center">
      <h2 className="text-lg font-semibold text-gray-900">Dashboard failed to load</h2>
      <p className="mt-2 text-sm text-gray-600">{error.message}</p>
      <button
        className="mt-6 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        type="button"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}

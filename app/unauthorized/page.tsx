import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-red-600">Error 403</p>
        <h1 className="mb-3 text-3xl font-bold text-gray-900">Unauthorized</h1>
        <p className="mb-8 text-gray-600">
          You are signed in, but your account does not have permission to access this page.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Back to Home
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign in with another account
          </Link>
        </div>
      </div>
    </div>
  );
}

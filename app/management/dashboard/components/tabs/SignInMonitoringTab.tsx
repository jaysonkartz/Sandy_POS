"use client";

import { motion } from "framer-motion";
import QuickSignInCheck from "@/app/components/QuickSignInCheck";
import SignInStats from "@/app/components/SignInStats";

export default function SignInMonitoringTab() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Sign-in Monitoring</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        <div className="min-w-0 overflow-x-auto">
          <SignInStats title="Sign-in Statistics" />
        </div>
        <div className="min-w-0">
          <QuickSignInCheck limit={10} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        <div className="min-w-0">
          <QuickSignInCheck limit={10} showFailedOnly={true} />
        </div>
        <div className="min-w-0">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <a
                className="block w-full px-4 py-2 text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                href="/admin/signin-records"
              >
                View Full Sign-in History
              </a>
              <button
                className="block w-full px-4 py-2 text-left text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md"
                type="button"
                onClick={() => window.open("/admin/signin-records", "_blank")}
              >
                Export Sign-in Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

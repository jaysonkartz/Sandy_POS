"use client";

import React from "react";
import { motion } from "framer-motion";
import { CldImage } from "next-cloudinary";
import EditUserModal from "@/app/components/EditUserModal";
import type { User } from "../../types";

export type UsersTabProps = {
  users: User[];
  isLoading: boolean;
  currentUserPage: number;
  setCurrentUserPage: React.Dispatch<React.SetStateAction<number>>;
  totalUsers: number;
  usersPerPage: number;
  selectedUser: User | null;
  setSelectedUser: React.Dispatch<React.SetStateAction<User | null>>;
  isEditModalOpen: boolean;
  setIsEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  fetchUsers: (page?: number) => Promise<void>;
};

export default function UsersTab(props: UsersTabProps) {
  const {
    users,
    isLoading,
    currentUserPage,
    setCurrentUserPage,
    totalUsers,
    usersPerPage,
    selectedUser,
    setSelectedUser,
    isEditModalOpen,
    setIsEditModalOpen,
    fetchUsers,
  } = props;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">User Management</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.avatar_url ? (
                          <CldImage
                            alt={user.name || "User avatar"}
                            className="h-8 w-8 rounded-full object-cover"
                            height={32}
                            src={user.avatar_url}
                            width={32}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200" />
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "ADMIN"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-900" onClick={() => {}}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && users.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentUserPage === 1}
              onClick={() => setCurrentUserPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <button
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentUserPage >= Math.ceil(totalUsers / usersPerPage)}
              onClick={() =>
                setCurrentUserPage((prev) =>
                  Math.min(Math.ceil(totalUsers / usersPerPage), prev + 1)
                )
              }
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">{(currentUserPage - 1) * usersPerPage + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(currentUserPage * usersPerPage, totalUsers)}
                </span>{" "}
                of <span className="font-medium">{totalUsers}</span> results
              </p>
            </div>
            <div>
              <nav
                aria-label="Pagination"
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              >
                <button
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentUserPage === 1}
                  onClick={() => setCurrentUserPage((prev) => Math.max(1, prev - 1))}
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      clipRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      fillRule="evenodd"
                    />
                  </svg>
                </button>
                {Array.from({ length: Math.ceil(totalUsers / usersPerPage) }, (_, i) => i + 1)
                  .filter((page) => {
                    const totalPages = Math.ceil(totalUsers / usersPerPage);
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (page >= currentUserPage - 1 && page <= currentUserPage + 1) return true;
                    return false;
                  })
                  .map((page, index, array) => {
                    const totalPages = Math.ceil(totalUsers / usersPerPage);
                    const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                    const showEllipsisAfter =
                      index < array.length - 1 && array[index + 1] !== page + 1;

                    return (
                      <div key={page} className="flex items-center">
                        {showEllipsisBefore && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        )}
                        <button
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentUserPage === page
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                          onClick={() => setCurrentUserPage(page)}
                        >
                          {page}
                        </button>
                        {showEllipsisAfter && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        )}
                      </div>
                    );
                  })}
                <button
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentUserPage >= Math.ceil(totalUsers / usersPerPage)}
                  onClick={() =>
                    setCurrentUserPage((prev) =>
                      Math.min(Math.ceil(totalUsers / usersPerPage), prev + 1)
                    )
                  }
                >
                  <span className="sr-only">Next</span>
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      clipRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      fillRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      <EditUserModal
        isOpen={isEditModalOpen}
        user={selectedUser}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        onUpdate={() => {
          fetchUsers(currentUserPage);
        }}
      />
    </motion.div>
  );
}

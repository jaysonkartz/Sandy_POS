import React from "react";

interface ErrorStateProps {
  error: string;
  isEnglish: boolean;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, isEnglish, onRetry }) => {
  return (
    <div className="container mx-auto p-4">
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isEnglish ? "Error Loading Products" : "加载产品时出错"}
        </h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          onClick={onRetry}
        >
          {isEnglish ? "Try Again" : "重试"}
        </button>
      </div>
    </div>
  );
};

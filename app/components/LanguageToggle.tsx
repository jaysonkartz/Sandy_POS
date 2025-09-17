import React from "react";

interface LanguageToggleProps {
  isEnglish: boolean;
  onToggle: () => void;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ isEnglish, onToggle }) => {
  return (
    <button
      className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
      onClick={onToggle}
    >
      <span>{isEnglish ? "中文" : "English"}</span>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          d="M3 5h12M9 3v18m0-18l-4 4m4-4l4 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
      </svg>
    </button>
  );
};

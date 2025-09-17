import React from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  searchTerm: string;
  isEnglish: boolean;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  isEnglish,
  onSearchChange,
  onClearSearch,
}) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        aria-label={isEnglish ? "Search products" : "搜索产品"}
        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
        placeholder={isEnglish ? "Search products..." : "搜索产品..."}
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.currentTarget.blur();
            onClearSearch();
          }
        }}
      />
    </div>
  );
};

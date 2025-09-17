import React from "react";

interface SearchResultsInfoProps {
  searchTerm: string;
  resultsCount: number;
  isEnglish: boolean;
}

export const SearchResultsInfo: React.FC<SearchResultsInfoProps> = ({
  searchTerm,
  resultsCount,
  isEnglish,
}) => {
  if (!searchTerm) return null;

  return (
    <div className="mb-4 text-sm text-gray-600">
      {isEnglish ? "Search results for" : "搜索结果："} "{searchTerm}" - {resultsCount}{" "}
      {isEnglish ? "products" : "产品"}
    </div>
  );
};

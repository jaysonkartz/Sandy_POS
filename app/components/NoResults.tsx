import React from "react";
import { Search } from "lucide-react";

interface NoResultsProps {
  isEnglish: boolean;
}

export const NoResults: React.FC<NoResultsProps> = ({ isEnglish }) => {
  return (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-4">
        <Search className="w-16 h-16 mx-auto" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {isEnglish ? "No products found" : "未找到产品"}
      </h3>
      <p className="text-gray-500">
        {isEnglish
          ? "Try adjusting your search terms or category filter"
          : "请尝试调整搜索词或类别筛选"}
      </p>
    </div>
  );
};

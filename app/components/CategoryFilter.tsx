import React from "react";
import { CATEGORY_ID_NAME_MAP } from "@/app/(admin)/const/category";

interface CategoryFilterProps {
  selectedCategory: string;
  isEnglish: boolean;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  isEnglish,
  onCategoryChange,
}) => {
  return (
    <select
      className="p-2 border rounded-md"
      value={selectedCategory}
      onChange={(e) => onCategoryChange(e.target.value)}
    >
      <option value="all">{isEnglish ? "All Categories" : "所有类别"}</option>
      {Object.entries(CATEGORY_ID_NAME_MAP).map(([id, name]) => (
        <option key={id} value={id}>
          {name}
        </option>
      ))}
    </select>
  );
};

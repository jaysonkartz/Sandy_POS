import { BookmarkIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    created_at: string;
    imageUrl: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // Here you can add logic to save the bookmark state to your backend
  };

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
      <div className="relative aspect-square">
        <img
          alt={product.name}
          className="w-full h-full object-cover"
          src={product.imageUrl || "/placeholder-image.jpg"}
        />
        <button
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors duration-200"
          onClick={toggleBookmark}
        >
          {isBookmarked ? (
            <BookmarkSolidIcon className="w-5 h-5 text-rose-500" />
          ) : (
            <BookmarkIcon className="w-5 h-5 text-gray-600 hover:text-rose-500" />
          )}
        </button>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h2 className="text-lg font-medium text-gray-900 line-clamp-2">{product.name}</h2>
        <p className="text-sm text-gray-500">
          Added: {new Date(product.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

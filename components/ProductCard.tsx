import { BookmarkIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
    description: string;
    maxQuantity: number;
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // Here you can add logic to save the bookmark state to your backend
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
      <div className="relative aspect-square">
        <img
          src={product.image || '/placeholder-image.jpg'}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <button
          onClick={toggleBookmark}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors duration-200"
        >
          {isBookmarked ? (
            <BookmarkSolidIcon className="w-5 h-5 text-rose-500" />
          ) : (
            <BookmarkIcon className="w-5 h-5 text-gray-600 hover:text-rose-500" />
          )}
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-medium text-gray-900 line-clamp-2">{product.name}</h2>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">
            ${product.price.toFixed(2)}/kg
          </span>
          <span className="text-sm text-gray-500">
            Max: {product.maxQuantity}kg
          </span>
        </div>
      </div>
    </div>
  );
}
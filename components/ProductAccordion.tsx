'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

interface ProductAccordionProps {
  categories: Category[];
}

export default function ProductAccordion({ categories }: ProductAccordionProps) {
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    // Simulate API call - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleWhatsAppClick = (product: Product) => {
    // Format the message
    const message = `Hi, I'm interested in purchasing ${product.name} (${product.code}) priced at $${product.price.toFixed(2)}`;
    // Create WhatsApp URL - replace 1234567890 with your actual WhatsApp business number
    const whatsappUrl = `https://wa.me/1234567890?text=${encodeURIComponent(message)}`;
    // Open in new tab
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button 
          onClick={handleRefreshPrices}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          <svg 
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          {isRefreshing ? 'Refreshing...' : 'Refresh Prices'}
        </button>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="border rounded-lg overflow-hidden">
            <button
              className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={() => toggleCategory(category.id)}
            >
              <h2 className="text-xl font-semibold">{category.name}</h2>
              <span className="text-2xl">
                {openCategories.includes(category.id) ? '−' : '+'}
              </span>
            </button>
            
            {openCategories.includes(category.id) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {category.products.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <div className="relative w-full h-48 mb-4">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-gray-600 mb-2">${product.price.toFixed(2)}</p>
                    {product.description && (
                      <p className="text-sm text-gray-500 mb-4">{product.description}</p>
                    )}
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                        Add to Cart
                      </button>
                      <button 
                        onClick={() => handleWhatsAppClick(product)}
                        className="p-2 bg-[#25D366] text-white rounded hover:bg-[#128C7E] transition-colors"
                        title="Inquire via WhatsApp"
                      >
                        <svg 
                          className="w-6 h-6" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 
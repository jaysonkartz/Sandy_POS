"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import PriceEditor from "./PriceEditor";

interface Product {
  id: number;
  title: string;
  slug: string;
  imagesUrl: string;
  price: number;
  category: number;
  maxQuantity: number;
}

interface Category {
  id: number;
  name: string;
  name_ch: string;
  imageUrl: string;
  products: Product[];
}

export default function ProductAccordion({ categories }: { categories: Category[] }) {
  const [openCategories, setOpenCategories] = useState<number[]>([]);
  const [localProducts, setLocalProducts] = useState<{ [key: number]: number }>({});
  const { addToCart, cart } = useCart();

  const toggleCategory = (categoryId: number) => {
    setOpenCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handlePriceUpdate = (productId: number, newPrice: number) => {
    setLocalProducts((prev) => ({
      ...prev,
      [productId]: newPrice,
    }));
  };

  const getProductPrice = (product: Product) => {
    return localProducts[product.id] ?? product.price;
  };

  const getItemQuantityInCart = (productId: number) => {
    const item = cart.find((item) => item.id === productId);
    return item?.quantity || 0;
  };

  return (
    <div className="space-y-4 p-4">
      {categories.map((category) => (
        <div key={category.id} className="border rounded-lg overflow-hidden bg-white">
          <button
            className="w-full flex justify-between items-center p-4 hover:bg-gray-50"
            onClick={() => toggleCategory(category.id)}
          >
            <span className="text-xl font-semibold">
              {category.name} | {category.name_ch}
            </span>
            <span className="text-2xl">{openCategories.includes(category.id) ? "−" : "+"}</span>
          </button>

          {openCategories.includes(category.id) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 border-t">
              {category.products?.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative h-48 w-full">
                    <Image
                      fill
                      alt={product.title}
                      className="object-cover"
                      src={product.imagesUrl}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-lg mb-1">{product.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{product.slug}</p>
                    <div className="flex justify-between items-center mb-4">
                      <PriceEditor
                        currentPrice={getProductPrice(product)}
                        productId={product.id}
                        onPriceUpdate={(newPrice) => handlePriceUpdate(product.id, newPrice)}
                      />
                    </div>
                    <button
                      className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-colors
                        ${
                          getItemQuantityInCart(product.id) >= product.maxQuantity
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      disabled={getItemQuantityInCart(product.id) >= product.maxQuantity}
                      onClick={() =>
                        addToCart({
                          ...product,
                          price: getProductPrice(product),
                          quantity: 1,
                        })
                      }
                    >
                      Add to Cart
                    </button>
                    {getItemQuantityInCart(product.id) > 0 && (
                      <p className="text-sm text-center mt-2 text-gray-600">
                        {getItemQuantityInCart(product.id)} in cart
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

interface CategoryProps {
  name: string;
  products: Product[];
}

export default function ProductCategory({ name, products }: CategoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded-lg mb-4">
      <div
        className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-xl font-semibold">{name}</h2>
        <span>{isOpen ? "-" : "+"}</span>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
          {products.map((product) => (
            <div key={product.id} className="border rounded-lg p-4 text-center">
              <div className="relative w-full h-40 mb-2">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-gray-600">${product.price.toFixed(2)}</p>
              <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full">
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

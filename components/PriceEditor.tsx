"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface PriceEditorProps {
  productId: number;
  currentPrice: number;
  onPriceUpdate: (newPrice: number) => void;
}

export default function PriceEditor({ productId, currentPrice, onPriceUpdate }: PriceEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(currentPrice);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ price: price })
        .eq("id", productId);

      if (error) throw error;

      onPriceUpdate(price);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating price:", error);
      alert("Failed to update price");
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-600">$</span>
        <input
          className="w-24 px-2 py-1 border rounded"
          min="0"
          step="0.01"
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
        <button
          className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          disabled={isLoading}
          onClick={handleSubmit}
        >
          {isLoading ? "..." : "✓"}
        </button>
        <button
          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={() => {
            setPrice(currentPrice);
            setIsEditing(false);
          }}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xl font-bold">${currentPrice.toFixed(2)}</span>
      <button className="text-blue-500 hover:text-blue-700 p-1" onClick={() => setIsEditing(true)}>
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      </button>
    </div>
  );
}

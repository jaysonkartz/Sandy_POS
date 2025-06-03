import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface Price {
  id: string;
  name: string;
  price: number;
  category: string;
  created_at: string;
}

interface EditPriceModalProps {
  price: Price | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditPriceModal({ price, isOpen, onClose, onUpdate }: EditPriceModalProps) {
  const [formData, setFormData] = useState({
    name: price?.name || "",
    price: price?.price || 0,
    category: price?.category || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (price) {
      setFormData({
        name: price.name,
        price: price.price,
        category: price.category,
      });
    }
  }, [price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("prices")
        .update({
          name: formData.name,
          price: formData.price,
          category: formData.category,
        })
        .eq("id", price?.id);

      if (updateError) throw updateError;

      onUpdate();
      onClose();
    } catch (err) {
      console.error("Error updating price:", err);
      setError(err instanceof Error ? err.message : "Error updating price");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !price) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit Price</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Updating..." : "Update Price"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

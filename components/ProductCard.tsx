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
  return (
    <div className="bg-red-200 rounded-lg p-4">
      {/* Product Title */}
      <h2 className="font-semibold mb-2">{product.name}</h2>

      {/* Product Image */}
      <div className="mb-2">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-40 object-cover rounded"
        />
      </div>

      {/* Price */}
      <div className="text-right font-semibold mb-2">
        ${product.price.toFixed(2)}/kg
      </div>

      {/* Product Details */}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span>Availability:</span>
          <span>Yes</span>
        </div>

        <div className="flex justify-between">
          <span>Lead Time:</span>
          <span>13 Days</span>
        </div>

        <div className="flex justify-between">
          <span>Origin:</span>
          <span>Shandong, China</span>
        </div>

        <div className="flex justify-between">
          <span>MOQ:</span>
          <span>9 kg/bag</span>
        </div>

        {/* Quantity Selector */}
        <div className="flex justify-between items-center">
          <span>Quantity:</span>
          <div className="flex items-center gap-2">
            <button className="px-2 py-0.5 bg-white rounded">-</button>
            <span className="w-8 text-center">4</span>
            <button className="px-2 py-0.5 bg-white rounded">+</button>
          </div>
        </div>

        {/* Sub-Total */}
        <div className="flex justify-between font-semibold">
          <span>Sub-Total:</span>
          <span>727.92</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-2">
          <button className="flex-1 px-3 py-1 bg-green-500 text-white rounded text-sm">
            Make Offer
          </button>
          <button className="flex-1 px-3 py-1 bg-blue-500 text-white rounded text-sm">
            Add to Cart
          </button>
        </div>

        {/* Customer Service Button */}
        <button className="w-full flex items-center justify-center gap-2 px-3 py-1 bg-green-600 text-white rounded text-sm mt-2">
          <span>Customer Service</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487
        </button>
      </div>
    </div>
  );
} 
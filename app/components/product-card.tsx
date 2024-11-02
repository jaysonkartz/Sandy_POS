interface ProductCardProps {
  product: {
    id: number;
    name: string;
    created_at: string;
    imageUrl: string;
  };

}

export function ProductCard({ product }: ProductCardProps) {
  console.log(product)
  return (
    <div className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <div className="relative w-full h-48">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
        <p className="text-gray-600">
          Added: {new Date(product.created_at).toLocaleDateString()}
        </p>
      </div>
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
        <p className="text-gray-600">
          Added: {new Date(product.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
} 
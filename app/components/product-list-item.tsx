import Image from "next/image";

interface Product {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
}

interface ProductListItemProps {
  product: Product;
}

export function ProductListItem({ product }: ProductListItemProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="relative w-full h-[150px]">
        <Image fill alt={product.title} className="object-cover" src={product.imageUrl} />
      </div>
      <div className="p-4">
        <h2 className="font-bold">{product.title}</h2>
        <p className="text-gray-600">${product.price}</p>
      </div>
    </div>
  );
}

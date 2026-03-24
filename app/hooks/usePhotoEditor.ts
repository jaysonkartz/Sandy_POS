import { useState, useCallback } from "react";

interface Product {
  id: number;
  "Item Code": string;
  Product: string;
  Category: string;
  weight: string;
  UOM: string;
  Country: string;
  Product_CH?: string;
  Category_CH?: string;
  Country_CH?: string;
  Variation?: string;
  Variation_CH?: string;
  price: number;
  uom: string;
  stock_quantity: number;
  image_url?: string;
}

interface UsePhotoEditorReturn {
  isPhotoEditorOpen: boolean;
  selectedProductForPhoto: Product | null;
  openPhotoEditor: (product: Product) => void;
  closePhotoEditor: () => void;
  handleImageUpdate: (
    productId: number,
    imageUrl: string,
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  ) => void;
}

export const usePhotoEditor = (): UsePhotoEditorReturn => {
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [selectedProductForPhoto, setSelectedProductForPhoto] = useState<Product | null>(null);

  const openPhotoEditor = useCallback((product: Product) => {
    setSelectedProductForPhoto(product);
    setIsPhotoEditorOpen(true);
  }, []);

  const closePhotoEditor = useCallback(() => {
    setIsPhotoEditorOpen(false);
    setSelectedProductForPhoto(null);
  }, []);

  const handleImageUpdate = useCallback(
    (
      productId: number,
      imageUrl: string,
      setProducts: React.Dispatch<React.SetStateAction<Product[]>>
    ) => {
      setProducts((prevProducts) =>
        prevProducts.map((p) => (p.id === productId ? { ...p, image_url: imageUrl } : p))
      );
    },
    []
  );

  return {
    isPhotoEditorOpen,
    selectedProductForPhoto,
    openPhotoEditor,
    closePhotoEditor,
    handleImageUpdate,
  };
};

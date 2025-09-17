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
  handleImageUpdate: (imageUrl: string, setProducts: React.Dispatch<React.SetStateAction<Product[]>>) => void;
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

  const handleImageUpdate = useCallback((imageUrl: string, setProducts: React.Dispatch<React.SetStateAction<Product[]>>) => {
    if (selectedProductForPhoto) {
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p.id === selectedProductForPhoto.id ? { ...p, image_url: imageUrl } : p
        )
      );
    }
  }, [selectedProductForPhoto]);

  return {
    isPhotoEditorOpen,
    selectedProductForPhoto,
    openPhotoEditor,
    closePhotoEditor,
    handleImageUpdate,
  };
};

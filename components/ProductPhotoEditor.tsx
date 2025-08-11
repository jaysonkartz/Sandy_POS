"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Edit3, Camera, Image as ImageIcon, Loader2, Check, Trash2 } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";

interface ProductPhotoEditorProps {
  productId: number;
  productName: string;
  currentImageUrl?: string;
  onImageUpdate: (imageUrl: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface UploadResult {
  secure_url: string;
  public_id: string;
}

export default function ProductPhotoEditor({
  productId,
  productName,
  currentImageUrl,
  onImageUpdate,
  onClose,
  isOpen
}: ProductPhotoEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cropData, setCropData] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);



  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setIsEditing(true);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
        setIsEditing(true);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  // Draw image on canvas when editing mode is enabled
  useEffect(() => {
    if (isEditing && canvasRef.current && previewUrl) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          // Set canvas dimensions to match image
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw the image on canvas
          ctx.drawImage(img, 0, 0);
        };
        img.src = previewUrl;
      }
    }
  }, [isEditing, previewUrl]);

  // Upload to Cloudinary
  const uploadToCloudinary = useCallback(async (file: File): Promise<UploadResult> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration missing. Please check environment variables.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'sandy-pos-products');

    console.log('Uploading to Cloudinary:', { cloudName, uploadPreset, fileName: file.name, fileSize: file.size });

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload failed:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }, []);

  // Save image to database
  const saveImageToDatabase = useCallback(async (imageUrl: string) => {
    const { error } = await supabase
      .from('products')
      .update({ 
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (error) {
      throw error;
    }
  }, [supabase, productId]);

  // Handle image upload
  const handleUpload = useCallback(async () => {
    if (!previewUrl) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      let file: File;
      
      if (isEditing && canvasRef.current) {
        // Draw the image on canvas before converting to blob
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Create a temporary image to get dimensions
          const img = new Image();
          img.onload = async () => {
            // Set canvas dimensions to match image
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw the image on canvas
            ctx.drawImage(img, 0, 0);
            
            // Convert to blob
            canvas.toBlob(async (blob) => {
              if (blob) {
                file = new File([blob], `${productName}-${Date.now()}.jpg`, { type: 'image/jpeg' });
                await processUpload(file);
              }
            }, 'image/jpeg', 0.9);
          };
          img.src = previewUrl;
        } else {
          // Fallback to original file if canvas context fails
          const response = await fetch(previewUrl);
          const blob = await response.blob();
          file = new File([blob], `${productName}-${Date.now()}.jpg`, { type: 'image/jpeg' });
          await processUpload(file);
        }
      } else {
        // Use original file
        const response = await fetch(previewUrl);
        const blob = await response.blob();
        file = new File([blob], `${productName}-${Date.now()}.jpg`, { type: 'image/jpeg' });
        await processUpload(file);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
    }
  }, [previewUrl, isEditing, productName]);

  const processUpload = async (file: File) => {
    try {
      // Validate file
      if (!file || file.size === 0) {
        throw new Error('Invalid file: File is empty or undefined');
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 10MB.');
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Invalid file type. Only images are allowed.');
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Save to database
      await saveImageToDatabase(uploadResult.secure_url);

      // Update parent component
      onImageUpdate(uploadResult.secure_url);

      // Reset state
      setPreviewUrl(null);
      setIsEditing(false);
      setUploadProgress(0);
      setIsUploading(false);

      // Close modal after successful upload
      setTimeout(() => onClose(), 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle crop
  const handleCrop = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setCropData({ x, y, width: 200, height: 200 });
  }, []);

  // Remove current image
  const handleRemoveImage = useCallback(async () => {
    try {
      await saveImageToDatabase('');
      onImageUpdate('');
      onClose();
    } catch (err) {
      setError('Failed to remove image');
    }
  }, [saveImageToDatabase, onImageUpdate, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Edit Product Photo</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Current Image */}
            {currentImageUrl && !previewUrl && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Current Image</h3>
                <div className="relative inline-block">
                  <img
                    src={currentImageUrl}
                    alt={productName}
                    className="w-48 h-48 object-cover rounded-lg border"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Upload Area */}
            {!previewUrl && (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Upload Product Photo
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Drag and drop an image here, or click to select
                </p>
                <p className="text-xs text-gray-400">
                  Supports JPG, PNG, GIF up to 5MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Preview and Edit */}
            {previewUrl && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Preview</h3>
                
                {/* Image Preview */}
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full h-auto rounded-lg border"
                  />
                  
                  {/* Edit Controls */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                      title="Edit image"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setPreviewUrl(null);
                        setIsEditing(false);
                        setCropData(null);
                      }}
                      className="bg-gray-500 text-white p-2 rounded-full hover:bg-gray-600 transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                                 {/* Canvas for editing */}
                 {isEditing && (
                   <div className="border rounded-lg p-4">
                     <h4 className="text-sm font-medium text-gray-700 mb-3">Edit Image</h4>
                     <canvas
                       ref={canvasRef}
                       className="border rounded cursor-crosshair"
                       onClick={handleCrop}
                       style={{ maxWidth: '100%', height: 'auto' }}
                     />
                     <p className="text-xs text-gray-500 mt-2">
                       Click on the image to set crop area
                     </p>
                   </div>
                 )}

                {/* Upload Button */}
                <div className="flex gap-3">
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading... {uploadProgress}%
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Save Image
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Progress Bar */}
            {isUploading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 
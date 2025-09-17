import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, FileText, Upload, MessageSquare } from "lucide-react";

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

interface OrderReviewProps {
  isOpen: boolean;
  isEnglish: boolean;
  selectedProducts: { product: Product; quantity: number }[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirmOrder: (reviewData: {
    remarks: string;
    purchaseOrder: string;
    uploadedFiles: File[];
  }) => void;
  onBackToEdit: () => void;
}

export const OrderReview = ({
  isOpen,
  isEnglish,
  selectedProducts,
  customerName,
  customerPhone,
  customerAddress,
  isSubmitting,
  onClose,
  onConfirmOrder,
  onBackToEdit,
}: OrderReviewProps) => {
  const [remarks, setRemarks] = useState("");
  const [purchaseOrder, setPurchaseOrder] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const subtotal = selectedProducts.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  
  const gstRate = 0.09; // 9% GST
  const gstAmount = subtotal * gstRate;
  const totalAmount = subtotal + gstAmount;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            animate={{ x: 0 }}
            className="w-full max-w-md bg-white h-full p-4 overflow-y-auto"
            exit={{ x: "100%" }}
            initial={{ x: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{isEnglish ? "Review Order" : "审核订单"}</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Information */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">{isEnglish ? "Customer Details" : "客户详情"}</h3>
              <p className="text-sm"><strong>{isEnglish ? "Name" : "姓名"}:</strong> {customerName}</p>
              <p className="text-sm"><strong>{isEnglish ? "Phone" : "电话"}:</strong> {customerPhone}</p>
              <p className="text-sm"><strong>{isEnglish ? "Address" : "地址"}:</strong> {customerAddress}</p>
            </div>

            {/* Order Items */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">{isEnglish ? "Order Items" : "订单项目"}</h3>
              {selectedProducts.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between items-center py-2 border-b">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {isEnglish ? product.Product : product.Product_CH}
                    </p>
                    <p className="text-xs text-gray-600">
                      {quantity} x ${product.price.toFixed(2)}/{product.UOM}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      ${(product.price * quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Order Summary */}
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between text-sm mb-1">
                  <span>{isEnglish ? "Subtotal:" : "小计:"}</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{isEnglish ? "GST (9%):" : "消费税 (9%):"}</span>
                  <span>${gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>{isEnglish ? "Total:" : "总计:"}</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500 text-right mt-1">w gst</p>
              </div>
            </div>

            {/* Remarks Section */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4" />
                <h3 className="font-semibold">{isEnglish ? "Remarks" : "备注"}</h3>
              </div>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-2 border rounded-md resize-none"
                rows={3}
                placeholder={isEnglish ? "Enter any special instructions..." : "输入任何特殊说明..."}
              />
            </div>

            {/* Purchase Order Section */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                <h3 className="font-semibold">{isEnglish ? "Purchase Order" : "采购订单"}</h3>
              </div>
              <input
                type="text"
                value={purchaseOrder}
                onChange={(e) => setPurchaseOrder(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder={isEnglish ? "Enter PO number..." : "输入采购订单号..."}
              />
            </div>

            {/* Upload Section */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-4 h-4" />
                <h3 className="font-semibold">{isEnglish ? "Upload" : "上传"}</h3>
              </div>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="w-full p-2 border rounded-md mb-2"
              />
              {uploadedFiles.length > 0 && (
                <div className="space-y-1">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded border">
                      <span className="truncate">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={onBackToEdit}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {isEnglish ? "Back to Edit" : "返回编辑"}
              </button>
              <button
                onClick={() => onConfirmOrder({
                  remarks,
                  purchaseOrder,
                  uploadedFiles
                })}
                className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEnglish ? "Confirming..." : "确认中..."}
                  </>
                ) : (
                  <>{isEnglish ? "Confirm Order" : "确认订单"}</>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderReview;

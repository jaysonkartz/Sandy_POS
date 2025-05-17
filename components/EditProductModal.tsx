// import { useState } from 'react';
// import { motion } from 'framer-motion';
// import type { Product } from './PricingManagement';

// interface EditProductModalProps {
//   product: Product;
//   onClose: () => void;
//   onUpdate: (productId: number, updatedData: Partial<Product>) => Promise<void>;
// }

// export default function EditProductModal({ product, onClose, onUpdate }: EditProductModalProps) {
//   const [editedProduct, setEditedProduct] = useState({ ...product });

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onUpdate(product.id, editedProduct);
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//       <motion.div
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full"
//       >
//         <h2 className="text-xl font-bold mb-4">Edit Product</h2>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">
//               Product Name
//             </label>
//             <input
//               type="text"
//               id="edit-title"
//               value={editedProduct.title}
//               onChange={(e) => setEditedProduct({ ...editedProduct, title: e.target.value })}
//               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Price</label>
//             <input
//               type="number"
//               value={editedProduct.price}
//               onChange={(e) => setEditedProduct({ ...editedProduct, price: Number(e.target.value) })}
//               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Max Quantity</label>
//             <input
//               type="number"
//               value={editedProduct.maxQuantity}
//               onChange={(e) => setEditedProduct({ ...editedProduct, maxQuantity: Number(e.target.value) })}
//               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">MOQ</label>
//             <input
//               type="number"
//               value={editedProduct.moq}
//               onChange={(e) => setEditedProduct({ ...editedProduct, moq: Number(e.target.value) })}
//               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Availability</label>
//             <input
//               type="checkbox"
//               checked={editedProduct.availability}
//               onChange={(e) => setEditedProduct({ ...editedProduct, availability: e.target.checked })}
//               className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//             />
//           </div>
//           <div className="flex justify-end space-x-3 mt-6">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
//             >
//               Save Changes
//             </button>
//           </div>
//         </form>
//       </motion.div>
//     </div>
//   );
// } 
"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";
import Image from "next/image";
import { Tag, Search, ShoppingCart, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { Session } from "@supabase/supabase-js";
import { AuthChangeEvent } from "@supabase/supabase-js";
import SignupModal from "@/components/SignupModal";

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
}

const CATEGORY_ID_NAME_MAP: { [key: string]: string } = {
  1: "Dried Chilli",
  2: "Beans & Legumes",
  3: "Nuts & Seeds",
  4: "Herbs and Spices",
  5: "Grains",
  6: "Dried Seafood",
  7: "Vegetables",
  8: "Dried Mushroom & Fungus"
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isEnglish, setIsEnglish] = useState(true);
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<
    { product: Product; quantity: number }[]
  >([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [expandedCountries, setExpandedCountries] = useState<string[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<number[]>([]);
  const [countryMap, setCountryMap] = useState<{ [key: string]: { name: string; chineseName: string } }>({});
  const [selectedOptions, setSelectedOptions] = useState<{ [title: string]: { variation?: string; countryId?: string; weight?: string } }>({});
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { addToCart, cart, updateQuantity } = useCart();
  const [session, setSession] = useState<any>(null);
  const router = useRouter();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  interface ProductGroup {
    title: string;
    products: Product[];
  }

  const productGroups = useMemo(() => {
    const groups: { [title: string]: Product[] } = {};
    products.forEach((p) => {
      const title = isEnglish ? p.Product : (p.Product_CH || p.Product);
      if (!groups[title]) {
        groups[title] = [];
      }
      groups[title].push(p);
    });
    return Object.values(groups).map((products) => ({
      title: isEnglish ? products[0].Product : (products[0].Product_CH || products[0].Product),
      products,
    }));
  }, [products, isEnglish]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        let query = supabase.from("products").select("*");

        if (selectedCategory !== "all") {
          query = query.eq("Category", String(selectedCategory));
        }

        const { data, error } = await query;
        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [supabase, selectedCategory]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function fetchCountries() {
      try {
        const { data, error } = await supabase
          .from("countries")
          .select("*");
        
        if (error) throw error;
        
        const countryMapping: { [key: string]: { name: string; chineseName: string } } = {};
        data?.forEach((country: any) => {
          countryMapping[country.id] = {
            name: country.country,
            chineseName: country.chineseName
          };
        });
        
        setCountryMap(countryMapping);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    }

    fetchCountries();
  }, [supabase]);

  // Get category name by id
  const getCategoryName = (category: string | number) => {
    return CATEGORY_ID_NAME_MAP[String(category)] || "Unknown Category";
  };

  // Get category Chinese name
  const getCategoryChineseName = (category: string) => {
    // Map the category value to the correct folder name
    const categoryMap: { [key: string]: string } = {
      "1": "Dried Chilli",
      "2": "Beans & Legumes",
      "3": "Nuts & Seeds",
      "4": "Herbs and Spices",
      "5": "Grains",
      "6": "Dried Seafood",
      "7": "Vegetables",
      "8": "Dried Mushroom & Fungus"
    };
    return categoryMap[category] || "Unknown Category";
  };

  //Send Whatsapp enquiry
  const handleCustomerService = () => {
    const phoneNumber = "6593254825";
    const message = "Hi, I would like to inquire about your products.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  //Add to order
  const handleAddToOrder = (product: Product) => {
    const existingProduct = selectedProducts.find((item) => item.product.id === product.id);
    if (existingProduct) {
      setSelectedProducts((prev) =>
        prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setSelectedProducts((prev) => [...prev, { product, quantity: 1 }]);
    }
  };

  //Update quantity
  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      setSelectedProducts((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      setSelectedProducts((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  //Send Whatsapp notification after submit order
  const sendWhatsAppNotification = (orderDetails: {
    orderId: number;
    customerName: string;
    totalAmount: number;
    items: Array<{
      productName: string;
      quantity: number;
      price: number;
    }>;
  }) => {
    // Format the message
    const message = `
🛍️ New Order Notification
Order ID: ${orderDetails.orderId}
Customer: ${orderDetails.customerName}
Total Amount: $${orderDetails.totalAmount.toFixed(2)}

Order Items:
${orderDetails.items
  .map((item) => `- ${item.productName} x ${item.quantity} @ $${item.price.toFixed(2)}`)
  .join("\n")}

Please check the admin panel for more details.
    `.trim();

    // Create WhatsApp URL (using your business phone number)
    const phoneNumber = "6593254825"; // Replace with your business phone number
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp in a new window
    window.open(whatsappUrl, "_blank");
  };

  const handleSubmitOrder = async () => {
    // Check if user is authenticated
    if (!session) {
      alert(isEnglish ? "Please log in to submit an order" : "请登录以提交订单");
      return;
    }

    if (selectedProducts.length === 0) {
      alert(
        isEnglish ? "Please add at least one product to the order" : "请至少添加一个产品到订单"
      );
      return;
    }

    if (!customerName || !customerPhone) {
      alert(
        isEnglish ? "Please provide customer name and phone number" : "请提供客户姓名和电话号码"
      );
      return;
    }

    try {
      // Calculate total amount
      const totalAmount = selectedProducts.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );

      // Create order with user_id
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            status: "pending",
            total_amount: totalAmount,
            created_at: new Date().toISOString(),
            user_id: session.user.id,
            customer_name: customerName,
            customer_phone: customerPhone,
          },
        ])
        .select()
        .single();

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw orderError;
      }

      // Create order items
      const orderItems = selectedProducts.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        total_price: item.product.price * item.quantity,
        product_name: isEnglish ? item.product.Product : item.product.Product_CH,
        product_code: item.product["Item Code"] || "N/A",
        created_at: new Date().toISOString(),
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

      if (itemsError) {
        console.error("Error creating order items:", itemsError);
        throw itemsError;
      }

      // Send WhatsApp notification
      sendWhatsAppNotification({
        orderId: order.id,
        customerName,
        totalAmount,
        items: selectedProducts.map((item) => ({
          productName: isEnglish
            ? item.product.Product
            : item.product.Product_CH || item.product.Product,
          quantity: item.quantity,
          price: item.product.price,
        })),
      });

      // Reset form and close panel
      setSelectedProducts([]);
      setCustomerName("");
      setCustomerPhone("");
      setIsOrderPanelOpen(false);

      // Show success message
      alert(isEnglish ? "Order submitted successfully!" : "订单提交成功！");
    } catch (error) {
      console.error("Error submitting order:", error);
      alert(isEnglish ? "Error submitting order. Please try again." : "提交订单时出错，请重试。");
    }
  };

  const toggleCountryExpansion = (country: string) => {
    setExpandedCountries((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]
    );
  };

  const toggleProductExpansion = (productId: number) => {
    setExpandedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Get unique countries and sort them
  const uniqueCountries = Array.from(new Set(products.map((p) => p.Country))).sort();

  return (
    <div className="container mx-auto p-4">
      {/* Language Toggle and Category Filter */}
      <div className="flex justify-between items-center mb-6">
        <button
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
          onClick={() => setIsEnglish(!isEnglish)}
        >
          <span>{isEnglish ? "中文" : "English"}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M3 5h12M9 3v18m0-18l-4 4m4-4l4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </button>

        <select
          className="p-2 border rounded-md"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_ID_NAME_MAP).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {productGroups.map((group) => {
          const { title, products: groupProducts } = group;

          // Helper to get selected product based on dropdowns
          const getSelectedProduct = () => {
            const selected = selectedOptions[title] || {};
            let product = groupProducts.find(p => 
              (!selected.variation || p.Variation === selected.variation) &&
              (!selected.countryId || p.Country === selected.countryId) &&
              (!selected.weight || p.weight === selected.weight)
            );
            return product || groupProducts[0];
          };

          const product = getSelectedProduct();
          const cartItem = cart.find((item) => item.id === product.id);

          const variations = [...new Set(groupProducts.map(p => p.Variation).filter(Boolean))];
          const origins = [...new Set(groupProducts.map(p => p.Country).filter(Boolean))];
          const weights = [...new Set(groupProducts.map(p => p.weight).filter(Boolean))];

          const handleOptionChange = (type: 'variation' | 'countryId' | 'weight', value: string) => {
            setSelectedOptions(prev => ({
              ...prev,
              [title]: {
                ...prev[title],
                [type]: value,
              }
            }));
          };

          return (
            <div key={title} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl">
              {/* Product Image */}
              <div className="relative h-48 bg-gray-100">
                <img
                  alt={product.Product}
                  className="w-full h-full object-cover"
                  src={`/Img/${getCategoryName(product.Category)}/${product.Product}${product.Variation ? ` (${product.Variation})` : ''}.png`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.dataset.fallbackAttempted) {
                      target.dataset.fallbackAttempted = 'true';
                      target.src = `/Img/${getCategoryName(product.Category)}/${product.Product}.png`;
                    } else if (!target.dataset.placeholderAttempted) {
                      target.dataset.placeholderAttempted = 'true';
                      target.src = "/product-placeholder.png";
                    }
                  }}
                />
              </div>

              {/* Product Info */}
              <div className="p-4 flex flex-col flex-grow">
                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-gray-800 truncate">
                    {isEnglish ? product.Product : product.Product_CH}
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">{product["Item Code"]}</p>

                  {/* Dropdowns */}
                  <div className="space-y-2 mb-4">
                    {variations.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">{isEnglish ? "Variation" : "规格"}</label>
                        <select
                          className="w-full p-2 mt-1 text-sm border-gray-200 border bg-gray-50 rounded-md focus:border-blue-500 focus:ring-blue-500 transition"
                          value={selectedOptions[title]?.variation || variations[0]}
                          onChange={(e) => handleOptionChange('variation', e.target.value)}
                        >
                          {variations.map(v => (
                            <option key={v} value={v}>{isEnglish ? v : (groupProducts.find(p=>p.Variation === v)?.Variation_CH || v)}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {origins.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">{isEnglish ? "Origin" : "产地"}</label>
                        <select
                           className="w-full p-2 mt-1 text-sm border-gray-200 border bg-gray-50 rounded-md focus:border-blue-500 focus:ring-blue-500 transition"
                           value={selectedOptions[title]?.countryId || origins[0]}
                           onChange={(e) => handleOptionChange('countryId', e.target.value)}
                        >
                          {origins.map(o => (
                            <option key={o} value={o}>{isEnglish ? (countryMap[o]?.name || o) : (countryMap[o]?.chineseName || o)}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {weights.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">{isEnglish ? "Weight" : "重量"}</label>
                        <select
                           className="w-full p-2 mt-1 text-sm border-gray-200 border bg-gray-50 rounded-md focus:border-blue-500 focus:ring-blue-500 transition"
                           value={selectedOptions[title]?.weight || weights[0]}
                           onChange={(e) => handleOptionChange('weight', e.target.value)}
                        >
                          {weights.map(w => (
                            <option key={w} value={w}>{w}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  {session && (
                    <div className="mb-4">
                      <p className="text-2xl font-extrabold text-gray-800">
                        ${product.price.toFixed(2)}
                        <span className="text-base font-medium text-gray-500">/{product.UOM}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-auto pt-4 border-t border-gray-100">
                  {!session ? (
                     <button
                        className="w-full text-center text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                        onClick={() => setIsSignupModalOpen(true)}
                      >
                        {isEnglish ? "Login to see price" : "登录查看价格"}
                      </button>
                  ) : (
                    <div className="flex items-center justify-between space-x-2">
                      {selectedProducts.find(p => p.product.id === product.id) ? (
                         <div className="flex items-center space-x-2 w-full">
                            <button
                              className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                              onClick={() => handleUpdateQuantity(product.id, (selectedProducts.find(p => p.product.id === product.id)?.quantity || 0) - 1)}
                            >
                              -
                            </button>
                            <span className="flex-grow text-center font-semibold">{selectedProducts.find(p => p.product.id === product.id)?.quantity}</span>
                            <button
                              className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                              onClick={() => handleUpdateQuantity(product.id, (selectedProducts.find(p => p.product.id === product.id)?.quantity || 0) + 1)}
                            >
                              +
                            </button>
                          </div>
                      ) : (
                         <button
                            className="flex-1 flex items-center justify-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-semibold"
                            onClick={() => handleAddToOrder(product)}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {isEnglish ? "Add to Order" : "添加到订单"}
                          </button>
                      )}
                      <button
                        className="flex-shrink-0 bg-gray-100 text-gray-600 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors"
                        onClick={() => handleCustomerService()}
                        title={isEnglish ? "Inquire" : "询价"}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Order Button */}
      {selectedProducts.length > 0 && (
        <motion.button
          animate={{ scale: 1 }}
          className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-40"
          initial={{ scale: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOrderPanelOpen(true)}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{isEnglish ? "View Order" : "查看订单"}</span>
            <span className="bg-white text-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              {selectedProducts.length}
            </span>
          </div>
        </motion.button>
      )}

      {/* Order Panel */}
      {isOrderPanelOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOrderPanelOpen(false);
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
              <h2 className="text-xl font-semibold">{isEnglish ? "Create Order" : "创建订单"}</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsOrderPanelOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Customer Information */}
            <div className="mb-4 space-y-3">
              <h3 className="font-semibold">{isEnglish ? "Customer Information" : "客户信息"}</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isEnglish ? "Customer Name" : "客户姓名"}
                  </label>
                  <input
                    required
                    className="w-full p-2 border rounded-md"
                    placeholder={isEnglish ? "Enter customer name" : "输入客户姓名"}
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isEnglish ? "Phone Number" : "电话号码"}
                  </label>
                  <input
                    required
                    className="w-full p-2 border rounded-md"
                    placeholder={isEnglish ? "Enter phone number" : "输入电话号码"}
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {selectedProducts.length > 0 && (
              <div className="mb-4 space-y-2">
                <h3 className="font-semibold mb-2">
                  {isEnglish ? "Selected Products" : "已选产品"}
                </h3>
                {selectedProducts.map(({ product, quantity }) => (
                  <div key={product.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium">
                        {isEnglish ? product.Product : product.Product_CH}
                      </p>
                      <span className="text-sm text-gray-600">
                        ${product.price.toFixed(2)}/{product.UOM}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                          onClick={() => handleUpdateQuantity(product.id, quantity - 1)}
                        >
                          -
                        </button>
                        <span className="text-sm">{quantity}</span>
                        <button
                          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                          onClick={() => handleUpdateQuantity(product.id, quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="text-red-500 hover:text-red-700 text-sm"
                        onClick={() => handleUpdateQuantity(product.id, 0)}
                      >
                        {isEnglish ? "Remove" : "移除"}
                      </button>
                    </div>
                  </div>
                ))}
                <div className="text-right font-semibold mt-2">
                  {isEnglish ? "Total:" : "总计:"} $
                  {selectedProducts
                    .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
                    .toFixed(2)}
                </div>
              </div>
            )}

            <button
              className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
              disabled={selectedProducts.length === 0}
              onClick={handleSubmitOrder}
            >
              {isEnglish ? "Submit Order" : "提交订单"}
            </button>
          </motion.div>
        </div>
      )}

      {/* Scroll to Top Arrow */}
      {showScrollTop && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-20 right-4 z-50 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* Signup Modal */}
      <SignupModal 
        isOpen={isSignupModalOpen} 
        onClose={() => setIsSignupModalOpen(false)} 
      />
    </div>
  );
}

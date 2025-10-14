"use client";

import React, { useState, useCallback, useEffect } from "react";
import SignupModal from "@/components/SignupModal";
import ProductPhotoEditor from "@/components/ProductPhotoEditor";

// Components
import { LoadingSkeleton } from "@/app/components/LoadingSkeleton";
import { ErrorState } from "@/app/components/ErrorState";
import { NoResults } from "@/app/components/NoResults";
import { LanguageToggle } from "@/app/components/LanguageToggle";
import { SearchBar } from "@/app/components/SearchBar";
import { CategoryFilter } from "@/app/components/CategoryFilter";
import { SearchResultsInfo } from "@/app/components/SearchResultsInfo";
import { ProductGrid } from "@/app/components/ProductGrid";
import { FloatingOrderButton } from "@/app/components/FloatingOrderButton";
import { OrderPanel } from "@/app/components/OrderPanel";
import { ScrollToTop } from "@/app/components/ScrollToTop";

// Hooks
import { useSession } from "@/app/hooks/useSession";
import { useProducts } from "@/app/hooks/useProducts";
import { useOrder } from "@/app/hooks/useOrder";
import { useCountries } from "@/app/hooks/useCountries";
import { usePhotoEditor } from "@/app/hooks/usePhotoEditor";
import { useScroll } from "@/app/hooks/useScroll";
import { useWhatsApp } from "@/app/hooks/useWhatsApp";

// Types
import { Product, SelectedOptions } from "@/app/types/product";

export default function Home() {
  // State
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isEnglish, setIsEnglish] = useState(true);
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  const [reviewData, setReviewData] = useState<{
    remarks: string;
    purchaseOrder: string;
    uploadedFiles: File[];
  } | null>(null);

  // Hooks
  const { session, userRole, isLoading: sessionLoading, isSessionValid, forceRefreshSession } = useSession();
  const { products, loading, error, productGroups, setProducts, searchTerm, handleSearchChange, handleClearSearch } = useProducts(selectedCategory, isEnglish, session);
  const { countryMap } = useCountries();
  const { showScrollTop, scrollToTop } = useScroll();
  const { handleCustomerService, sendWhatsAppNotification } = useWhatsApp();
  const { isPhotoEditorOpen, selectedProductForPhoto, openPhotoEditor, closePhotoEditor, handleImageUpdate } = usePhotoEditor();
  const {
    selectedProducts,
    customerName,
    customerPhone,
    customerAddress,
    isSubmitting,
    setCustomerName,
    setCustomerPhone,
    setCustomerAddress,
    addToOrder,
    updateQuantity: updateOrderQuantity,
    clearOrder,
    fillCustomerInfo,
    loadCustomerAddresses,
    saveCustomerAddress,
    submitOrder,
  } = useOrder();

  // Callbacks

  const handleOptionChange = useCallback((title: string, type: "variation" | "countryId" | "weight", value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [title]: {
        ...prev[title],
        [type]: value,
      },
    }));
  }, []);

  const handleSubmitOrder = useCallback(async (reviewData?: {
    remarks: string;
    purchaseOrder: string;
    uploadedFiles: File[];
  }) => {
    const success = await submitOrder(session, isEnglish, sendWhatsAppNotification, reviewData);
    if (success) {
      setIsOrderPanelOpen(false);
      setReviewData(null); // Clear review data after successful submission
    }
  }, [submitOrder, session, isEnglish, sendWhatsAppNotification]);

  const handleImageUpdateCallback = useCallback((imageUrl: string) => {
    handleImageUpdate(imageUrl, setProducts);
  }, [handleImageUpdate, setProducts]);

  // Note: Auto-fill functionality is now handled directly in OrderPanel component

  const handleLoginSuccess = useCallback(async () => {
    try {
      console.log("Login success callback triggered");
      setIsLoggingIn(true);
      setIsSignupModalOpen(false);
      
      // Give a small delay to ensure the session is properly set
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force refresh the session
      await forceRefreshSession();
      
      console.log("Login success callback completed");
    } catch (error) {
      console.error("Error in login success callback:", error);
    } finally {
      setIsLoggingIn(false);
    }
  }, [forceRefreshSession]);

  // Loading state - simplified logic to prevent infinite loading
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isLoading = loading || sessionLoading;

  // Debug logging
  //console.log('Loading states:', { loading, sessionLoading, isLoading, productsCount: products.length, sessionExists: !!session });

  // Timeout to prevent infinite loading - reduced to 5 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log("Force loading reset after timeout");
      setIsInitialLoad(false);
    }, 5000); // 5 second maximum loading time

    return () => clearTimeout(timeout);
  }, []);

  // Reset initial load when data is available or session is loaded
  useEffect(() => {
    if (products.length > 0 || error || !sessionLoading) {
      setIsInitialLoad(false);
    }
  }, [products.length, error, sessionLoading]);

  // Show loading skeleton only during initial load and when actually loading
  if (isLoading && isInitialLoad) {
    return <LoadingSkeleton />;
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} isEnglish={isEnglish} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Language Toggle, Search, and Category Filter */}
      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <LanguageToggle isEnglish={isEnglish} onToggle={() => setIsEnglish(!isEnglish)} />
          <SearchBar 
            searchTerm={searchTerm} 
            isEnglish={isEnglish} 
            onSearchChange={handleSearchChange}
            onClearSearch={handleClearSearch}
          />
        </div>
        <CategoryFilter 
          selectedCategory={selectedCategory} 
          isEnglish={isEnglish} 
          onCategoryChange={setSelectedCategory}
        />
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <SearchResultsInfo 
          searchTerm={searchTerm} 
          resultsCount={productGroups.length} 
          isEnglish={isEnglish} 
        />
      )}

      {/* Product Grid */}
      <ProductGrid
        productGroups={productGroups}
        isEnglish={isEnglish}
        isSessionValid={isSessionValid}
        userRole={userRole}
        selectedOptions={selectedOptions}
        selectedProducts={selectedProducts}
        countryMap={countryMap}
        isLoggingIn={isLoggingIn}
        onOptionChange={handleOptionChange}
        onAddToOrder={addToOrder}
        onUpdateQuantity={updateOrderQuantity}
        onCustomerService={handleCustomerService}
        onOpenPhotoEditor={openPhotoEditor}
        onOpenSignupModal={() => setIsSignupModalOpen(true)}
      />

      {/* No Results Message */}
      {productGroups.length === 0 && !loading && !isInitialLoad && <NoResults isEnglish={isEnglish} />}
      
      {/* Fallback for when loading is stuck */}
      {productGroups.length === 0 && !loading && isInitialLoad && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            {isEnglish ? "Loading products..." : "正在加载产品..."}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {isEnglish ? "Refresh Page" : "刷新页面"}
          </button>
        </div>
      )}

      {/* Fallback for when session is loading but products are available */}
      {productGroups.length > 0 && sessionLoading && (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">
            {isEnglish ? "Loading user session..." : "正在加载用户会话..."}
          </p>
        </div>
      )}
      

      {/* Floating Order Button */}
      {selectedProducts.length > 0 && (
        <FloatingOrderButton
          selectedProductsCount={selectedProducts.length}
          isEnglish={isEnglish}
          onClick={() => setIsOrderPanelOpen(true)}
        />
      )}

      {/* Order Panel */}
      <OrderPanel
        isOpen={isOrderPanelOpen}
        isEnglish={isEnglish}
        selectedProducts={selectedProducts}
        customerName={customerName}
        customerPhone={customerPhone}
        customerAddress={customerAddress}
        isSubmitting={isSubmitting}
        session={session}
        onClose={() => setIsOrderPanelOpen(false)}
        onUpdateQuantity={updateOrderQuantity}
        onCustomerNameChange={setCustomerName}
        onCustomerPhoneChange={setCustomerPhone}
        onCustomerAddressChange={setCustomerAddress}
        onSubmitOrder={handleSubmitOrder}
      />

      {/* Scroll to Top Arrow */}
      <ScrollToTop show={showScrollTop} onClick={scrollToTop} />

      {/* Signup Modal */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Photo Editor Modal */}
      {selectedProductForPhoto && (
        <ProductPhotoEditor
          currentImageUrl={selectedProductForPhoto.image_url}
          isOpen={isPhotoEditorOpen}
          productId={selectedProductForPhoto.id}
          productName={selectedProductForPhoto.Product}
          onClose={closePhotoEditor}
          onImageUpdate={handleImageUpdateCallback}
        />
      )}
    </div>
  );
}
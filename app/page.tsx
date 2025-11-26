"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

// Component that handles search params (needs to be wrapped in Suspense)
function HomeContent({
  selectedCategory,
  setSelectedCategory,
  isEnglish,
  setIsEnglish,
  isOrderPanelOpen,
  setIsOrderPanelOpen,
  isSignupModalOpen,
  setIsSignupModalOpen,
  isLoggingIn,
  setIsLoggingIn,
  selectedOptions,
  setSelectedOptions,
  reviewData,
  setReviewData,
  session,
  userRole,
  sessionLoading,
  isSessionValid,
  forceRefreshSession,
  products,
  loading,
  error,
  productGroups,
  setProducts,
  searchTerm,
  handleSearchChange,
  handleClearSearch,
  countryMap,
  showScrollTop,
  scrollToTop,
  handleCustomerService,
  sendWhatsAppNotification,
  isPhotoEditorOpen,
  selectedProductForPhoto,
  openPhotoEditor,
  closePhotoEditor,
  handleImageUpdate,
  selectedProducts,
  customerName,
  customerPhone,
  customerAddress,
  isSubmitting,
  setCustomerName,
  setCustomerPhone,
  setCustomerAddress,
  addToOrder,
  updateOrderQuantity,
  clearOrder,
  fillCustomerInfo,
  loadCustomerAddresses,
  saveCustomerAddress,
  submitOrder,
}: any) {
  const searchParams = useSearchParams();

  // Load reorder data from localStorage if reorder parameter is present
  useEffect(() => {
    const reorderParam = searchParams.get("reorder");
    if (reorderParam === "true" && typeof window !== "undefined") {
      try {
        // Load customer info from localStorage
        const reorderCustomerName = localStorage.getItem("reorder_customer_name");
        const reorderCustomerPhone = localStorage.getItem("reorder_customer_phone");
        const reorderCustomerAddress = localStorage.getItem("reorder_customer_address");
        const reorderItemsStr = localStorage.getItem("reorder_items");

        if (reorderItemsStr) {
          const reorderItems = JSON.parse(reorderItemsStr);

          // Clear current order first
          clearOrder();

          // Set customer info
          if (reorderCustomerName) setCustomerName(reorderCustomerName);
          if (reorderCustomerPhone) setCustomerPhone(reorderCustomerPhone);
          if (reorderCustomerAddress) setCustomerAddress(reorderCustomerAddress);

          // Add all items with correct quantities
          reorderItems.forEach((item: { product: any; quantity: number }) => {
            // First add the product (this will add it with quantity 1)
            addToOrder(item.product);
            // Then immediately update the quantity
            if (item.quantity > 1) {
              setTimeout(() => {
                updateOrderQuantity(item.product.id, item.quantity);
              }, 10);
            }
          });

          // Clean up localStorage
          localStorage.removeItem("reorder_customer_name");
          localStorage.removeItem("reorder_customer_phone");
          localStorage.removeItem("reorder_customer_address");
          localStorage.removeItem("reorder_items");

          // Open the order panel
          setTimeout(() => {
            setIsOrderPanelOpen(true);
          }, 100);

          // Clean up URL parameters
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("order");
            url.searchParams.delete("reorder");
            window.history.replaceState({}, "", url.toString());
          }
        }
      } catch (error) {
        // Clean up URL parameters even on error
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("order");
          url.searchParams.delete("reorder");
          window.history.replaceState({}, "", url.toString());
        }
      }
    }
  }, [
    searchParams,
    clearOrder,
    setCustomerName,
    setCustomerPhone,
    setCustomerAddress,
    addToOrder,
    updateOrderQuantity,
    setIsOrderPanelOpen,
  ]);

  // Auto-open order panel if order query parameter is present and items are already loaded
  useEffect(() => {
    const orderParam = searchParams.get("order");
    if (
      orderParam === "true" &&
      selectedProducts.length > 0 &&
      searchParams.get("reorder") !== "true"
    ) {
      setIsOrderPanelOpen(true);
      // Remove the query parameter from URL to avoid reopening on refresh
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("order");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [searchParams, selectedProducts.length]);

  // Callbacks
  const handleOptionChange = useCallback(
    (title: string, type: "variation" | "countryId" | "weight", value: string) => {
      setSelectedOptions((prev: SelectedOptions) => ({
        ...prev,
        [title]: {
          ...prev[title],
          [type]: value,
        },
      }));
    },
    [setSelectedOptions]
  );

  const handleSubmitOrder = useCallback(
    async (reviewData?: { remarks: string; purchaseOrder: string; uploadedFiles: File[] }) => {
      const success = await submitOrder(session, isEnglish, sendWhatsAppNotification, reviewData);
      if (success) {
        setIsOrderPanelOpen(false);
        setReviewData(null); // Clear review data after successful submission
      }
    },
    [submitOrder, session, isEnglish, sendWhatsAppNotification, setIsOrderPanelOpen, setReviewData]
  );

  const handleImageUpdateCallback = useCallback(
    (imageUrl: string) => {
      handleImageUpdate(imageUrl, setProducts);
    },
    [handleImageUpdate, setProducts]
  );

  const handleLoginSuccess = useCallback(async () => {
    try {
      setIsLoggingIn(true);
      setIsSignupModalOpen(false);

      // Give a small delay to ensure the session is properly set
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Force refresh the session
      await forceRefreshSession();
    } catch (error) {
      // Error handled silently - user will see session state update
    } finally {
      setIsLoggingIn(false);
    }
  }, [forceRefreshSession, setIsLoggingIn, setIsSignupModalOpen]);

  // Loading state - simplified logic to prevent infinite loading
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isLoading = loading || sessionLoading;

  // Timeout to prevent infinite loading - reduced to 5 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
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
    return (
      <ErrorState error={error} isEnglish={isEnglish} onRetry={() => window.location.reload()} />
    );
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
          <a
            href="https://hongguanmp.com.sg/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium whitespace-nowrap"
          >
            {isEnglish ? "Visit Hong Guan Website" : "访问主网站"}
          </a>
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
      {productGroups.length === 0 && !loading && !isInitialLoad && (
        <NoResults isEnglish={isEnglish} />
      )}

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
  const {
    session,
    userRole,
    isLoading: sessionLoading,
    isSessionValid,
    forceRefreshSession,
  } = useSession();
  const {
    products,
    loading,
    error,
    productGroups,
    setProducts,
    searchTerm,
    handleSearchChange,
    handleClearSearch,
  } = useProducts(selectedCategory, isEnglish, session);
  const { countryMap } = useCountries();
  const { showScrollTop, scrollToTop } = useScroll();
  const { handleCustomerService, sendWhatsAppNotification } = useWhatsApp();
  const {
    isPhotoEditorOpen,
    selectedProductForPhoto,
    openPhotoEditor,
    closePhotoEditor,
    handleImageUpdate,
  } = usePhotoEditor();
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

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HomeContent
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        isEnglish={isEnglish}
        setIsEnglish={setIsEnglish}
        isOrderPanelOpen={isOrderPanelOpen}
        setIsOrderPanelOpen={setIsOrderPanelOpen}
        isSignupModalOpen={isSignupModalOpen}
        setIsSignupModalOpen={setIsSignupModalOpen}
        isLoggingIn={isLoggingIn}
        setIsLoggingIn={setIsLoggingIn}
        selectedOptions={selectedOptions}
        setSelectedOptions={setSelectedOptions}
        reviewData={reviewData}
        setReviewData={setReviewData}
        session={session}
        userRole={userRole}
        sessionLoading={sessionLoading}
        isSessionValid={isSessionValid}
        forceRefreshSession={forceRefreshSession}
        products={products}
        loading={loading}
        error={error}
        productGroups={productGroups}
        setProducts={setProducts}
        searchTerm={searchTerm}
        handleSearchChange={handleSearchChange}
        handleClearSearch={handleClearSearch}
        countryMap={countryMap}
        showScrollTop={showScrollTop}
        scrollToTop={scrollToTop}
        handleCustomerService={handleCustomerService}
        sendWhatsAppNotification={sendWhatsAppNotification}
        isPhotoEditorOpen={isPhotoEditorOpen}
        selectedProductForPhoto={selectedProductForPhoto}
        openPhotoEditor={openPhotoEditor}
        closePhotoEditor={closePhotoEditor}
        handleImageUpdate={handleImageUpdate}
        selectedProducts={selectedProducts}
        customerName={customerName}
        customerPhone={customerPhone}
        customerAddress={customerAddress}
        isSubmitting={isSubmitting}
        setCustomerName={setCustomerName}
        setCustomerPhone={setCustomerPhone}
        setCustomerAddress={setCustomerAddress}
        addToOrder={addToOrder}
        updateOrderQuantity={updateOrderQuantity}
        clearOrder={clearOrder}
        fillCustomerInfo={fillCustomerInfo}
        loadCustomerAddresses={loadCustomerAddresses}
        saveCustomerAddress={saveCustomerAddress}
        submitOrder={submitOrder}
      />
    </Suspense>
  );
}

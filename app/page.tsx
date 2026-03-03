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
import { useCart } from "@/context/CartContext";

// Types
import { SelectedOptions } from "@/app/types/product";
import { OrderReviewData } from "@/app/types/common";

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
  submitOrder,
}: any) {
  const searchParams = useSearchParams();

  // Load reorder data from localStorage if reorder parameter is present
  useEffect(() => {
    const reorderParam = searchParams.get("reorder");
    if (reorderParam === "true" && typeof window !== "undefined") {
      try {
        const reorderCustomerName = localStorage.getItem("reorder_customer_name");
        const reorderCustomerPhone = localStorage.getItem("reorder_customer_phone");
        const reorderCustomerAddress = localStorage.getItem("reorder_customer_address");
        const reorderItemsStr = localStorage.getItem("reorder_items");

        if (reorderItemsStr) {
          const reorderItems = JSON.parse(reorderItemsStr);

          clearOrder();

          if (reorderCustomerName) setCustomerName(reorderCustomerName);
          if (reorderCustomerPhone) setCustomerPhone(reorderCustomerPhone);
          if (reorderCustomerAddress) setCustomerAddress(reorderCustomerAddress);

          reorderItems.forEach((item: { product: any; quantity: number }) => {
            addToOrder(item.product);
            if (item.quantity > 1) {
              setTimeout(() => updateOrderQuantity(item.product.id, item.quantity), 10);
            }
          });

          localStorage.removeItem("reorder_customer_name");
          localStorage.removeItem("reorder_customer_phone");
          localStorage.removeItem("reorder_customer_address");
          localStorage.removeItem("reorder_items");

          setTimeout(() => setIsOrderPanelOpen(true), 100);

          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("order");
            url.searchParams.delete("reorder");
            window.history.replaceState({}, "", url.toString());
          }
        }
      } catch {
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
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("order");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [searchParams, selectedProducts.length, setIsOrderPanelOpen]);

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
    async (reviewData?: OrderReviewData) => {
      const success = await submitOrder(session, isEnglish, sendWhatsAppNotification, reviewData);
      if (success) {
        setIsOrderPanelOpen(false);
        setReviewData(null);
      }
    },
    [submitOrder, session, isEnglish, sendWhatsAppNotification, setIsOrderPanelOpen, setReviewData]
  );

  const handleImageUpdateCallback = useCallback(
    (imageUrl: string) => handleImageUpdate(imageUrl, setProducts),
    [handleImageUpdate, setProducts]
  );

  const handleLoginSuccess = useCallback(async () => {
    try {
      setIsLoggingIn(true);
      setIsSignupModalOpen(false);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await forceRefreshSession();
    } finally {
      setIsLoggingIn(false);
    }
  }, [forceRefreshSession, setIsLoggingIn, setIsSignupModalOpen]);

  // Loading state
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isLoading = loading || sessionLoading;

  useEffect(() => {
    const timeout = setTimeout(() => setIsInitialLoad(false), 5000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (products.length > 0 || error || !sessionLoading) setIsInitialLoad(false);
  }, [products.length, error, sessionLoading]);

  if (isLoading && isInitialLoad) return <LoadingSkeleton />;

  if (error) {
    return (
      <ErrorState error={error} isEnglish={isEnglish} onRetry={() => window.location.reload()} />
    );
  }

  return (
    <div className="w-full">
      {/* Shopee-like sticky filter bar (under the main header) */}
      {/* IMPORTANT: make this full-width and allow wrap on small screens */}
      <div className="sticky top-14 sm:top-16 z-40 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="w-full px-3 sm:px-6 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <LanguageToggle isEnglish={isEnglish} onToggle={() => setIsEnglish(!isEnglish)} />

            {/* Search should be flex-1 but not shrink to nothing */}
            <div className="flex-1 min-w-[160px]">
              <SearchBar
                searchTerm={searchTerm}
                isEnglish={isEnglish}
                onSearchChange={handleSearchChange}
                onClearSearch={handleClearSearch}
              />
            </div>

            {/* Category dropdown gets its own min width */}
            <div className="w-full sm:w-auto sm:min-w-[220px]">
              <CategoryFilter
                selectedCategory={selectedCategory}
                isEnglish={isEnglish}
                onCategoryChange={setSelectedCategory}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content area: full width on mobile, with bottom padding for bottom nav / floating btn */}
      <div className="w-full px-3 sm:px-6 py-4 pb-24">
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

        {/* No Results */}
        {productGroups.length === 0 && !loading && !isInitialLoad && <NoResults isEnglish={isEnglish} />}

        {/* Fallback for stuck loading */}
        {productGroups.length === 0 && !loading && isInitialLoad && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">{isEnglish ? "Loading products..." : "正在加载产品..."}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {isEnglish ? "Refresh Page" : "刷新页面"}
            </button>
          </div>
        )}
      </div>

      {/* Floating Order Button */}
      <div className="fixed right-4 z-50 bottom-[calc(env(safe-area-inset-bottom)+6rem)] flex flex-col gap-3 items-end">
  {selectedProducts.length > 0 && (
    <FloatingOrderButton
      selectedProductsCount={selectedProducts.length}
      isEnglish={isEnglish}
      onClick={() => setIsOrderPanelOpen(true)}
    />
  )}

<ScrollToTop show={showScrollTop} onClick={scrollToTop} />
</div>
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

      {/* Scroll to Top */}
      <ScrollToTop show={showScrollTop} onClick={scrollToTop} />

      {/* Signup Modal */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Photo Editor */}
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isEnglish, setIsEnglish] = useState(true);
  const { isOrderPanelOpen, setIsOrderPanelOpen } = useCart();
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  const [reviewData, setReviewData] = useState<{
    remarks: string;
    purchaseOrder: string;
    uploadedFiles: File[];
  } | null>(null);

  const { session, userRole, isLoading: sessionLoading, isSessionValid, forceRefreshSession } =
    useSession();

  const { products, loading, error, productGroups, setProducts, searchTerm, handleSearchChange, handleClearSearch } =
    useProducts(selectedCategory, isEnglish, session);

  const { countryMap } = useCountries();
  const { showScrollTop, scrollToTop } = useScroll();
  const { handleCustomerService, sendWhatsAppNotification } = useWhatsApp();

  const { isPhotoEditorOpen, selectedProductForPhoto, openPhotoEditor, closePhotoEditor, handleImageUpdate } =
    usePhotoEditor();

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
        submitOrder={submitOrder}
      />
    </Suspense>
  );
}

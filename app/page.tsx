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
import { FORCE_LOADING_RESET_DELAY } from "@/app/constants/app-constants";

// Types
import { SelectedOptions } from "@/app/types/product";
import { OrderReviewData } from "@/app/types/common";

const REORDER_PAYLOAD_KEY = "reorder_payload_v2";


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
  refetchProducts,
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
  replaceOrder,
  submitOrder,
}: any) {
  const searchParams = useSearchParams();
  const [reorderedProductIds, setReorderedProductIds] = useState<number[]>([]);
  const [reorderSourceOrderId, setReorderSourceOrderId] = useState<string | null>(null);
  const [showReorderBanner, setShowReorderBanner] = useState(false);
  const [pendingOpenReorderCart, setPendingOpenReorderCart] = useState(false);
  const [hasReordered, setHasReordered] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
  
    const url = new URL(window.location.href);
    const shouldReorder = url.searchParams.get("reorder") === "true";
  
    if (!shouldReorder || hasReordered) return;
  
    const raw = localStorage.getItem(REORDER_PAYLOAD_KEY);
    if (!raw) return;
  
    try {
      const payload = JSON.parse(raw);
  
      if (!payload?.items || payload.items.length === 0) return;
  
      console.log("🔥 REORDER PAYLOAD:", payload.items);
  
      // ✅ IMPORTANT: delay to ensure state ready
      setTimeout(() => {
        replaceOrder({
          selectedProducts: payload.items,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          customerAddress: payload.customerAddress,
        });
  
        setCustomerName(payload.customerName || "");
        setCustomerPhone(payload.customerPhone || "");
        setCustomerAddress(payload.customerAddress || "");
  
        setIsOrderPanelOpen(true);
  
        setHasReordered(true);
  
        console.log("✅ AFTER replaceOrder:", payload.items);
      }, 100); // <-- THIS FIXES YOUR ISSUE
    } catch (e) {
      console.error("❌ reorder parse failed", e);
    }
  }, [replaceOrder]);

  useEffect(() => {
    const reorderParam = searchParams.get("reorder");

    if (reorderParam === "true" && typeof window !== "undefined") {
      try {
        const payloadRaw = localStorage.getItem(REORDER_PAYLOAD_KEY);

        if (!payloadRaw) return;

        const payload = JSON.parse(payloadRaw);

        if (!payload?.items?.length) return;

        replaceOrder({
          selectedProducts: payload.items,
          customerName: payload.customerName || "",
          customerPhone: payload.customerPhone || "",
          customerAddress: payload.customerAddress || "",
        });

        console.log("[Reorder] payload.items:", payload.items);
        console.log("[Reorder] replaceOrder payload:", payload.items);

        setReorderedProductIds(payload.items.map((x: any) => x.product.id));
        setReorderSourceOrderId(payload.sourceOrderId || null);
        setShowReorderBanner(true);
        setPendingOpenReorderCart(true);

        localStorage.removeItem(REORDER_PAYLOAD_KEY);

        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("order");
          url.searchParams.delete("reorder");
          window.history.replaceState({}, "", url.toString());
        }

        const bannerTimer = setTimeout(() => setShowReorderBanner(false), 5000);
        const highlightTimer = setTimeout(() => setReorderedProductIds([]), 8000);

        return () => {
          clearTimeout(bannerTimer);
          clearTimeout(highlightTimer);
        };
      } catch (err) {
        console.error("Failed to restore reorder payload:", err);
      }
    }
  }, [searchParams, replaceOrder]);

  useEffect(() => {
    console.log("[Reorder] pendingOpenReorderCart:", pendingOpenReorderCart);
    console.log("[Reorder] selectedProducts:", selectedProducts);

    if (pendingOpenReorderCart && selectedProducts.length > 0) {
      setIsOrderPanelOpen(true);
      setPendingOpenReorderCart(false);
    }
  }, [pendingOpenReorderCart, selectedProducts, setIsOrderPanelOpen]);

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
        setReorderedProductIds([]);
        setReorderSourceOrderId(null);
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

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isLoading = loading || sessionLoading;

  useEffect(() => {
    const timeout = setTimeout(() => setIsInitialLoad(false), FORCE_LOADING_RESET_DELAY);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if ((products?.length ?? 0) > 0 || error || !sessionLoading) setIsInitialLoad(false);
  }, [products, error, sessionLoading]);

  if (isLoading && isInitialLoad) return <LoadingSkeleton />;

  if (error) {
    return (
      <ErrorState error={error} isEnglish={isEnglish} onRetry={() => window.location.reload()} />
    );
  }

  return (
    <div className="w-full">
      <div className="sticky top-14 z-40 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:top-16">
        <div className="w-full px-3 py-2.5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <LanguageToggle isEnglish={isEnglish} onToggle={() => setIsEnglish(!isEnglish)} />

            <div className="min-w-[160px] flex-1">
              <SearchBar
                searchTerm={searchTerm}
                isEnglish={isEnglish}
                onSearchChange={handleSearchChange}
                onClearSearch={handleClearSearch}
              />
            </div>

            <div className="w-full sm:min-w-[220px] sm:w-auto">
              <CategoryFilter
                selectedCategory={selectedCategory}
                isEnglish={isEnglish}
                onCategoryChange={setSelectedCategory}
              />
            </div>
          </div>
        </div>
      </div>

      {showReorderBanner && (
        <div className="mx-auto mt-3 max-w-6xl px-3 sm:px-6">
          <div className="animate-[fadeIn_0.35s_ease-out] rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">
                  {isEnglish ? "Order restored to cart" : "订单已重新加入购物车"}
                </div>
                <div className="text-sm text-green-700">
                  {isEnglish
                    ? `Items from Order #${reorderSourceOrderId ?? ""} are ready for review.`
                    : `订单 #${reorderSourceOrderId ?? ""} 的商品已加入购物车。`}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOrderPanelOpen(true)}
                  className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-green-700 shadow-sm hover:bg-green-100"
                >
                  {isEnglish ? "Review Now" : "立即查看"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowReorderBanner(false)}
                  className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-green-700 shadow-sm hover:bg-green-100"
                >
                  {isEnglish ? "Dismiss" : "关闭"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full px-3 py-4 pb-24 sm:px-6">
        {searchTerm && (
          <SearchResultsInfo
            searchTerm={searchTerm}
            resultsCount={productGroups.length}
            isEnglish={isEnglish}
          />
        )}

        <ProductGrid
          productGroups={productGroups}
          isEnglish={isEnglish}
          isSessionValid={isSessionValid}
          userRole={userRole}
          selectedOptions={selectedOptions}
          selectedProducts={selectedProducts}
          countryMap={countryMap}
          isLoggingIn={isLoggingIn}
          reorderedProductIds={reorderedProductIds}
          onOptionChange={handleOptionChange}
          onAddToOrder={addToOrder}
          onUpdateQuantity={updateOrderQuantity}
          onCustomerService={handleCustomerService}
          onOpenPhotoEditor={openPhotoEditor}
          onOpenSignupModal={() => setIsSignupModalOpen(true)}
        />

        {productGroups.length === 0 && !loading && !isInitialLoad && (
          <NoResults isEnglish={isEnglish} />
        )}

        {productGroups.length === 0 && !loading && isInitialLoad && (
          <div className="py-8 text-center">
            <p className="mb-4 text-gray-500">
              {isEnglish ? "Loading products..." : "正在加载产品..."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              {isEnglish ? "Refresh Page" : "刷新页面"}
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+6rem)] right-4 z-50 flex flex-col items-end gap-3">
        {selectedProducts.length > 0 && (
          <FloatingOrderButton
            selectedProductsCount={selectedProducts.length}
            isEnglish={isEnglish}
            onClick={() => setIsOrderPanelOpen(true)}
          />
        )}
        <ScrollToTop show={showScrollTop} onClick={scrollToTop} />
      </div>

      <OrderPanel
        isOpen={isOrderPanelOpen}
        isEnglish={isEnglish}
        selectedProducts={selectedProducts}
        customerName={customerName}
        customerPhone={customerPhone}
        customerAddress={customerAddress}
        isSubmitting={isSubmitting}
        session={session}
        countryMap={countryMap}
        onClose={() => setIsOrderPanelOpen(false)}
        onUpdateQuantity={updateOrderQuantity}
        onCustomerNameChange={setCustomerName}
        onCustomerPhoneChange={setCustomerPhone}
        onCustomerAddressChange={setCustomerAddress}
        onSubmitOrder={handleSubmitOrder}
      />

      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {selectedProductForPhoto && (
        <ProductPhotoEditor
          currentImageUrl={selectedProductForPhoto.image_url}
          isOpen={isPhotoEditorOpen}
          productId={selectedProductForPhoto.id}
          productName={selectedProductForPhoto.Product}
          onClose={() => {
            closePhotoEditor();
          }}
          onImageUpdate={handleImageUpdateCallback}
          onRefetchProducts={refetchProducts}
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

  const {
    products,
    loading,
    error,
    productGroups,
    setProducts,
    refetchProducts,
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
    replaceOrder,
    submitOrder,
  } = useOrder();

  useEffect(() => {
    if (!session) {
      clearOrder();
      setIsOrderPanelOpen(false);
    }
  }, [session, clearOrder, setIsOrderPanelOpen]);

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
        refetchProducts={refetchProducts}
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
        replaceOrder={replaceOrder}
        submitOrder={submitOrder}
      />
    </Suspense>
  );
}
// src/components/details/product-details.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Heart,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  Tag,
  Ruler,
  Package,
  Clock,
  CheckCircle,
  Info,
  Check,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/common/container";
import { useGetProductBySlugQuery } from "@/redux/api/api-query";
import { useGetStockQuery } from "@/redux/api/cart-query";

import ProductSkeleton from "./product-details-skeleton";
import { getSocialIcon, makeAttributesPayload } from "@/components/details/helpers";

import { ImageGallery } from "@/components/details/image-gallery";

import { useAppDispatch, useAppSelector } from "@/redux/store";
import { addItem } from "@/redux/features/cart-slice";
import { useGetRelatedProductsQuery } from "@/redux/api/products-query";
import { Category } from "@/types";
import RelatedProducts from "./related-products";
import { AnimatePresence, motion } from "framer-motion";

import Tooltip from "@/components/common/tooltip";
import OrderTypes from "@/types/order-types";
import {
  selectPreOrderCurrent,
  setPreOrder,
  saveForLaterAdd,
} from "@/redux/features/preorder-slice";

/** local minimal types */
type Variant = {
  _id: string;
  attributes?: string[];
  attribute_values?: Record<string, string>;
  regular_price: number;
  sale_price: number;
  image?: string;
  sku?: string;
};

type ProductData = {
  _id: string;
  name?: string;
  description?: string;
  thumbnail?: string;
  slider_images?: string[];
  category?: Category;
  variants: Variant[];
  min_order_qty?: number;
  max_order_qty?: number;
  total_sold?: number;
  approximately_delivery_time?: string;
  is_free_delivery?: boolean;
  shipping_cost?: number;
  shipping_cost_per_unit?: number;
  warranty?: string;
  return_policy?: string;
  search_tags?: string[];
  offer_tags?: string[];
  social_links?: { name?: string; url?: string }[];
  coin_per_order?: number;
  sku?: string;
  preOrder?: boolean;

  /** NEW server props */
  product_type?: OrderTypes | string;
  pre_order_product?: {
    min_order_quantity?: number;
    max_order_quantity?: number;
    expected_delivery_time?: number; // days
    advance_payment_percentage?: number; // 0..100
    advance_payment_required?: boolean;
  };
};

const ProductDetails = ({ slug }: { slug: string }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [zoomActive] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  const [showVariantHint, setShowVariantHint] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attrSectionRef = useRef<HTMLDivElement>(null);

  const { data: apiResponse, isLoading, error } = useGetProductBySlugQuery(slug);
  const productData = (apiResponse?.data ?? null) as ProductData | null;

  const { data: relatedProducts } = useGetRelatedProductsQuery(productData?.category?._id || "", {
    skip: !productData?.category?._id,
  });

  const variants: Variant[] = useMemo(() => productData?.variants ?? [], [productData?.variants]);

  // Build attribute -> set(values) but ignore empty/falsey values
  const allAttributes = useMemo(() => {
    return variants.reduce<Record<string, Set<string>>>((acc, variant) => {
      const attrs = variant.attributes ?? [];
      const values = variant.attribute_values ?? {};
      for (const attr of attrs) {
        if (!attr) continue; // skip empty attribute names
        const v = values[attr];
        if (!v) continue; // skip empty values
        if (!acc[attr]) acc[attr] = new Set<string>();
        acc[attr].add(v);
      }
      return acc;
    }, {});
  }, [variants]);

  // Convert to arrays and remove attributes that ended up empty
  const attributeOptions: Record<string, string[]> = useMemo(() => {
    const entries = Object.entries(allAttributes)
      .filter(([, set]) => set && set.size > 0)
      .map(([k, set]) => [k, Array.from(set).filter(Boolean)] as const)
      .filter(([, arr]) => arr.length > 0);
    return Object.fromEntries(entries);
  }, [allAttributes]);

  const requiredAttributes = Object.keys(attributeOptions);
  const isSelectionComplete =
    requiredAttributes.length === 0 || requiredAttributes.every((attr) => !!selectedAttributes[attr]);

  const selectedVariant: Variant | undefined = useMemo(() => {
    if (!variants.length) return undefined;
    if (requiredAttributes.length === 0) return variants[0];
    if (!isSelectionComplete) return undefined;
    return variants.find((v) => {
      const vals = v.attribute_values ?? {};
      return Object.entries(selectedAttributes).every(([k, val]) => vals[k] === val);
    });
  }, [variants, requiredAttributes.length, isSelectionComplete, selectedAttributes]);

  const productId: string = productData?._id ?? "";
  const variantIdForStock: string | undefined = selectedVariant?._id;

  const shouldShowStock = requiredAttributes.length === 0 || isSelectionComplete;

  const {
    data: stockData,
    isFetching: stockLoading,
    isError: stockError,
  } = useGetStockQuery(
    { variant: variantIdForStock as string, productId },
    {
      skip: !productId || !variantIdForStock || !shouldShowStock,
      refetchOnMountOrArgChange: true,
    }
  );

  const availableQty: number = Number((stockData as any)?.data?.available_quantity ?? 0);
  const outOfStock: boolean =
    Boolean(shouldShowStock && variantIdForStock && !stockLoading && !stockError && availableQty <= 0);

  const priceBase: Variant | undefined = selectedVariant ?? variants[0];
  const regularPrice: number = priceBase?.regular_price ?? 0;
  const salePrice: number = priceBase?.sale_price ?? regularPrice;
  const discountPercentage: number =
    regularPrice > 0 ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 0;

  // ==== PRE-ORDER FLAGS & DATA ====
  const offerTags = (productData?.offer_tags ?? []).filter(Boolean);
  const isPreOrderProduct =
    productData?.product_type === OrderTypes.PRE_ORDER ||
    productData?.product_type === "pre_order" ||
    productData?.preOrder === true ||
    offerTags.map((t) => t.toLowerCase()).includes("pre-order");

  const preMeta = productData?.pre_order_product || {};
  const advancePct = preMeta.advance_payment_percentage ?? 0;
  const expectedDays = preMeta.expected_delivery_time ?? undefined;

  // global one-at-a-time rule
  const currentPreOrder = useAppSelector(selectPreOrderCurrent);

  // quantity rules
  const merchantMin = productData?.min_order_qty ?? 1;
  const merchantMax = productData?.max_order_qty ?? 10;

  useEffect(() => {
    // clamp quantity: enforce 1 for pre-orders
    if (isPreOrderProduct) {
      setQuantity(1);
      return;
    }
    const hardMax = Math.min(
      Number.isFinite(merchantMax) ? merchantMax : Number.MAX_SAFE_INTEGER,
      Math.max(0, availableQty)
    );
    setQuantity((q) => {
      if (hardMax <= 0) return Math.max(merchantMin, 1);
      return Math.min(Math.max(q, merchantMin), hardMax);
    });
  }, [isPreOrderProduct, availableQty, merchantMin, merchantMax, selectedVariant?._id]);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const handleAttributeSelect = (attributeName: string, value: string) => {
    setSelectedAttributes((prev) => ({ ...prev, [attributeName]: value }));
  };

  const handleShare = async () => {
    const nameSafe = productData?.name ?? "this product";
    const shareData = { title: nameSafe, text: `Check out ${nameSafe}!`, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Product link copied to clipboard!");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Product link copied to clipboard!");
      } catch {
        toast.error("Unable to share. Please copy the URL manually.");
      }
    }
  };

  const validateSelections = (): boolean => {
    if (!isSelectionComplete && requiredAttributes.length > 0) {
      return false;
    }
    // allow OOS to proceed
    return true;
  };

  // ============ STANDARD CART FLOW ============
  const doAddToCart = async (): Promise<boolean> => {
    if (!productId) return false;
    if (requiredAttributes.length > 0 && !isSelectionComplete) return false;
    if (!selectedVariant?._id) return false;
    if (!validateSelections()) return false;

    try {
      setIsAdding(true);
      dispatch(
        addItem({
          productId,
          variantId: selectedVariant._id,
          attributes: makeAttributesPayload(selectedVariant, selectedAttributes),
          quantity,
          priceSnapshot: selectedVariant.sale_price ?? salePrice ?? 0,
        })
      );

      const size = selectedVariant.attribute_values?.Size;
      const color = selectedVariant.attribute_values?.Color;
      const suffix = [size, color].filter(Boolean).join("/");
      const nm = productData?.name ?? "Product";
      toast.success(`Added: ${nm}${suffix ? ` • ${suffix}` : ""} × ${quantity}`);

      // 🆕 Bangla heads-up toast for OOS
      if (outOfStock) {
        toast.message("দয়া করে লক্ষ্য করুন", {
          description:
            "পণ্যটি বর্তমানে স্টকে নেই। আপনি এখনই অর্ডার করতে পারেন — ডেলিভারি স্বাভাবিকের তুলনায় প্রায় ৬–৭ দিন বেশি সময় লাগতে পারে। আপনার অর্ডার সম্পর্কে আমাদের কাস্টমার সাপোর্ট টিম অবগত আছে এবং প্রয়োজনে আপনার সাথে যোগাযোগ করবে।",
        });
      }

      return true;
    } catch {
      toast.error("Failed to add to cart");
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  const promptVariantSelection = () => {
    setShowVariantHint(true);
    attrSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setShowVariantHint(false), 3000);
  };

  const handleAddToCartClick = async () => {
    if (requiredAttributes.length > 0 && !isSelectionComplete) {
      promptVariantSelection();
      return;
    }
    await doAddToCart(); // allow even if outOfStock
  };

  const handleBuyNowClick = async () => {
    if (requiredAttributes.length > 0 && !isSelectionComplete) {
      promptVariantSelection();
      return;
    }
    const ok = await doAddToCart(); // allow even if outOfStock
    if (ok) router.push("/checkout");
  };

  // ============ PRE-ORDER FLOW ============
  const handlePreOrderNow = async () => {
    if (requiredAttributes.length > 0 && !isSelectionComplete) {
      promptVariantSelection();
      return;
    }
    if (!selectedVariant?._id) return;
    if (!validateSelections()) return;

    // one at a time rule
    if (currentPreOrder && currentPreOrder.productId !== productId) {
      toast.error("You can only have one pre-order at a time. Clear the existing one first.");
      return;
    }

    setIsAdding(true);
    try {
      dispatch(
        setPreOrder({
          productId,
          variantId: selectedVariant._id,
          attributes: makeAttributesPayload(selectedVariant, selectedAttributes),
          // quantity will be forced to 1 in reducer
          priceSnapshot: selectedVariant.sale_price ?? salePrice ?? 0,
          advancePaymentPercentage: advancePct || 0,
          expectedDeliveryDays: expectedDays,
          name: productData?.name,
          image: selectedVariant?.image || productData?.thumbnail,
          sku: selectedVariant?.sku || productData?.sku,
        })
      );
      toast.success("Pre-order locked in! You can complete payment at checkout.");
      router.push("/pre-order?order_now=true");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveForLater = () => {
    if (requiredAttributes.length > 0 && !isSelectionComplete) {
      promptVariantSelection();
      return;
    }
    dispatch(
      saveForLaterAdd({
        productId,
        variantId: selectedVariant?._id,
        attributes: makeAttributesPayload(selectedVariant!, selectedAttributes),
        name: productData?.name,
        image: selectedVariant?.image || productData?.thumbnail,
        priceSnapshot: selectedVariant?.sale_price ?? salePrice ?? 0,
      })
    );
    toast.success("Saved for later ✨");
  };

  // ======== Static render bits ========
  const name = productData?.name ?? "Product Name";
  const description = productData?.description ?? "";
  const thumbnail = productData?.thumbnail ?? "/placeholder.svg";
  const sliderImages = (productData?.slider_images ?? []).filter(Boolean);
  const allImages: string[] = [thumbnail, ...sliderImages].filter(Boolean);
  const mainImg: string = allImages[selectedImage] || "/placeholder.svg";

  const categoryName = productData?.category?.name;
  const totalSold = productData?.total_sold ?? 0;
  const deliveryTime = productData?.approximately_delivery_time ?? "Standard delivery";
  const isFreeDelivery = productData?.is_free_delivery ?? false;
  const shippingCost = productData?.shipping_cost ?? 0;
  const shippingCostPerUnit = productData?.shipping_cost_per_unit ?? 0;
  const socialLinksRaw = (productData?.social_links ?? []) as ({ name?: string; url?: string })[];
  const socialLinks = socialLinksRaw.filter((l) => l && l.name && l.url);
  const coinPerOrder = productData?.coin_per_order ?? 0;
  const sku = productData?.sku ?? undefined; // only show if truthy

  // keep enabled even when OOS (only block during async / stock-loading)
  const buttonsDisabled =
    isAdding ||
    (!isPreOrderProduct && shouldShowStock && stockLoading);

  const buyLabel = isAdding
    ? "Processing..."
    : isPreOrderProduct
      ? "Pre-Order Now"
      : "Buy Now";

  const cartLabel = isAdding
    ? "Saving..."
    : isPreOrderProduct
      ? "Save for later"
      : "Add to Cart";

  const needsAttrAttention = showVariantHint && requiredAttributes.length > 0 && !isSelectionComplete;

  return (
    <div>
      <Container className="pt-2 md:pb-6 lg:py-4">
        {isLoading ? (
          <ProductSkeleton />
        ) : error || !productData ? (
          <div className="py-12 min-h-screen flex items-center justify-center flex-col text-center">
            <h2 className="text-2xl font-medium text-gray-900 mb-4">Product Not Found</h2>
            <p className="text-gray-600">Sorry, we couldn&apos;t find the product you&apos;re looking for.</p>
          </div>
        ) : (
          <div className="md:grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-8">
            {/* LEFT */}
            <div className="space-y-2 lg:space-y-3">
              <div className={`rounded-2xl overflow-visible relative ${isPreOrderProduct ? "ring-1 ring-primary/30" : ""}`}>
                <div className="hidden lg:block">
                  <ImageGallery images={allImages} productName={name} />
                </div>

                <div className="lg:hidden aspect-square bg-gray-50 rounded-2xl overflow-hidden relative">
                  <Image
                    src={mainImg}
                    alt={name}
                    width={650}
                    priority
                    height={650}
                    className="object-cover transition-transform duration-300"
                  />
                </div>

                {isPreOrderProduct && (
                  <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Pre-Order
                  </div>
                )}
              </div>

              {/* Thumbnails (mobile/scroll) */}
              <div className="overflow-x-auto lg:hidden">
                <div className="flex gap-2 pb-2" style={{ width: "max-content" }}>
                  {allImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 size-14 md:size-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${selectedImage === index ? "border-primary shadow-lg" : "border-gray-200 hover:border-primary/50"
                        }`}
                      aria-label={`View image ${index + 1}`}
                    >
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`${name} view ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-2 lg:pb-0">
              <div className="md:space-y-[18px] space-y-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!!categoryName && (
                        <span className="text-xs font-medium text-primary-mid bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {categoryName}
                        </span>
                      )}
                      {offerTags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium text-orange-700 bg-orange-100 px-3 py-1 rounded-full flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          {tag.replace("-", " ").toUpperCase()}
                        </span>
                      ))}
                      {isPreOrderProduct && (
                        <span className="text-[10px] font-medium text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          PRE-ORDER
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsWishlisted((v) => !v)}
                        className={`p-2 rounded-full border transition-all duration-200 ${isWishlisted
                          ? "bg-primary border-primary text-white"
                          : "border-gray-300 hover:border-primary hover:text-primary"
                          }`}
                        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
                      </button>
                      <button
                        onClick={handleShare}
                        className="p-2 rounded-full border border-gray-300 hover:border-primary hover:text-primary transition-all duration-200"
                        aria-label="Share product"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <h1 className="md:text-2x text-lg leading-snug md:font-medium text-secondary">{name}</h1>
                </div>

                {/* Price row + tooltips */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="md:text-3xl text-2xl md:font-medium text-secondary">
                      Tk {salePrice.toLocaleString()}
                    </span>
                    {regularPrice > salePrice && (
                      <>
                        <span className="text-xl text-gray-500 line-through">Tk {regularPrice.toLocaleString()}</span>
                        <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {discountPercentage}% OFF
                        </span>
                      </>
                    )}
                    {isPreOrderProduct && (
                      <Tooltip
                        content={
                          <div className="space-y-1">
                            <p className="font-medium">Pre-order terms</p>
                            {typeof advancePct === "number" && advancePct > 0 && (
                              <p>Advance due at checkout: <b>{advancePct}%</b></p>
                            )}
                            {expectedDays && <p>Est. dispatch in ~<b>{expectedDays} days</b></p>}
                            <p>Limit: <b>1 pre-order per user</b></p>
                          </div>
                        }
                      >
                        <span className="inline-flex items-center gap-1 text-primary-mid bg-primary/10 px-2 py-1 rounded-md text-xs cursor-default">
                          <Info className="w-3 h-3" /> details
                        </span>
                      </Tooltip>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <p className="flex items-center gap-1">
                      <Info className="w-4 h-4" />
                      Inclusive of all taxes
                    </p>
                    {coinPerOrder > 0 && (
                      <p className="flex items-center gap-1 text-yellow-600">
                        <CheckCircle className="w-4 h-4" />
                        Earn {coinPerOrder} coins
                      </p>
                    )}
                  </div>
                </div>

                {/* Pre-order banner */}
                {isPreOrderProduct && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>
                        Reserve now, pay {advancePct || 0}% today
                        {expectedDays ? ` • ships in ~${expectedDays} days` : ""}
                      </span>
                    </div>
                    <Tooltip content="We’ll keep your spot in the queue. You can cancel anytime before dispatch.">
                      <span className="text-primary text-xs inline-flex items-center gap-1 cursor-default">
                        <Info className="w-3 h-3" /> how it works
                      </span>
                    </Tooltip>
                  </div>
                )}


                {/* Attribute selectors (render only when we actually have attributes) */}
                {requiredAttributes.length > 0 && (
                  <div ref={attrSectionRef} className="space-y-2 ">
                    {Object.entries(attributeOptions).map(([attributeName, options]) => {
                      const missing = showVariantHint && !selectedAttributes[attributeName];
                      const sortedOptions = [...options].sort((a, b) => {
                        const aNum = parseFloat(a);
                        const bNum = parseFloat(b);
                        const aIsNum = !isNaN(aNum);
                        const bIsNum = !isNaN(bNum);
                        if (aIsNum && bIsNum) return aNum - bNum;
                        if (!aIsNum && !bIsNum) return a.localeCompare(b);
                        return aIsNum ? -1 : 1;
                      });

                      return (
                        <div key={attributeName} className="space-y-1.5">
                          <label className="block text-sm font-medium text-secondary md:flex items-center gap-2">
                            Select {attributeName}
                          </label>
                          <div
                            className={`flex gap-2 flex-wrap ${missing ? "ring-2 ring-primary/40 rounded-lg p-2 animate-pulse" : ""
                              }`}
                          >
                            {sortedOptions.map((option) => (
                              <button
                                key={`${attributeName}:${option}`}
                                onClick={() => handleAttributeSelect(attributeName, option)}
                                className={`px-2 text-[10px] md:text-xs py-2 border-2 rounded-md md:rounded-lg font-medium transition-all duration-200 flex items-center justify-center min-w-[60px] ${selectedAttributes[attributeName] === option
                                  ? "border-primary bg-primary text-white"
                                  : "border-gray-300 hover:border-primary hover:text-primary"
                                  }`}
                                aria-label={`${attributeName} ${option}`}
                              >
                                {selectedAttributes[attributeName] === option && <Check className="w-3 h-3 mr-1" />}
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Stock (hide stock error for pre-order; it’s a reservation) */}
                {!isPreOrderProduct && (
                  <div className="text-sm">
                    {shouldShowStock && variantIdForStock && stockLoading && (
                      <span className="text-gray-500">Checking stock…</span>
                    )}
                    {shouldShowStock && variantIdForStock && !stockLoading && stockError && (
                      <span className="text-amber-700">Couldn’t check stock. Try again.</span>
                    )}
                    {shouldShowStock && variantIdForStock && !stockLoading && !stockError && (outOfStock ? (
                      <span className="text-red-600 font-medium">Out of stock</span>
                    ) : (
                      <span className="text-emerald-700">
                        In stock: <span className="font-medium">{availableQty}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Quantity */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-secondary md:flex items-center gap-2">
                    Quantity
                    {isPreOrderProduct && (
                      <Tooltip content="Pre-orders are limited to one item per customer.">
                        <Info className="w-3 h-3 text-primary" />
                      </Tooltip>
                    )}
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 border border-gray-300 rounded-lg hover:border-primary transition-colors duration-200 flex items-center justify-center font-bold text-sm disabled:opacity-50"
                      aria-label="Decrease quantity"
                      disabled={isAdding || isPreOrderProduct}
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{isPreOrderProduct ? 1 : quantity}</span>
                    <button
                      onClick={() => {
                        if (isPreOrderProduct) return;
                        const hardMax = Math.min(
                          Number.isFinite(merchantMax) ? merchantMax : Number.MAX_SAFE_INTEGER,
                          Math.max(0, availableQty)
                        );
                        setQuantity((q) => Math.min(q + 1, hardMax));
                      }}
                      className="w-8 h-8 border border-gray-300 rounded-lg hover:border-primary transition-colors duration-200 flex items-center justify-center font-bold text-sm disabled:opacity-50"
                      aria-label="Increase quantity"
                      disabled={isAdding || isPreOrderProduct}
                    >
                      +
                    </button>
                  </div>
                  {!isPreOrderProduct && (
                    <p className="text-xs text-gray-500">
                      Min: {merchantMin}, Max: {merchantMax}
                      {shouldShowStock && variantIdForStock && !stockLoading && !stockError && (
                        <> • Stock available: {availableQty}</>
                      )}
                    </p>
                  )}
                </div>
                {!isPreOrderProduct && outOfStock && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
                    <Info className="w-4 h-4 mt-0.5 text-amber-700" />
                    <div className="text-sm">
                      <p lang="bn" className="font-medium">
                        পণ্যটির স্টক খুব শিগগিরই আসছে। আপনি এখনই অর্ডার করতে পারেন — ডেলিভারি স্বাভাবিকের চেয়ে প্রায় <b>৬–৭ দিন</b> বেশি সময় লাগতে পারে।
                      </p>
                      <p lang="bn" className="mt-0.5">
                        আপনার অর্ডার সম্পর্কে আমাদের <b>কাস্টমার সাপোর্ট টিম</b> অবগত আছে এবং প্রয়োজন হলে আপনার সঙ্গে যোগাযোগ করবে।
                      </p>
                    </div>
                  </div>
                )}

                <div className="hidden md:grid grid-cols-3 gap-1 md:gap-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {isFreeDelivery ? "Free Shipping" : "Shipping"}
                      </p>
                      {shippingCost > 0 && <p className="text-xs text-blue-700">
                        {isFreeDelivery
                          ? deliveryTime
                          : `Tk ${shippingCost}${shippingCostPerUnit > 0 ? ` + Tk ${shippingCostPerUnit}/unit` : ""}`}
                      </p>}
                    </div>
                  </div>

                  {productData?.warranty ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <Shield className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Warranty</p>
                        <p className="text-xs text-green-700">{productData?.warranty}</p>
                      </div>
                    </div>
                  ) : null}

                  {productData?.return_policy ? (
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <RotateCcw className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-orange-900">Returns</p>
                        <p className="text-xs text-orange-700">{productData?.return_policy}</p>
                      </div>
                    </div>
                  ) : null}
                </div>


                {/* Desktop Buttons */}
                <div className="hidden lg:flex gap-4 pt-2 relative">
                  <button
                    onClick={isPreOrderProduct ? handlePreOrderNow : handleBuyNowClick}
                    disabled={buttonsDisabled}
                    className="flex-1 bg-primary hover:bg-[#c460b5] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    {buyLabel}
                  </button>
                  <button
                    onClick={isPreOrderProduct ? handleSaveForLater : handleAddToCartClick}
                    disabled={buttonsDisabled}
                    className="flex-1 border-2 border-primary text-primary hover:bg-primary hover:text-white disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed font-medium py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    {cartLabel}
                  </button>

                  <AnimatePresence>
                    {needsAttrAttention && (
                      <motion.div
                        key="variant-hint-desktop"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: -8, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        className="absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full bg-white border shadow-xl rounded-xl px-4 py-3 z-50"
                        role="status"
                        aria-live="polite"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium text-secondary">
                          <Info className="w-4 h-4 text-primary" />
                          <span>Please select all variants first</span>
                        </div>
                        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-b border-r"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>

      {/* Bottom info & related products */}
      {!isLoading && !error && productData && (
        <Container>
          <div className="md:mt-2 mb-36">
            <div>
              <div className="md:grid hidden grid-cols-3 lg:grid-cols-4 md:gap-4 gap-2 mb-8">
                {sku && (
                  <div className="md:flex hidden items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <Package className="w-6 h-6 text-primary-mid" />
                    <div>
                      <span className="text-sm text-gray-600">SKU</span>
                      <p className="font-medium text-secondary">{sku}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center gap-3 p-4 md:flex-row bg-gray-50 rounded-xl">
                  <Ruler className="w-6 h-6 text-primary-mid" />
                  <div>
                    <span className="text-sm text-gray-600 md:text-start text-center">Delivery Time</span>
                    <p className="font-medium text-center md:text-start text-secondary">
                      {isPreOrderProduct && expectedDays ? `Ships in ~${expectedDays} days` : deliveryTime}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Tag className="w-6 h-6 text-primary-mid" />
                  <div>
                    <span className="text-sm text-center text-gray-600 md:text-start">Variants</span>
                    <p className="font-medium text-secondary">{variants.length} options</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <span className="text-sm md:text-start text-center text-gray-600">Total Sold</span>
                    <p className="font-medium text-green-600 text-center md:text-start">{totalSold} units</p>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <div className="prose prose-sm max-w-none">
                  <h3 className="text-base md:text-xl font-medium text-black">Product Description</h3>
                  <div
                    className="text-gray-700 text-sm leading-relaxed mb-6"
                    dangerouslySetInnerHTML={{ __html: description || "" }}
                  />
                </div>
              </div>

              {socialLinks.length > 0 && (
                <div className="space-y-3 mb-5">
                  <h3 className="text-sm font-medium text-secondary flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Follow Us
                  </h3>
                  <div className="flex gap-3">
                    {socialLinks.map((link, idx) => {
                      const IconComponent = getSocialIcon(link.name as any);
                      return (
                        <a
                          key={`${link.url}-${idx}`}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-primary/10 hover:text-primary-mid rounded-lg transition-colors duration-200 text-sm"
                        >
                          <IconComponent className="w-4 h-4" />
                          {link.name}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {(productData?.search_tags ?? []).filter(Boolean).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-secondary flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(productData?.search_tags ?? []).filter(Boolean).map((tag, idx) => (
                      <span
                        key={`${tag}-${idx}`}
                        className="px-2 py-1 bg-gray-100 text-gray-700 md:text-xs text-[10px] rounded-full hover:bg-primary/10 hover:text-primary-mid transition-colors duration-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <RelatedProducts data={relatedProducts?.data || []} />
          </div>
        </Container>
      )}

      {/* Mobile sticky buttons */}
      <Container className="lg:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 py-2 z-50 shadow-lg">
        <div className="flex gap-2 relative">
          <button
            onClick={isPreOrderProduct ? handlePreOrderNow : handleBuyNowClick}
            disabled={buttonsDisabled}
            className="flex-1 h-10 bg-primary hover:bg-[#c460b5] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 text-xs px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isPreOrderProduct ? "Pre-Order" : buyLabel}
          </button>
          <button
            onClick={isPreOrderProduct ? handleSaveForLater : handleAddToCartClick}
            disabled={buttonsDisabled}
            className="flex-1 text-xs h-10 border-2 border-primary text-primary hover:bg-primary hover:text-white disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {cartLabel}
          </button>

          {/* Mobile popover */}
          <AnimatePresence>
            {needsAttrAttention && (
              <motion.div
                key="variant-hint-mobile"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: -8, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full bg-white border shadow-xl rounded-xl px-3 py-2 z-50"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-secondary">
                  <Info className="w-4 h-4 text-primary" />
                  <span>Select variants first</span>
                </div>
                <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-b border-r"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Container>
    </div>
  );
};

export default ProductDetails;

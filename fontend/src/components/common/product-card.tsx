"use client"

import { useMemo, useRef, useState, MouseEvent, useCallback, useEffect } from "react"
// Replacing Next.js specific imports with generic/local alternatives
import { useRouter } from "next/navigation" // Keeping Next.js specific imports as per context/original code base
import Link from "next/link"
import Image from "next/image"

import { Heart, ShoppingCart, Truck, Shield, Check, Clock, Info } from "lucide-react"
import type { Product, ProductVariant } from "@/types/product"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useIsMobile } from "@/hooks/use-mobile"

import { useAppDispatch, useAppSelector } from "@/redux/store"
import { addItem } from "@/redux/features/cart-slice"
import { useGetStockQuery } from "@/redux/api/cart-query"
import { selectIsWishedByProductId, toggleItem } from "@/redux/features/wishlist-slice"
import {
  selectPreOrderCurrent,
  setPreOrder,
  saveForLaterAdd,
} from "@/redux/features/preorder-slice" // Import pre-order actions
import { cn } from "@/lib/utils"


// Augment the Product type locally to include new server fields
interface AugmentedProduct extends Product {
  product_type?: 'standard' | 'pre_order' | string;
  pre_order_product?: {
    min_order_quantity?: number;
    max_order_quantity?: number;
    expected_delivery_time?: number; // days
    advance_payment_percentage?: number; // 0..100
    advance_payment_required?: boolean;
  };
}

interface ProductCardProps {
  product: AugmentedProduct
  onWishlistToggle?: (productId: string) => void
  isInWishlist?: boolean
  className?: string
}

type AttrMap = Record<string, string[]>
type AttrSelection = Record<string, string>

const ProductCard = ({ product, className }: ProductCardProps) => {
  const router = useRouter()
  const isMobile = useIsMobile()
  const dispatch = useAppDispatch()

  const augmentedProduct = product as AugmentedProduct;

  
  const preMeta = augmentedProduct.pre_order_product || {};
  const advancePct = preMeta.advance_payment_percentage ?? 0;
  const expectedDays = preMeta.expected_delivery_time ?? undefined;
  const isPreOrderProduct = augmentedProduct.product_type === 'pre_order';
  const currentPreOrder = useAppSelector(selectPreOrderCurrent);

  const isInWishlist = useAppSelector(selectIsWishedByProductId((augmentedProduct as any)._id))


  const [open, setOpen] = useState(false)
  const [internalLoading, setInternalLoading] = useState(false)

  const variants = useMemo(() => augmentedProduct?.variants ?? [], [augmentedProduct])

  const attributeKeys = useMemo<string[]>(() => {
    const keys = new Set<string>()
    for (const v of variants as any[]) {
      const av = (v as any)?.attribute_values || {}
      Object.keys(av).forEach((k) => keys.add(k))
    }
    const preferred: string[] = Array.isArray((augmentedProduct as any)?.attribute_order)
      ? (augmentedProduct as any).attribute_order.filter((k: string) => keys.has(k))
      : []
    const rest = Array.from(keys).filter((k) => !preferred.includes(k))
    return [...preferred, ...rest]
  }, [variants, augmentedProduct])

  const attributeOptions: AttrMap = useMemo(() => {
    const map: AttrMap = {}
    for (const key of attributeKeys) {
      const set = new Set<string>()
      for (const v of variants as any[]) {
        const av = (v as any)?.attribute_values || {}
        const val = av[key]
        if (val) set.add(String(val))
      }
      map[key] = Array.from(set)
    }
    return map
  }, [attributeKeys, variants])

  const [attrs, setAttrs] = useState<AttrSelection>({})

  const initSelection = useCallback(() => {
    setAttrs((prev) => {
      const next: AttrSelection = { ...prev }
      for (const key of attributeKeys) {
        if (!next[key]) {
          const first = attributeOptions[key]?.[0]
          if (first) next[key] = first
        }
      }
      return next
    })
  }, [attributeKeys, attributeOptions])

  const getPriceInfo = () => {
    if (!augmentedProduct || !variants.length) return { minPrice: 0, originalMinPrice: 0, maxDiscount: 0 }
    const minPrice = Math.min(...(variants as any[]).map((v: ProductVariant) => v.sale_price))
    const originalMinPrice = Math.min(...(variants as any[]).map((v: ProductVariant) => v.regular_price))
    const maxDiscount = Math.max(
      ...(variants as any[]).map((v: ProductVariant) =>
        Math.round(((v.regular_price - v.sale_price) / v.regular_price) * 100),
      ),
    )
    return { minPrice, originalMinPrice, maxDiscount }
  }
  const { minPrice, originalMinPrice, maxDiscount } = getPriceInfo()
  const hasDiscount = minPrice < originalMinPrice && maxDiscount > 0

  const [quantity, setQuantity] = useState<number>(1)

  const selectedVariant: ProductVariant | undefined = useMemo(() => {
    if (attributeKeys.length === 0) return variants.length > 0 ? variants[0] : undefined;
    for (const key of attributeKeys) {
      if (!attrs[key]) return undefined
    }
    return (variants as any[]).find((v: ProductVariant) => {
      const av = (v as any)?.attribute_values || {}
      return attributeKeys.every((k) => String(av[k]) === String(attrs[k]))
    })
  }, [variants, attrs, attributeKeys])

  const {
    data: stockData,
    isFetching: stockLoading,
    isError: stockError,
    refetch: refetchStock,
  } = useGetStockQuery(
    selectedVariant && open && !isPreOrderProduct // Only check stock if not pre-order
      ? { variant: (selectedVariant as any)._id, productId: (augmentedProduct as any)._id }
      : (undefined as any),
    {
      skip: !selectedVariant || !open || isPreOrderProduct, // Skip if pre-order
      refetchOnMountOrArgChange: true,
    },
  )

  const availableQty: number = stockData?.data?.available_quantity ?? 0
  const outOfStock = !!selectedVariant && !isPreOrderProduct && !stockLoading && availableQty <= 0

  const availableValuesFor = useCallback(
    (key: string): Set<string> => {
      const otherKeys = attributeKeys.filter((k) => k !== key)
      const pool = (variants as any[]).filter((v: ProductVariant) => {
        const av = (v as any)?.attribute_values || {}
        return otherKeys.every((k) => !attrs[k] || String(av[k]) === String(attrs[k]))
      })
      const set = new Set<string>()
      for (const v of pool) {
        const av = (v as any)?.attribute_values || {}
        if (av[key]) set.add(String(av[key]))
      }
      return set
    },
    [attributeKeys, attrs, variants],
  )

  const navBlockedUntilRef = useRef<number>(0)
  const blockNav = (ms = 400) => {
    navBlockedUntilRef.current = Date.now() + ms
  }

  const handleOpenChange = (val: boolean) => {
    blockNav(500)
    if (val) {
      initSelection()
      // Pre-orders are quantity 1
      setQuantity(isPreOrderProduct ? 1 : 1)
    }
    setOpen(val)
  }

  const noteModalPointer = () => blockNav(500)

  const handleCardClick = (e: MouseEvent<HTMLDivElement>) => {
    if (open || Date.now() < navBlockedUntilRef.current) return
    const target = e.target as HTMLElement
    if (target.closest("button, a, input, select, textarea") || target.closest("[data-no-nav]")) return
    router.push(`/product/${augmentedProduct.slug}`)
  }

  useEffect(() => {
    if (isPreOrderProduct) {
      setQuantity(1);
      return;
    }
    if (!selectedVariant) return
    const min = augmentedProduct.min_order_qty || 1
    const merchantMax = augmentedProduct.max_order_qty ?? Number.MAX_SAFE_INTEGER
    const hardMax = Math.min(merchantMax, Math.max(0, availableQty))
    setQuantity((q) => {
      if (hardMax <= 0) return min
      return Math.min(Math.max(q, min), hardMax)
    })
  }, [availableQty, augmentedProduct.min_order_qty, augmentedProduct.max_order_qty, selectedVariant, isPreOrderProduct])

  const onConfirmAddOrPreorder = async () => {
    if (!selectedVariant) {
      toast.error("Please choose required options")
      return
    }

    const min = augmentedProduct.min_order_qty || 1
    const merchantMax = augmentedProduct.max_order_qty ?? Number.MAX_SAFE_INTEGER

    if (quantity < min) {
      toast.error(`Minimum order is ${min}`)
      return
    }
    if (augmentedProduct.max_order_qty && quantity > augmentedProduct.max_order_qty) {
      toast.error(`Maximum order is ${augmentedProduct.max_order_qty}`)
      return
    }

    if (!isPreOrderProduct) {
      if (stockLoading) {
        toast.message("Checking stock…")
        return
      }
      if (availableQty <= 0) {
        toast.error("This variant is out of stock")
        return
      }
      if (quantity > availableQty) {
        toast.error(`Only ${availableQty} left in stock`)
        return
      }
    }


    try {
      setInternalLoading(true)

      if (isPreOrderProduct) {
        // Pre-Order Flow
        if (currentPreOrder && currentPreOrder.productId !== augmentedProduct._id) {
          toast.error("You can only have one pre-order at a time. Clear the existing one first.");
          return;
        }

        dispatch(
          setPreOrder({
            productId: (augmentedProduct as any)._id,
            variantId: (selectedVariant as any)._id,
            attributes: { ...attrs },
            priceSnapshot: (selectedVariant as any).sale_price,
            advancePaymentPercentage: advancePct,
            expectedDeliveryDays: expectedDays,
            name: augmentedProduct.name,
            image: selectedVariant?.image || augmentedProduct.thumbnail,
            sku: selectedVariant?.sku || (augmentedProduct as any).sku,
          })
        );
        toast.success("Pre-order locked in! You can complete payment at checkout.");
        router.push("/pre-order?order_now=true");
      } else {
        dispatch(
          addItem({
            productId: (augmentedProduct as any)._id,
            variantId: (selectedVariant as any)._id,
            attributes: { ...attrs },
            quantity,
            priceSnapshot: (selectedVariant as any).sale_price,
          }),
        )

        toast.success(
          `Added: ${augmentedProduct.name} • ${attributeKeys.map((k) => `${k}:${attrs[k]}`).join(" / ")} × ${quantity}`,
        )
      }

      handleOpenChange(false)
    } catch (error: any) {
      console.error("Cart/Pre-order error:", error)
      toast.error(isPreOrderProduct ? "Failed to place pre-order" : "Failed to add to cart")
    } finally {
      setInternalLoading(false)
    }
  }

  const onSaveForLater = async () => {
    if (!selectedVariant) {
      toast.error("Please choose required options")
      return
    }
    try {
      setInternalLoading(true)
      dispatch(
        saveForLaterAdd({
          productId: (augmentedProduct as any)._id,
          variantId: (selectedVariant as any)._id,
          attributes: { ...attrs },
          name: augmentedProduct.name,
          image: selectedVariant?.image || augmentedProduct.thumbnail,
          priceSnapshot: (selectedVariant as any).sale_price,
        })
      );
      toast.success("Saved for later ✨");
      handleOpenChange(false);
    } catch {
      toast.error("Failed to save for later");
    } finally {
      setInternalLoading(false);
    }
  }

  if (!augmentedProduct) return null

  const PriceBlock = ({ price, original}: { price: number; original?: number }) => (
    <div className="flex items-baseline gap-2">
      <span className="text-lg font-medium tracking-wide">Tk {price.toLocaleString()}</span>
      {!!original && original > price && (
        <span className="text-xs text-muted-foreground line-through">Tk {original.toLocaleString()}</span>
      )}
      {!!original && original > price && (
        <span className="ml-1 inline-flex items-center rounded-full bg-rose-600/10 text-rose-700 px-2 py-0.5 text-[10px] font-medium">
          -{Math.round(((original - price) / original) * 100)}%
        </span>
      )}
      {isPreOrderProduct && (
          <span className=" bg-primary/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-bl-md text-[10px] font-medium flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            PRE-ORDER
          </span>
        )}
    </div>
  )

  const ColorDot = ({ value, active, disabled }: { value: string; active: boolean; disabled: boolean }) => {
    const isNamed = [
      "white", "black", "red", "blue", "green", "yellow", "purple", "pink", "gray", "grey", "brown", "orange", "teal", "navy",
    ].includes(value.toLowerCase())
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          if (!disabled) setAttrs((s) => ({ ...s, Color: value }))
        }}
        className={`relative h-8 w-8 rounded-full border transition
          ${active ? "ring-2 ring-primary border-primary" : "border-gray-200 hover:border-gray-300"}
          ${disabled ? "opacity-40 cursor-not-allowed" : ""}
        `}
        title={value}
        aria-label={value}
        data-no-nav
        disabled={disabled}
        style={{
          background:
            value.toLowerCase() === "white" ? "#fff" :
              value.toLowerCase() === "black" ? "#000" : isNamed ? value.toLowerCase() : undefined,
        }}
      >
        {!isNamed && (
          <span className="absolute inset-0 grid place-items-center text-[10px] uppercase text-gray-700">
            {value}
          </span>
        )}
        {active && (
          <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-white">
            <Check className="h-3 w-3" />
          </span>
        )}
      </button>
    )
  }

  const Qty = () => {
    const min = augmentedProduct.min_order_qty || 1
    const merchantMax = augmentedProduct.max_order_qty ?? Number.MAX_SAFE_INTEGER
    const hardMax = Math.min(merchantMax, Math.max(0, availableQty))

    // For pre-order, quantity is always 1, and controls are disabled
    const displayQty = isPreOrderProduct ? 1 : quantity;
    const isDisabled = isPreOrderProduct || internalLoading;

    return (
      <div className="inline-flex items-center rounded-full border bg-background px-1" data-no-nav>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
            setQuantity((q) => Math.max(min, q - 1))
          }}
          disabled={isDisabled || displayQty <= min}
          data-no-nav
        >
          -
        </Button>
        <Input
          type="number"
          min={min}
          max={hardMax === Number.MAX_SAFE_INTEGER ? undefined : hardMax}
          value={displayQty}
          onChange={(e) => {
            if (isPreOrderProduct) return;
            const val = Number(e.target.value || 0)
            if (Number.isNaN(val)) return
            const clamped = Math.min(Math.max(val, min), hardMax)
            setQuantity(clamped)
          }}
          onPointerDown={noteModalPointer}
          onClick={(e) => e.stopPropagation()}
          className="h-8 w-14 text-center border-0 focus-visible:ring-0"
          data-no-nav
          readOnly={isPreOrderProduct}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
            setQuantity((q) => Math.min(q + 1, hardMax))
          }}
          disabled={isDisabled || displayQty >= hardMax}
          data-no-nav
        >
          +
        </Button>
      </div>
    )
  }

  const SummaryHeader = () => (
    <div className="flex items-start gap-4">
      <div className="relative h-20 w-20 overflow-hidden rounded-md bg-muted/40">
        <Image
          src={augmentedProduct.thumbnail || "/placeholder.svg?height=80&width=80"}
          alt={augmentedProduct.name}
          fill
          className="object-cover"
          sizes="80px"
        />
        
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium leading-tight mb-1">{augmentedProduct.name}</h4>
        <div className="text-[11px] text-muted-foreground mb-1">{augmentedProduct.category?.name}</div>
        <PriceBlock price={minPrice} original={hasDiscount ? originalMinPrice : undefined} />
      </div>
    </div>
  )

  const ModalBody = () => (
    <div className="space-y-4" data-no-nav>

      {isPreOrderProduct && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col gap-2 shadow-inner">
          <div className="flex items-center gap-2 text-sm font-medium text-primary-mid">
            <Info className="w-4 h-4" />
            <span>Pre-Order Reservation Details</span>
          </div>
          <p className="text-xs text-gray-700">
            Secure your item now. Pre-orders are limited to <b>1 unit</b> per customer.
          </p>
          <ul className="list-disc list-inside text-xs text-gray-800 space-y-1 pl-2">
            {advancePct > 0 ? (
              <li className="font-medium text-primary-mid">
                Advance Payment: <b>{advancePct}%</b> (Tk {Math.round(minPrice * (advancePct / 100)).toLocaleString()})
              </li>
            ) : (
              <li>No advance payment required.</li>
            )}
            {expectedDays && <li>Estimated Shipping: Approx. <b>{expectedDays} days</b> from order.</li>}
          </ul>
        </div>
      )}

      {/* Attributes */}
      {attributeKeys.map((key) => {
        const available = availableValuesFor(key)
        const values = attributeOptions[key] || []
        return (
          <div key={key} className="space-y-2">
            <Label className="text-xs">{key}</Label>
            <div className="flex flex-wrap gap-2" data-no-nav>
              {values.map((val) => {
                const isActive = attrs[key] === val
                const isDisabled = !available.has(val)
                const isColor = key.toLowerCase() === "color"
                return isColor ? (
                  <ColorDot key={val} value={val} active={isActive} disabled={isDisabled} />
                ) : (
                  <button
                    key={val}
                    className={`px-3 py-1.5 rounded-full border text-xs transition
                      ${isActive ? "border-primary text-primary bg-primary/10" : "border-gray-200 hover:border-gray-300"}
                      ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}
                    `}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isDisabled) setAttrs((s) => ({ ...s, [key]: val }))
                    }}
                    disabled={isDisabled}
                    data-no-nav
                  >
                    {val}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Quantity */}
      <div className="space-y-2">
        <Label className="text-xs">Quantity</Label>
        <div className="flex items-center gap-2">
          <Qty />
          {!isPreOrderProduct && (
            <p className="text-[11px] text-muted-foreground">
              Min {augmentedProduct.min_order_qty || 1}
              {augmentedProduct.max_order_qty ? ` • Max ${augmentedProduct.max_order_qty}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Stock Info - only show for standard product (pre-order is assumed available for reservation) */}
      {!isPreOrderProduct && (
        <div className="text-[11px]">
          {stockLoading && <span className="text-muted-foreground">Checking stock…</span>}
          {!stockLoading && stockError && <span className="text-amber-700">Couldn’t check stock. Try again.</span>}
          {!stockLoading && !stockError && selectedVariant && (
            outOfStock ? (
              <span className="text-red-600 font-medium">Out of stock</span>
            ) : (
              <span className="text-emerald-700">
                In stock: <span className="font-medium">{availableQty}</span>
              </span>
            )
          )}
          {!!selectedVariant && (
            <button
              type="button"
              className="ml-2 text-[11px] underline text-muted-foreground"
              onClick={(e) => { e.stopPropagation(); refetchStock() }}
            >
              refresh
            </button>
          )}
        </div>
      )}

      {/* Info perks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {augmentedProduct.is_free_delivery && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
            <Truck className="h-4 w-4 text-emerald-600" />
            <span className="text-xs">Free Delivery</span>
          </div>
        )}
        {augmentedProduct.warranty && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
            <Shield className="h-4 w-4 text-sky-700" />
            <span className="text-xs">{augmentedProduct.warranty}</span>
          </div>
        )}
      </div>
    </div>
  )

  const StickyFooter = () => {
    const totalAmount = selectedVariant ? (selectedVariant as any).sale_price : 0; // Quantity is 1 for pre-order
    const standardTotalAmount = selectedVariant ? (selectedVariant as any).sale_price * quantity : 0;

    const payNow = isPreOrderProduct
      ? Math.round(totalAmount * (advancePct / 100))
      : standardTotalAmount;

    const mainButtonLabel = internalLoading
      ? (isPreOrderProduct ? "Processing..." : "Adding...")
      : isPreOrderProduct
        ? "Pre-Order Now"
        : (outOfStock ? "Out of stock" : "Add to cart");

    const mainButtonDisabled = internalLoading || !selectedVariant || (!isPreOrderProduct && (stockLoading || outOfStock));

    return (
      <div
        className="sticky bottom-0 left-0 flex items-center justify-center right-0 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3"
        data-no-nav
        onPointerDown={noteModalPointer}
      >
        <div className="flex items-center  justify-between gap-3">
          <div className="text-sm font-medium">
            {isPreOrderProduct ? (
              <div className="flex flex-col text-xs">
                <span>Advance Payment:</span>
                <span className="text-base font-bold text-primary-mid">Tk {payNow.toLocaleString()}</span>
              </div>
            ) : (
              <div className="flex flex-col text-xs">
                <span>Total:</span>
                <span className="text-base font-bold">Tk {payNow.toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {isPreOrderProduct && (
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveForLater();
                }}
                disabled={internalLoading || !selectedVariant}
                data-no-nav
                className="hover:bg-primary/10 border-primary text-primary"
              >
                Save for later
              </Button>
            )}
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onConfirmAddOrPreorder()
              }}
              disabled={mainButtonDisabled}
              data-no-nav
              className={cn( isPreOrderProduct && "bg-primary hover:bg-primary")}
            >
              {mainButtonLabel}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn("group cursor-pointer transform transition-all duration-300", className)}
      onClick={handleCardClick}
      data-no-nav={open ? true : undefined}
    >
      <div className="relative bg-white rounded-sm md:border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:border-gray-200">

        {/* Top-left badges */}
        <div className="absolute top-3 left-3 z-20 space-y-1 pointer-events-none">
          {augmentedProduct.product_type === 'pre_order' && (
            <div className="bg-primary text-white text-[10px] font-medium px-2.5 py-1 rounded-full shadow-lg">
              PRE-ORDER
            </div>
          )}
          {augmentedProduct.offer_tags?.includes("new-arrival") && (
            <div className="bg-green-600 text-white text-[10px] font-medium px-2.5 py-1 rounded-full shadow-sm">
              New
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            dispatch(toggleItem({ productId: (augmentedProduct as any)._id }))
            toast[isInWishlist ? "message" : "success"](isInWishlist ? "Removed from wishlist" : "Added to wishlist")
          }}
          className="absolute top-1.5 right-2 z-20 bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200 rounded-full p-1 hover:shadow-sm hover:scale-110"
          aria-label="Toggle wishlist"
          data-no-nav
        >
          <Heart
            className={`w-3.5 h-3.5 transition-all duration-200 ${isInWishlist ? "text-primary fill-primary scale-110" : "text-gray-500 hover:text-primary"
              }`}
          />
        </button>

        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          <Link href={`/product/${augmentedProduct.slug}`} aria-label={augmentedProduct.name}>
            <Image
              src={augmentedProduct.thumbnail || "/placeholder.svg?height=300&width=300&query=product image"}
              alt={augmentedProduct.name}
              fill
              className="group-hover:scale-110 transition-transform duration-500 object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </Link>
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {augmentedProduct.is_free_delivery && (
            <div className="absolute left-3 bottom-3 z-20 flex flex-wrap gap-2 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium text-emerald-700 bg-white/80 backdrop-blur-md ring-1 ring-white/60 shadow-sm">
                <Truck className="w-3.5 h-3.5" />
                Free Delivery
              </span>
            </div>
          )}
        </div>

        <div className="md:px-2 py-2">
          <div className="text-xs hidden md:block text-gray-500 mb-1 font-medium">{augmentedProduct.category?.name}</div>
          <h3 className="font-medium text-xs text-gray-900 mb-1 line-clamp-2 leading-tight tracking-wide">
            <Link href={`/product/${augmentedProduct.slug}`} className="hover:underline">
              {augmentedProduct.name}
            </Link>
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 tracking-wide">
                Tk {minPrice.toLocaleString()}
                {variants.length > 1 && <span className="text-xs text-gray-500"></span>}
              </span>
              {hasDiscount && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 line-through font-medium">
                    Tk {originalMinPrice.toLocaleString()}
                  </span>
                  <span className="text-xs text-red-600 font-medium">-{maxDiscount}%</span>
                </div>
              )}
            </div>

            {/* Add to cart/Pre-order trigger */}
            <Button
              size="icon"
              className="bg-primary-mid hover:bg-primary-mid text-white p-2.5 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                blockNav(600)
                handleOpenChange(true)
              }}
              aria-label={isPreOrderProduct ? "View pre-order options" : "Choose options and add to cart"}
              data-no-nav
            >
              {isPreOrderProduct ? <Clock className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            </Button>

            {/* Bottom Sheet / Dialog */}
            {isMobile ? (
              <Sheet open={open} onOpenChange={handleOpenChange}>
                <SheetContent
                  side="bottom"
                  className="min-h-[50vh] p-0 rounded-t-2xl overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out"
                  data-no-nav
                  onPointerDown={noteModalPointer}
                >
                  {/* Drag handle */}
                  <div className="sticky top-0 z-20 grid place-items-center pt-2 pb-1 bg-background/70 backdrop-blur">
                    <span className="h-1.5 w-12 rounded-full bg-muted" />
                  </div>

                  <div className="flex h-full flex-col" data-no-nav>
                    <div className="px-4 pb-3">
                      <SheetHeader className="text-left">
                        <SheetTitle className="sr-only">{isPreOrderProduct ? "Pre-Order Options" : "Add to Cart"}</SheetTitle>
                      </SheetHeader>
                      <SummaryHeader />
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-4">
                      <div className="h-px bg-muted mb-4" />
                      <ModalBody />
                      <div className="h-24" />
                    </div>

                    <SheetFooter className="p-0">
                      <StickyFooter />
                    </SheetFooter>
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent
                  className="sm:max-w-[620px] p-0 overflow-hidden rounded-xl"
                  data-no-nav
                  onPointerDown={noteModalPointer}
                >
                  <DialogHeader className="px-5 pt-5 pb-3 text-left" data-no-nav>
                    <DialogTitle className="sr-only" data-no-nav>
                      {isPreOrderProduct ? "Pre-Order Options" : "Add to Cart"}
                    </DialogTitle>
                    <SummaryHeader />
                  </DialogHeader>

                  <div className="px-5">
                    <div className="h-px bg-muted mb-4" />
                    <ModalBody />
                  </div>

                  <DialogFooter className="p-0">
                    <StickyFooter />
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-500 ease-out" />
      </div>
    </div>
  )
}

export default ProductCard;
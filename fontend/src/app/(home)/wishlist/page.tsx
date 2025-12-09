"use client"

import { useEffect, useMemo, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, ShoppingCart, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { useAppDispatch, useAppSelector } from "@/redux/store"
import {
  selectWishlistItems,
  removeItem as removeWish,
  removeByKey,
  clearWishlist,
} from "@/redux/features/wishlist-slice"
import { addItem as addToCart } from "@/redux/features/cart-slice"

import { useGetProductsByIdsQuery } from "@/redux/api/api-query"

type ApiVariant = {
  _id: string
  attributes?: string[]
  attribute_values?: Record<string, string>
  regular_price?: number
  sale_price?: number
  sku?: string
  image?: string | null
  product?: string
}

type ApiProduct = {
  _id: string
  name: string
  thumbnail?: string | null
  sku?: string
  variants?: ApiVariant[]
  price?: number
}

const getId = (p: { _id?: string; id?: string }) => p._id ?? p.id ?? ""
const getVarId = (v: { _id?: string; id?: string }) => v._id ?? v.id ?? ""
const money = (n?: number) => `Tk ${(n ?? 0).toFixed(2)}`

function unitPriceOf(product: ApiProduct, variant?: ApiVariant) {
  if (variant?.sale_price != null) return variant.sale_price
  if (variant?.regular_price != null) return variant.regular_price
  return product.price ?? 0
}

function pickVariant(product: ApiProduct, wishedVariantId?: string): ApiVariant | undefined {
  const list = product.variants ?? []
  if (wishedVariantId) {
    const v = list.find((vv) => getVarId(vv) === wishedVariantId)
    if (v) return v
  }
  return list[0]
}

export default function WishlistPage() {
  const dispatch = useAppDispatch()
  const wishlist = useAppSelector(selectWishlistItems)

  const ids = useMemo(() => Array.from(new Set(wishlist.map((w) => w.productId))), [wishlist])

  const { data: resp, isFetching } = useGetProductsByIdsQuery(ids, { skip: ids.length === 0 })

  const products: ApiProduct[] = useMemo(() => (Array.isArray(resp?.data) ? (resp!.data as ApiProduct[]) : []), [resp])

  const productMap = useMemo(() => {
    const m = new Map<string, ApiProduct>()
    for (const p of products) {
      const key = getId(p)
      if (key) m.set(key, p)
    }
    return m
  }, [products])

  const hasFullCoverage = useMemo(() => {
    if (ids.length === 0) return false
    return ids.every((id) => productMap.has(id))
  }, [ids, productMap])

  useEffect(() => {
    if (ids.length === 0) return
    if (isFetching) return
    if (!hasFullCoverage) return

    let cleaned = 0
    for (const line of wishlist) {
      const p = productMap.get(line.productId)
      if (!p) {
        dispatch(removeByKey({ productId: line.productId, variantId: line.variantId }))
        cleaned++
        continue
      }
      if (line.variantId && (p.variants?.length ?? 0) > 0) {
        const ok = p.variants!.some((v) => getVarId(v) === line.variantId)
        if (!ok) {
          dispatch(removeByKey({ productId: line.productId, variantId: line.variantId }))
          cleaned++
        }
      }
    }
    if (cleaned > 0) toast.message("Your wishlist was updated to remove unavailable items.")
  }, [ids.length, isFetching, hasFullCoverage, wishlist, productMap, dispatch])

  const enriched = useMemo(() => {
    return wishlist
      .map((line) => {
        const product = productMap.get(line.productId)
        if (!product) return null

        const variant = line.variantId
          ? ((product.variants ?? []).find((v) => getVarId(v) === line.variantId) ?? (product.variants ?? [])[0])
          : (product.variants ?? [])[0]

        const unitPrice = unitPriceOf(product, variant)

        return {
          _rowId: line.id,
          productId: getId(product),
          wishedVariantId: line.variantId,
          product,
          variant,
          unitPrice,
        }
      })
      .filter(Boolean) as Array<{
      _rowId: string
      productId: string
      wishedVariantId?: string
      product: ApiProduct
      variant?: ApiVariant
      unitPrice: number
    }>
  }, [wishlist, productMap])

  const totalItems = enriched.length
  const totalPrice = useMemo(() => enriched.reduce((sum, r) => sum + (r.unitPrice ?? 0), 0), [enriched])

  const handleMoveToCart = useCallback(
    (row: (typeof enriched)[number]) => {
      const chosenVariant = pickVariant(row.product, row.wishedVariantId)
      if (!chosenVariant) {
        toast.error("This product currently has no available variant.")
        return
      }
      dispatch(
        addToCart({
          productId: row.productId,
          variantId: getVarId(chosenVariant),
          attributes: {},
          quantity: 1,
          priceSnapshot: row.unitPrice,
        }),
      )
      dispatch(removeByKey({ productId: row.productId, variantId: row.wishedVariantId }))
      toast.success("Moved to cart.")
    },
    [dispatch],
  )

  const handleRemove = useCallback(
    (rowId: string) => {
      dispatch(removeWish({ id: rowId }))
      toast.message("Removed from wishlist.")
    },
    [dispatch],
  )

  const handleClearAll = useCallback(() => {
    dispatch(clearWishlist())
    toast.message("Wishlist cleared.")
  }, [dispatch])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6 lg:mb-8">
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-medium text-cart-secondary">My Wishlist</h1>
            {totalItems > 0 && (
              <p className="text-sm text-muted-foreground">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </p>
            )}
          </div>
          {totalItems > 0 && (
            <Button
              variant="outline"
              onClick={handleClearAll}
              className="border-primary text-primary hover:bg-primary hover:text-white transition-colors w-full sm:w-auto h-9 text-sm bg-transparent"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Clear All
            </Button>
          )}
        </div>

        {totalItems === 0 ? (
          <EmptyWishlist />
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {enriched.map((row) => (
              <Card
                key={row._rowId}
                className="group py-3 relative overflow-hidden border shadow-none border-border bg-background transition-shadow hover:shadow-sm"
              >
                <CardContent className="px-3">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="relative aspect-square w-full sm:w-20 md:w-24 lg:w-28 sm:shrink-0 overflow-hidden rounded bg-muted">
                      <Image
                        src={row.product.thumbnail || "/placeholder.svg?height=256&width=256&query=product"}
                        alt={row.product.name}
                        width={256}
                        height={256}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-medium text-foreground leading-snug line-clamp-2 mb-0.5">
                            {row.product.name}
                          </h3>
                          {(row.product.sku || row.variant?.sku) && (
                            <p className="text-xs text-muted-foreground">SKU: {row.variant?.sku || row.product.sku}</p>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(row._rowId)}
                          aria-label="Remove from wishlist"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {!!row.variant?.attribute_values && Object.keys(row.variant.attribute_values).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(row.variant.attribute_values).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="rounded text-xs px-2 py-0.5 font-normal">
                              <span className="mr-1 uppercase text-muted-foreground text-[10px]">{key}:</span>
                              <span className="text-foreground">{String(value)}</span>
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg sm:text-xl font-medium text-primary">{money(row.unitPrice)}</span>
                        </div>

                        <Button
                          onClick={() => handleMoveToCart(row)}
                          className="bg-primary hover:bg-primary-mid text-white transition-colors w-full sm:w-auto h-9 text-sm"
                        >
                          <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                          Move to Cart
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyWishlist() {
  return (
    <Card className="shadow-none border-dashed">
      <CardContent className="py-12 sm:py-16 flex flex-col items-center justify-center text-center px-4">
        <div className="rounded-full bg-muted p-5 mb-4">
          <Heart className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
        </div>
        <h2 className="text-lg sm:text-xl font-medium text-cart-secondary mb-1.5">Your wishlist is empty</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Save items you love and find them here later. Start exploring our collection!
        </p>
        <Link href="/" className="mt-6">
          <Button className="bg-primary hover:bg-primary-mid text-white h-9 px-5 text-sm transition-colors">
            Browse Products
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

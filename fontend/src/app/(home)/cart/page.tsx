"use client"

import { ShoppingCart, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import CartItemComponent from "@/components/cart/cart-item"
import { CartSummary } from "@/components/cart/cart-summary"
import Link from "next/link"
import { Container } from "@/components/common/container"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useMemo } from "react"
import { toast } from "sonner"

import { useAppDispatch, useAppSelector } from "@/redux/store" // or hooks.ts if you keep typed hooks there
import { removeItem, selectCartItems } from "@/redux/features/cart-slice"
import { useGetProductsByIdsQuery } from "@/redux/api/api-query"
import type { Product, ProductVariant } from "@/types/product"

type CartItemView = {
  _id: string
  product: {
    _id: string
    name: string
    sku?: string
    thumbnail?: string | null
  }
  variant: string
  attributes: Record<string, string>
  quantity: number
  price: number
}

const CartPage = () => {
  const dispatch = useAppDispatch()
  const lines = useAppSelector(selectCartItems)

  const productIds = useMemo(() => Array.from(new Set(lines.map((l) => l.productId))), [lines])
  const {
    data: productsRes,
    isLoading,
    error,
    isFetching,
  } = useGetProductsByIdsQuery(productIds, {
    skip: productIds.length === 0,
  })

  const productMap = useMemo(() => {
    const arr: Product[] = (productsRes as any)?.data ?? []
    const map = new Map<string, Product>()
    for (const p of arr) map.set(p._id, p)
    return map
  }, [productsRes])

  useEffect(() => {
    if (!productsRes || productIds.length === 0) return

    const toRemove = new Set<string>()

    for (const line of lines) {
      const product = productMap.get(line.productId)
      if (!product) {
        toRemove.add(line.id)
        continue
      }
      const variant = (product.variants || []).find((v: ProductVariant) => v._id === line.variantId)
      if (!variant) {
        toRemove.add(line.id)
      }
    }

    if (toRemove.size > 0) {
      toast.error("Some items in your cart are no longer available and have been removed.")
      toRemove.forEach((id) => dispatch(removeItem({ id })))
    }
  }, [productsRes, productIds.length, lines, productMap, dispatch])

  const viewItems: CartItemView[] = useMemo(() => {
    const out: CartItemView[] = []
    for (const line of lines) {
      const product = productMap.get(line.productId)
      if (!product) continue
      const variant = (product.variants || []).find((v) => v._id === line.variantId)
      if (!variant) continue
      out.push({
        _id: line.id,
        product: {
          _id: product._id,
          name: product.name,
          sku: (product as any)?.sku,
          thumbnail: product.thumbnail,
        },
        variant: variant._id,
        attributes: line.attributes,
        quantity: line.quantity,
        price: variant.sale_price ?? line.priceSnapshot ?? 0,
      })
    }
    return out
  }, [lines, productMap])

  const totalPrice = useMemo(() => viewItems.reduce((sum, it) => sum + it.price * it.quantity, 0), [viewItems])

  const { originalPrice, savings, savingsPercentage } = useMemo(() => {
    let original = 0
    let current = 0

    for (const line of lines) {
      const product = productMap.get(line.productId)
      if (!product) continue
      const variant = (product.variants || []).find((v) => v._id === line.variantId)
      if (!variant) continue

      const salePrice = variant.sale_price ?? 0
      const regularPrice = variant.regular_price ?? salePrice

      current += salePrice * line.quantity
      original += regularPrice * line.quantity
    }

    const savedAmount = original - current
    const percentage = original > 0 ? (savedAmount / original) * 100 : 0

    return {
      originalPrice: original,
      savings: savedAmount,
      savingsPercentage: percentage,
    }
  }, [lines, productMap])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-8 w-48 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
              <div className="lg:col-span-1">
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-medium text-gray-900 mb-4">Error loading cart</h2>
          <p className="text-gray-600 mb-4">Please try again later</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  const isEmpty = viewItems.length === 0

  return (
    <div className="">
      {/* Header */}
      <div className=" py-6">
        <Container className="">
          <div className="flex max-w-6xl mx-auto items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                <h1 className="text-xl font-medium">Shopping Cart</h1>
              </div>
            </div>
            <div className="text-sm opacity-90">
              {viewItems.length} {viewItems.length === 1 ? "item" : "items"}
            </div>
          </div>
        </Container>
      </div>

      <Container className="  py-8">
        <div className="max-w-6xl mx-auto">
          {isEmpty ? (
            // Empty Cart State
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-medium text-gray-900 mb-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Looks like you haven&apos;t added any items to your cart yet. Start shopping to fill it up!
              </p>
              <Link href="/">
                <Button className="cart-primary hover:cart-primary-mid text-white px-8 py-3">Start Shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium text-secondary">Cart Items ({viewItems.length})</h2>
                    <div className="text-sm text-gray-500">
                      Total: Tk {totalPrice.toFixed(2)} {isFetching ? "(updating…)" : ""}
                    </div>
                  </div>

                  {viewItems.map((item) => (
                    <CartItemComponent key={item._id} item={item} />
                  ))}
                </div>
              </div>

              {/* Cart Summary */}
              <div className="lg:col-span-1">
                <CartSummary
                  itemCount={viewItems.length}
                  totalPrice={totalPrice}
                  originalPrice={originalPrice}
                  savings={savings}
                  savingsPercentage={savingsPercentage}
                />
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}

export default CartPage

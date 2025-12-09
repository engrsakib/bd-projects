"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Container } from "@/components/common/container"
import ProductCard from "@/components/common/product-card"
import ProductCardSkeleton from "@/components/common/product-card-skeleton"
import { useGetProductsQuery } from "@/redux/api/api-query"
import type { Product } from "@/types/product"

type Idish = { _id?: string | number; id?: string | number }
const getId = (p: Partial<Product> & Idish) => String((p as any)._id ?? (p as any).id)

const ExploreProducts = () => {
  const [wishlist, setWishlist] = useState<string[]>([])
  const toggleWishlist = (productId: string) => {
    setWishlist(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    )
  }

  const LIMIT = 20
  const [page, setPage] = useState(1)

  const [items, setItems] = useState<Product[]>([])
  const [total, setTotal] = useState<number | null>(null)

  const [lastFetchedCount, setLastFetchedCount] = useState<number | null>(null)


  const [showFetching, setShowFetching] = useState(false)

  // RTK Query
  const { data, isLoading, isFetching, isError, refetch } = useGetProductsQuery({
    page,
    limit: LIMIT,
  })

  useEffect(() => {
    const pageItems: Product[] = (data as any)?.data?.data ?? []
    const meta = (data as any)?.data?.meta

    if (meta?.total !== undefined && meta?.total !== null) {
      setTotal(Number(meta.total))
    }

    setLastFetchedCount(pageItems.length)


    if (page === 1 && !isLoading) {
      setItems(pageItems)
      return
    }


    if (page > 1 && pageItems.length > 0) {
      setItems(prev => {
        const map = new Map<string, Product>()
        for (const p of prev) map.set(getId(p), p)
        for (const p of pageItems) map.set(getId(p), p)
        return Array.from(map.values())
      })
    }
  }, [data, isLoading, page])

  const hasMore = useMemo(() => {
    if (total != null) return items.length < total
    if (lastFetchedCount == null) return true 
    return lastFetchedCount === LIMIT
  }, [items.length, total, lastFetchedCount])

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null
    if (isFetching && hasMore) {
      t = setTimeout(() => setShowFetching(true), 200)
    } else {
      setShowFetching(false)
    }
    return () => {
      if (t) clearTimeout(t)
    }
  }, [isFetching, hasMore])

  const canLoadMore = hasMore && !isFetching

  const observerRef = useRef<IntersectionObserver | null>(null)

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      // disconnect previous
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
      if (!node) return
      if (!hasMore) return

      observerRef.current = new IntersectionObserver(
        entries => {
          const first = entries[0]
          if (first.isIntersecting && canLoadMore) {
            setPage(p => p + 1)
          }
        },
        {
          root: null,
          rootMargin: "0px 0px 600px 0px",
          threshold: 0,
        }
      )
      observerRef.current.observe(node)
    },
    [canLoadMore, hasMore]
  )

  if (isLoading && page === 1) {
    return (
      <Container className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4 py-16">
        {Array.from({ length: LIMIT }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </Container>
    )
  }

  if (isError) {
    return (
      <div className="py-16">
        <Container>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-500">Failed to load products</h2>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-white hover:opacity-90"
            >
              Try again
            </button>
          </div>
        </Container>
      </div>
    )
  }

  const nothingToShow = !isLoading && items.length === 0

  return (
    <div className="py-4">
      <Container>
        <div className="">
          <div className="inline-block">
            <h2 className="md:text-2xl text-base text-secondary mb-3 tracking-tight">
              Explore Products
            </h2>
          </div>
        </div>

        {nothingToShow ? (
          <div className="py-12 text-center text-sm md:text-base text-muted-foreground">
            No products found.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
              {items.map((product: Product) => {
                const pid = getId(product)
                return (
                  <ProductCard
                    key={pid}
                    product={product as any}
                    onWishlistToggle={toggleWishlist as any}
                    isInWishlist={wishlist.includes(pid)}
                  />
                )
              })}
              {showFetching && hasMore && lastFetchedCount === LIMIT &&
                Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={`sk-${i}`} />)}
            </div>
            {hasMore && <div ref={sentinelRef} className="h-10 w-full" />}
          </>
        )}
      </Container>
    </div>
  )
}

export default ExploreProducts

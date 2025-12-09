"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Sparkles, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import ProductCard from "@/components/common/product-card"
import type { Product } from "@/types/product"
import { useGetProductsQuery } from "@/redux/api/api-query"
import { useSearchParams, useRouter } from "next/navigation"
import { Container } from "@/components/common/container"

type SortOption = "name" | "price-low" | "price-high" | "rating" | "newest"

interface Filters {
  priceRange: [number, number]
  colors: string[]
  categories?: string[]      // stores category IDs
  subcategory: string
  offerTags: string[]
  ratings: number[]
  inStock: boolean
  freeDelivery: boolean
  search: string
}

interface ShopProps {
  /** category id from /shop/[categoryId] */
  initialCategoryId?: string | null
}

const ProductSkeleton = () => (
  <div className="premium-card premium-shadow rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-1/3" />
    </div>
  </div>
)

const Shop = ({ initialCategoryId }: ShopProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<Filters>({
    priceRange: [0, 10000],
    colors: [],
    // categories: initialCategoryId ? [initialCategoryId] : [],   // ← if API uses `category`, you can use this
    subcategory: initialCategoryId ?? '',                          // ← you were using subcategory string
    offerTags: [],
    ratings: [],
    inStock: false,
    freeDelivery: false,
    search: "",
  })

  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [priceRangeInitialized, setPriceRangeInitialized] = useState(false)

  // bootstrap meta (colors, categories, min/max)
  const initialQuery = useGetProductsQuery({ page: 1, limit: 1 })

  const filterOptions = useMemo(() => {
    if (!initialQuery.data?.data)
      return {
        colors: [] as string[],
        categories: [] as { id: string; name: string }[],
        subcategories: [] as string[],
        offerTags: [] as string[],
        minPrice: 0,
        maxPrice: 1000,
      }

    const products = initialQuery.data.data.data

    const colors = [
      ...new Set(
        products.flatMap((p) => p.variants?.map((v) => v?.attribute_values?.Color).filter(Boolean) || [])
      ),
    ]
      .filter((c): c is string => typeof c === "string")
      .sort()

    const categoriesMap = new Map<string, { id: string; name: string }>()
    for (const p of products) {
      const id = p?.category?._id
      const name = p?.category?.name
      if (id && name) categoriesMap.set(id, { id, name })
    }
    const categories = Array.from(categoriesMap.values()).sort((a, b) => a.name.localeCompare(b.name))

    const subcategories = [...new Set(products.map((p) => p?.subcategory?.name).filter(Boolean))] as string[]
    const offerTags = initialQuery.data.data.meta.offer_tags || []
    const minPrice = initialQuery.data.data.meta.min_price || 0
    const maxPrice = initialQuery.data.data.meta.max_price || 1000

    return { colors, categories, subcategories, offerTags, minPrice, maxPrice }
  }, [initialQuery.data])

  const queryParams = useMemo(() => {
    const params: any = {
      page,
      limit: 12,
      sortBy: sortBy === "newest" ? "createdAt" : sortBy === "name" ? "name" : "createdAt",
      sortOrder: sortBy === "price-low" ? "asc" : "desc",
    }

    if (filters.search) params.search_query = filters.search
    if (filters.inStock) params.stock = "in"

    // category id (from prop or UI)
    // if (filters.categories && filters.categories.length > 0) params.category = filters.categories[0]   // ← use if backend expects `category`
    if (filters.subcategory) params.subcategory = filters.subcategory                                     // ← you were missing this; now it refetches

    // if (filters.subcategories.length > 0) params.subcategory = filters.subcategories[0]
    if (filters.priceRange[0] > filterOptions.minPrice) params.min_price = filters.priceRange[0]
    if (priceRangeInitialized && filters.priceRange[1] < filterOptions.maxPrice) {
      params.max_price = filters.priceRange[1]
    }
    if (filters.colors.length > 0) params.color = filters.colors[0]
    if (filters.offerTags.length > 0) params.offerTags = filters.offerTags.join(",")

    return params
  }, [filters, sortBy, page, priceRangeInitialized, filterOptions])

  const { data, isLoading, isFetching, error, refetch } = useGetProductsQuery(queryParams, {
    skip: !filterOptions || filterOptions.maxPrice === 1000,
  })

  // 🔧 keep filters in sync when the URL param / prop changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      // categories: initialCategoryId ? [initialCategoryId] : [], // ← if using `category`
      subcategory: initialCategoryId ?? '',
    }))
    setPage(1)
    setAllProducts([])
  }, [initialCategoryId])

  // aggregate infinite pages
  useEffect(() => {
    if (data?.data) {
      if (page === 1) {
        setAllProducts(data.data.data)
      } else {
        setAllProducts((prev) => [...prev, ...data.data.data])
      }
      const totalPages = Math.ceil(data.data.meta.total / data.data.meta.limit)
      setHasMore(page < totalPages)
    }
  }, [data, page])

  // reset page on dependencies
  useEffect(() => {
    setPage(1)
    setAllProducts([])
  }, [filters, sortBy])

  // init price range once
  useEffect(() => {
    if (
      filterOptions.minPrice !== undefined &&
      filterOptions.maxPrice !== undefined &&
      !priceRangeInitialized
    ) {
      setFilters((prev) => ({
        ...prev,
        priceRange: [filterOptions.minPrice, filterOptions.maxPrice],
      }))
      setPriceRangeInitialized(true)
    }
  }, [filterOptions.minPrice, filterOptions.maxPrice, priceRangeInitialized])

  // helpers
  const updateFilter = (key: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const toggleArrayFilter = (
    key: "colors" | "offerTags" | "ratings",
    value: string | number
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value as never)
        ? (prev[key].filter((item) => item !== value) as never)
        : ([...prev[key], value] as never),
    }))
  }

  const clearFilters = () => {
    setFilters({
      priceRange: [filterOptions.minPrice, filterOptions.maxPrice],
      colors: [],
      // categories: initialCategoryId ? [initialCategoryId] : [],   // ← preserved comment
      subcategory: initialCategoryId ?? '',
      offerTags: [],
      ratings: [],
      inStock: false,
      freeDelivery: false,
      search: "",
    })
  }

  const [wishlist, setWishlist] = useState<string[]>([])
  const [cart, setCart] = useState<string[]>([])

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]))
  }

  // infinite scroll
  const hasMoreAndNotFetching = hasMore && !isFetching
  const loadMore = useCallback(() => {
    if (hasMoreAndNotFetching) {
      setPage((prev) => prev + 1)
    }
  }, [hasMoreAndNotFetching])

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMore()
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [loadMore])

  if ((initialQuery.isLoading || isLoading) && allProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50/30">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            {/* Skeleton Sidebar */}
            <aside className="w-full lg:w-80">
              <div className="premium-card premium-shadow rounded-2xl p-4 sm:p-6 lg:p-8 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-6" />
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-10 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-6 bg-gray-200 rounded" />
                </div>
              </div>
            </aside>

            {/* Skeleton Products */}
            <main className="flex-1">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-pink-100/50 mb-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3" />
              </div>
              <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Container className="py-2 sm:py-8 min-h-screen">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {showFilters && (
            <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowFilters(false)} />
          )}
          <aside
            className={cn(
              "w-full lg:w-80 transition-all duration-300 z-50",
              "fixed lg:relative top-0 left-0 h-full lg:h-auto",
              "bg-white lg:bg-transparent overflow-y-auto lg:overflow-visible",
              showFilters ? "translate-x-0 mt-14" : "-translate-x-full lg:translate-x-0"
            )}
          >
            <div className="premium-card premium-shadow rounded-none lg:rounded-2xl p-4 sm:p-6 lg:p-8 lg:sticky lg:top-24 h-full lg:h-auto">
              <div className="flex items-center justify-between mb-6 lg:mb-8">
                <h2 className="text-lg lg:text-xl font-serif font-semibold text-[#0e012d] flex items-center">
                  <Sparkles className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-[#ee7fde]" />
                  Filter
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-[#ee7fde] hover:bg-pink-50 text-xs lg:text-sm"
                  >
                    Clear All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="lg:hidden p-1">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-4 lg:space-y-6 mb-6 lg:mb-8">
                <h3 className="font-serif font-medium text-[#0e012d] text-sm lg:text-base">Price Range</h3>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilter("priceRange", value)}
                  min={filterOptions.minPrice}
                  max={filterOptions.maxPrice}
                  step={50}
                  className="w-full [&_[role=slider]]:bg-[#ee7fde] [&_[role=slider]]:border-[#ee7fde]"
                />
                <div className="flex justify-between text-xs lg:text-sm font-medium text-slate-600">
                  <span className="bg-pink-50 px-2 lg:px-3 py-1 rounded-full">Tk {filters.priceRange[0]}</span>
                  <span className="bg-pink-50 px-2 lg:px-3 py-1 rounded-full">Tk {filters.priceRange[1]}</span>
                </div>
              </div>

              {/* Categories (IDs stored, names displayed) */}
              {/* {filterOptions.categories.length > 0 && (
                <div className="space-y-3 lg:space-y-4 mb-6 lg:mb-8">
                  <h3 className="font-serif font-medium text-[#0e012d] text-sm lg:text-base">Categories</h3>
                  <div className="space-y-2 lg:space-y-3">
                    {filterOptions.categories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center space-x-2 lg:space-x-3 cursor-pointer group"
                      >
                        <Checkbox
                          checked={filters.categories?.includes(category.id) ?? false}
                          onCheckedChange={() => toggleArrayFilter("categories" as any, category.id)}
                          className="data-[state=checked]:bg-[#ee7fde] data-[state=checked]:border-[#ee7fde] h-4 w-4 lg:h-5 lg:w-5"
                        />
                        <span className="text-xs lg:text-sm font-sans text-slate-700 group-hover:text-[#ee7fde] transition-colors">
                          {category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )} */}

              {/* Colors */}
              {filterOptions.colors.length > 0 && (
                <div className="space-y-3 lg:space-y-4 mb-6 lg:mb-8">
                  <h3 className="font-serif font-medium text-[#0e012d] text-sm lg:text-base">Colors</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3">
                    {filterOptions.colors.map((color) => (
                      <label key={color} className="flex items-center space-x-2 lg:space-x-3 cursor-pointer group">
                        <Checkbox
                          checked={filters.colors.includes(color)}
                          onCheckedChange={() => toggleArrayFilter("colors", color)}
                          className="data-[state=checked]:bg-[#ee7fde] data-[state=checked]:border-[#ee7fde] h-4 w-4 lg:h-5 lg:w-5"
                        />
                        <span className="text-xs lg:text-sm font-sans text-slate-700 group-hover:text-[#ee7fde] transition-colors">
                          {color}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {filterOptions.offerTags.length > 0 && (
                <div className="space-y-3 lg:space-y-4 mb-6 lg:mb-8">
                  <h3 className="font-serif font-medium text-[#0e012d] text-sm lg:text-base">Offers</h3>
                  <div className="space-y-2 lg:space-y-3">
                    {filterOptions.offerTags.map((tag) => (
                      <label key={tag} className="flex items-center space-x-2 lg:space-x-3 cursor-pointer group">
                        <Checkbox
                          checked={filters.offerTags.includes(tag)}
                          onCheckedChange={() => toggleArrayFilter("offerTags", tag)}
                          className="data-[state=checked]:bg-[#ee7fde] data-[state=checked]:border-[#ee7fde] h-4 w-4 lg:h-5 lg:w-5"
                        />
                        <span className="text-xs lg:text-sm font-sans text-slate-700 group-hover:text-[#ee7fde] transition-colors">
                          {tag.replace(/_/g, " ")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Filters */}
              <div className="space-y-3 lg:space-y-4 pt-4 lg:pt-6 border-t border-pink-100">
                <label className="flex items-center space-x-2 lg:space-x-3 cursor-pointer group">
                  <Checkbox
                    checked={filters.inStock}
                    onCheckedChange={(checked) => updateFilter("inStock", checked)}
                    className="data-[state=checked]:bg-[#ee7fde] data-[state=checked]:border-[#ee7fde] h-4 w-4 lg:h-5 lg:w-5"
                  />
                  <span className="text-xs lg:text-sm font-sans text-slate-700 group-hover:text-[#ee7fde] transition-colors">
                    In Stock Only
                  </span>
                </label>
                <label className="flex items-center space-x-2 lg:space-x-3 cursor-pointer group">
                  <Checkbox
                    checked={filters.freeDelivery}
                    onCheckedChange={(checked) => updateFilter("freeDelivery", checked)}
                    className="data-[state=checked]:bg-[#ee7fde] data-[state=checked]:border-[#ee7fde] h-4 w-4 lg:h-5 lg:w-5"
                  />
                  <span className="text-xs lg:text-sm font-sans text-slate-700 group-hover:text-[#ee7fde] transition-colors">
                    Free Delivery
                  </span>
                </label>
              </div>
            </div>
          </aside>

          <main className="flex-1 w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 lg:mb-8 bg-white/60 backdrop-blur-sm rounded-xl lg:rounded-2xl sm:p-6 gap-4 sm:gap-0">
              <div className="flex items-center space-x-4 sm:space-x-6 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden border-pink-200 hover:bg-pink-50 text-sm"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                    <SelectTrigger className="w-full sm:w-56 border-pink-200 focus:border-primary text-sm lg:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="newest">Newest Arrivals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div
              className={cn(
                "grid gap-2 sm:gap-4 lg:gap-6",
                "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
              )}
            >
              {allProducts.map((product) => (
                <ProductCard
                  isInWishlist={wishlist.includes(product._id)}
                  onWishlistToggle={toggleWishlist}
                  product={product}
                  key={product._id}
                />
              ))}
            </div>

            {/* Loading State */}
            {isFetching && allProducts.length > 0 && (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#ee7fde]" />
                <span className="ml-2 text-slate-600">Loading more products...</span>
              </div>
            )}

            {/* Load More Button */}
            {hasMore && !isFetching && allProducts.length > 0 && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={loadMore}
                  className="bg-[#ee7fde] hover:bg-[#d666c7] text-white px-8 py-3 rounded-xl"
                >
                  Load More Products
                </Button>
              </div>
            )}

            {/* No Products Found */}
            {!isLoading && !isFetching && allProducts.length === 0 && (
              <div className="text-center py-12 sm:py-16 bg-white/60 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-pink-100/50">
                <div className="max-w-md mx-auto px-4">
                  <Sparkles className="h-12 w-12 sm:h-16 sm:w-16 text-[#ee7fde] mx-auto mb-4 sm:mb-6" />
                  <h3 className="text-lg sm:text-xl font-serif font-semibold text-[#0e012d] mb-2 sm:mb-3">
                    No products found
                  </h3>
                  <p className="text-slate-600 font-sans mb-4 sm:mb-6 text-sm sm:text-base">
                    We couldn&apos;t find any products matching your criteria. Try adjusting your filters to discover
                    more options.
                  </p>
                  <Button
                    onClick={clearFilters}
                    className="bg-[#ee7fde] hover:bg-[#d666c7] text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl text-sm sm:text-base"
                  >
                    Reset All Filters
                  </Button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center py-12 sm:py-16 bg-red-50 rounded-xl lg:rounded-2xl border border-red-200">
                <div className="max-w-md mx-auto px-4">
                  <h3 className="text-lg sm:text-xl font-serif font-semibold text-red-600 mb-2 sm:mb-3">
                    Error Loading Products
                  </h3>
                  <p className="text-red-500 font-sans mb-4 sm:mb-6 text-sm sm:text-base">
                    There was an error loading the products. Please check your connection and try again.
                  </p>
                  <Button
                    onClick={() => refetch()}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl text-sm sm:text-base"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </Container>
    </div>
  )
}

export default Shop

"use client"
import { Container } from "@/components/common/container"
import ProductCard from "@/components/common/product-card"
import ProductCardSkeleton from "@/components/common/product-card-skeleton"
import { useGetProductsQuery } from "@/redux/api/api-query"
import { Product } from "@/types/product"
import { useState } from "react"



const FeaturedProducts = () => {
  const [wishlist, setWishlist] = useState<number[]>([])

  const { data, isLoading } = useGetProductsQuery({ limit: 10, page: 1, offerTags: 'featured' })


  const toggleWishlist = (productId: number) => {
    setWishlist((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]))
  }


  if (!data || isLoading) {
    return <Container className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
      {
        Array.from({ length: 10 }).map((_, index) => <ProductCardSkeleton key={index} />)
      }
    </Container>
  }

  if (data.data.data.length === 0) return null;

  return (
    <div className="mt-5">
      <Container className="">
        <div className="">
          <div className="inline-block">
            <h2 className="md:text-2xl text-lg  mb-3 tracking-tight">Featured Products</h2>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
          {data?.data?.data?.map((product: Product) => (
            <ProductCard
              key={product._id}
              product={product as any}
              onWishlistToggle={toggleWishlist as any}
              isInWishlist={wishlist.includes(product._id as any)}
            />
          ))}
        </div>
      </Container>
    </div>
  )
}

export default FeaturedProducts;
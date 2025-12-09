"use client"
import { Heart, ShoppingCart, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Product {
  id: number
  name: string
  slug: string
  img: string
  price: number
  category: string
  discountPrice: number
  rating: number
  reviews: number
}

interface ProductCardProps {
  product: Product
  onWishlistToggle: (productId: number) => void
  onAddToCart: (productId: number) => void
  isInWishlist: boolean
}

export default function ProductCard({ product, onWishlistToggle, onAddToCart, isInWishlist }: ProductCardProps) {
  const calculateDiscount = (price: number, discountPrice: number) => {
    return Math.round(((price - discountPrice) / price) * 100)
  }

  return (
    <Link href={`/product/${product.slug}`}>
      <div className="group cursor-pointer transform  transition-all duration-300">
        <div className="relative bg-white rounded-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:border-gray-200">
          {product.discountPrice < product.price && (
            <div className="absolute top-3 left-3 z-10 bg-primary text-white text-xs font-semibold px-2.5 py-1 rounded-full ">
              -{calculateDiscount(product.price, product.discountPrice)}%
            </div>
          )}
  
          <button
            onClick={() => onWishlistToggle(product.id)}
            className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-sm hover:bg-white transition-all duration-200 rounded-full p-2  hover:shadow-sm hover:scale-110"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-all duration-200 ${isInWishlist ? "text-primary fill-primary scale-110" : "text-gray-500 hover:text-primary"
                }`}
            />
          </button>
  
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
            <Image
              src={product.img || "/placeholder.svg"}
              alt={product.name}
              fill
              className="group-hover:scale-110 transition-transform duration-500 object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
  
          {/* Product Info */}
          <div className="p-4">
            {/* Product Name */}
            <h3 className="font-semibold text-xs text-secondary mb-2 line-clamp-2 leading-tight tracking-wide">
              {product.name}
            </h3>
  
            {/* Rating */}
            <div className="flex items-center gap-1 mb-3">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 transition-colors duration-200 ${i < Math.floor(product.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                      }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 font-medium">({product.reviews})</span>
            </div>
  
            {/* Price and Cart Button */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-secondary tracking-wide">
                  Tk {product.discountPrice.toLocaleString()}
                </span>
                {product.discountPrice < product.price && (
                  <span className="text-xs text-gray-500 line-through font-medium">
                    Tk {product.price.toLocaleString()}
                  </span>
                )}
              </div>
  
              {/* Premium Icon-only Add to Cart Button */}
              <button
                data-cart-btn={product.id}
                onClick={() => onAddToCart(product.id)}
                className="bg-primary-mid hover:bg-[#8f4b8c] text-white p-2.5 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            </div>
          </div>
  
          {/* Premium Bottom Accent */}
          <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-500 ease-out"></div>
        </div>
      </div>
    </Link>
  )
}

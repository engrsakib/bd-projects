"use client"

import type React from "react"
import Image from "next/image"

interface SearchResultItemProps {
  product: {
    _id: string
    name: string
    thumbnail: string
    variants: Array<{
      regular_price: number
      sale_price: number
    }>
  }
  onClick: () => void
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ product, onClick }) => {
  // Get the lowest price from variants
  const getLowestPrice = () => {
    if (!product.variants || product.variants.length === 0) return null

    const prices = product.variants.map((variant) => variant.sale_price || variant.regular_price)
    return Math.min(...prices)
  }

  // Get the highest regular price for comparison
  const getHighestRegularPrice = () => {
    if (!product.variants || product.variants.length === 0) return null

    const regularPrices = product.variants.map((variant) => variant.regular_price)
    return Math.max(...regularPrices)
  }

  const lowestPrice = getLowestPrice()
  const highestRegularPrice = getHighestRegularPrice()
  const hasDiscount = lowestPrice && highestRegularPrice && lowestPrice < highestRegularPrice

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 focus:outline-none focus:bg-gray-50"
    >
      <div className="w-12 h-12 relative flex-shrink-0">
        <Image
          src={product.thumbnail || "/placeholder.svg?height=48&width=48"}
          alt={product.name}
          fill
          className="object-cover rounded-md"
          sizes="48px"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
        {lowestPrice && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-semibold text-gray-900">${lowestPrice.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-xs text-gray-500 line-through">${highestRegularPrice?.toFixed(2)}</span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}

export default SearchResultItem

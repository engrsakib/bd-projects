"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Package, Sparkles } from "lucide-react"
import { useGetAllSubCategoriesQuery } from "@/redux/api/api-query"
import { Container } from "@/components/common/container"

const CategorySkeleton = () => (
  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 animate-pulse">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
      <div className="space-y-2 text-center">
        <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
        <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
      </div>
    </div>
  </div>
)

const CategoriesSection = () => {
  const { data, isLoading, error } = useGetAllSubCategoriesQuery({})

  const subcategories = data?.data?.data || []

  const colorVariants = [
    "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700",
    "bg-green-50 hover:bg-green-100 border-green-200 text-green-700",
    "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700",
    "bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-700",
    "bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700",
    "bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-700",
    "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700",
    "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700",
  ]

  return (
    <section className="py-16 bg-white">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-2xl font-medium text-gray-900 mb-3">Browse Collections</h2>
          <p className="text-gray-600 max-w-2xl text-sm mx-auto">Discover amazing products across our curated categories</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <CategorySkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Failed to load categories</p>
          </div>
        ) : subcategories.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No categories available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {subcategories.map((subcategory: any, index: number) => (
              <Button
                key={subcategory.id || subcategory._id}
                variant="ghost"
                className={`${colorVariants[index % colorVariants.length]} h-auto p-4 flex flex-col items-center gap-3 border hover:border-primary/50 transition-all duration-200 hover:shadow-lg group rounded-2xl`}
              >
                <div className="relative">
                  <div className="w-12 h-12 relative">
                    {subcategory.image ? (
                      <Image
                        src={subcategory.image || "/placeholder.svg"}
                        alt={subcategory.name}
                        fill
                        className="object-cover rounded-full group-hover:scale-110 transition-transform duration-200"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{subcategory.name}</h3>
                  <p className="text-xs opacity-75">{subcategory.category?.name || "Category"}</p>
                </div>
              </Button>
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}

export default CategoriesSection

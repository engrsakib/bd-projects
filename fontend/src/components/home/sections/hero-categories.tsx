"use client"

import { useEffect } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Image from "next/image"
import { Package } from "lucide-react"
import { Container } from "@/components/common/container"
import { useGetAllSubCategoriesQuery } from "@/redux/api/api-query"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"

const CategorySkeleton = () => (
  <div className="embla__slide shrink-0 basis-1/4 sm:basis-1/5 md:basis-1/6 lg:basis-1/7 xl:basis-1/8 min-w-0">
    <div className="bg-white rounded-2xl p-3">
      <div className="mx-auto mb-2 h-14 w-14 rounded-xl overflow-hidden bg-gray-100" />
      <div className="h-4 w-3/4 mx-auto bg-gray-100 rounded" />
    </div>
  </div>
)

const HeroCategories = () => {
  const { data, isLoading, error } = useGetAllSubCategoriesQuery({})
  const subcategories = data?.data?.data || []
  const router = useRouter();
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  })

  return (
    <section className="md:hidden py-2">
      <Container>
        <div className="relative">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex gap-2 items-start">
              {isLoading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <CategorySkeleton key={i} />
                ))
              ) : error ? (
                <div className="py-12 w-full text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Failed to load categories</p>
                </div>
              ) : subcategories.length === 0 ? null : (
                subcategories.map((subcategory: any) => (
                  <button
                    key={subcategory.id || subcategory._id}
                    onClick={() => {
                      const href = subcategory?._id
                        ? `/shop/${subcategory?._id}`
                        : subcategory?.slug
                          ? `/shop/${subcategory?.slug}`
                          : "#";
                      router.push(href);
                    }}
                    type="button"
                    className="embla__slide shrink-0 basis-1/5 sm:basis-1/5 md:basis-1/6 lg:basis-1/7 xl:basis-1/8 min-w-0 text-center"
                  >
                    <div className="bg-white rounded-lg transition hover:shadow-lg hover:border-primary">
                      <div className="mx-auto mb-2 h-14 w-16 rounded-xl overflow-hidden bg-gray-50 relative">
                        {subcategory.image ? (
                          <Image
                            src={subcategory.image}
                            alt={subcategory.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-medium text-gray-800 leading-tight line-clamp-1 ">
                        {subcategory.name}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

export default HeroCategories
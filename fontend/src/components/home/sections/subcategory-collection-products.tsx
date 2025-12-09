"use client"

import { useCallback, useMemo, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight, ChevronRight as ArrowRight } from "lucide-react"
import { Container } from "@/components/common/container"
import ProductCard from "@/components/common/product-card"
import ProductCardSkeleton from "@/components/common/product-card-skeleton"
import { useGetAllSubCategoriesQuery, useGetProductsQuery } from "@/redux/api/api-query"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type Subcategory = {
    _id: string
    slug: string
    name_en?: string
    name_bn?: string
}

const emblaBaseOptions = {
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
    breakpoints: {
        "(min-width: 768px)": { slidesToScroll: 2 },
        "(min-width: 1024px)": { slidesToScroll: 3 },
    },
}

function SubcategorySection({ name, slug }: { name: string; slug: string }) {
    const { data: products, isLoading } = useGetProductsQuery(
        {
            limit: 30,
            page: 1,
            sortBy: "createdAt",
            sortOrder: "asc",
            subcategory: slug,
        },
        { skip: !slug }
    )

    const [emblaRef, emblaApi] = useEmblaCarousel(emblaBaseOptions as any)
    const [showArrows, setShowArrows] = useState(false)

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

    const slideClass = "shrink-0 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5  min-w-0 select-none"

    const arrowBtn = "h-8 w-8 rounded-full bg-white/90 border border-black/10 shadow-sm backdrop-blur flex items-center justify-center"

    return (
        <section className="w-full mt-8" aria-labelledby={`winter-${slug}`}>
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 id={`winter-${slug}`} className="font-bold uppercase tracking-wide text-secondary">
                        {name}
                    </h3>
                    <div className="mt-1 h-[2px] w-full bg-secondary" />
                </div>

                <Link href={`/shop/${slug}`} className="inline-flex text-xs items-center gap-2">
                    <Button
                        className="bg-secondary text-xs text-white hover:bg-secondary/90 rounded-md px-2 h-7 flex items-center justify-center md:h-9 gap-0"
                        variant="default"
                        size="sm"
                    >
                        See More <ArrowRight className="size-3" />
                    </Button>
                </Link>
            </div>

            <div
                className="relative"
                onMouseEnter={() => setShowArrows(true)}
                onMouseLeave={() => setShowArrows(false)}
            >
                <div
                    className={`
            pointer-events-none absolute inset-y-0 left-0 right-0 z-10
            flex items-center justify-between
            opacity-100 transition-opacity
            ${showArrows ? "md:opacity-100" : "md:opacity-0"}
          `}
                >
                    <button
                        onClick={scrollPrev}
                        aria-label="Previous products"
                        className={`${arrowBtn} pointer-events-auto ml-1`}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={scrollNext}
                        aria-label="Next products"
                        className={`${arrowBtn} pointer-events-auto mr-1`}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="overflow-x-hidden" ref={emblaRef}>
                    <div className="flex gap-2 md:max-h-[480px] max-h-[270px]">
                        {isLoading ? (
                            <>
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className={slideClass}>
                                        <ProductCardSkeleton />
                                    </div>
                                ))}
                            </>
                        ) : (
                            products?.success &&
                            products.data?.data.map((product: any, index: number) => (
                                <ProductCard className={slideClass} key={index} product={product} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

const SubcategorySectionByCollection = () => {
    const { data, isLoading } = useGetAllSubCategoriesQuery({})

    const winterSubs: Subcategory[] = useMemo(() => {
        const list = data?.data?.data ?? []
        if (!Array.isArray(list)) return []
        return list as Subcategory[]
    }, [data])

    if (isLoading && winterSubs.length === 0) return null
    if (!winterSubs.length) return null

    return (
        <Container>
            {winterSubs.map((sc) => (
                <SubcategorySection
                    key={sc._id || sc.slug}
                    name={sc.name_en || sc.name_bn || sc.slug}
                    slug={sc.slug}
                />
            ))}
        </Container>
    )
}

export default SubcategorySectionByCollection
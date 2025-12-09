"use client";

import { useState, useEffect, useMemo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/common/container";
import { useGetProductsQuery } from "@/redux/api/api-query";
import ProductCardSkeleton from "@/components/common/product-card-skeleton";
import HotDealCard from "./hot-deal-card";

const HotDealsSection =()=> {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: false,
        dragFree: true,
        containScroll: "trimSnaps",
        align: "start",
    });

    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    const { data, isLoading } = useGetProductsQuery({ offerTags: "Hot Deals", limit: 21, page: 1 });

    const [wishlist, setWishlist] = useState<Array<string | number>>([]);
    const toggleWishlist = (id: string | number) =>
        setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => {
            setCanScrollPrev(emblaApi.canScrollPrev());
            setCanScrollNext(emblaApi.canScrollNext());
        };
        emblaApi.on("select", onSelect);
        onSelect();
    }, [emblaApi]);

    const scrollPrev = () => emblaApi?.scrollPrev();
    const scrollNext = () => emblaApi?.scrollNext();

    if (isLoading || !data) {
        return (
            <Container className="grid grid-cols-3 gap-2 lg:grid-cols-7">
                {Array.from({ length: 7 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                ))}
            </Container>
        );
    }

    const products: any[] = data?.data?.data ?? [];
    if (!products.length) return null;

    return (
        <Container>
            <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 id={`hot-deals`} className="font-bold uppercase tracking-wide text-secondary">
                        Hot deals
                    </h3>
                    <div className="mt-1 h-[2px] w-full bg-secondary" />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={scrollPrev}
                        aria-label="Previous Slide"
                        disabled={!canScrollPrev}
                        className="border-primary text-primary size-7 bg-transparent hover:bg-primary hover:text-white"
                    >
                        <ChevronLeft className="size-3" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label="Next Slide"
                        onClick={scrollNext}
                        disabled={!canScrollNext}
                        className="border-primary text-primary size-7 bg-transparent hover:bg-primary hover:text-white"
                    >
                        <ChevronRight className="size-3" />
                    </Button>
                </div>
            </div>

            <div className="overflow-hidden px-1" ref={emblaRef}>
                <div className="flex gap-2">
                    {products.map((p) => (
                        <div
                            key={p._id}
                            className="shrink-0 basis-1/3 sm:basis-1/4 md:basis-1/5 "
                        >
                            <HotDealCard
                                product={p}
                                onWishlistToggle={toggleWishlist}
                                isInWishlist={wishlist.includes(p._id)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </Container>
    );
}

export default HotDealsSection;
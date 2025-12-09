"use client"

import React, { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Container } from "@/components/common/container"

const reviews = [
    {
        id: 1,
        name: "Sarah Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
        rating: 5,
        review:
            "Absolutely love these heels! The quality is outstanding and they're surprisingly comfortable for all-day wear.",
        product: "Black Stiletto Rhinestone Heels",
        date: "2 days ago",
    },
    {
        id: 2,
        name: "Emily Chen",
        avatar: "/placeholder.svg?height=40&width=40",
        rating: 5,
        review:
            "Perfect fit and gorgeous design. I've received so many compliments wearing these to events!",
        product: "Crystal Embellished Pumps",
        date: "1 week ago",
    },
    {
        id: 3,
        name: "Maria Rodriguez",
        avatar: "/placeholder.svg?height=40&width=40",
        rating: 4,
        review:
            "Great quality sandals, very comfortable for summer. The strappy design is exactly what I was looking for.",
        product: "Strappy Block Heel Sandals",
        date: "2 weeks ago",
    },
    {
        id: 4,
        name: "Jessica Taylor",
        avatar: "/placeholder.svg?height=40&width=40",
        rating: 5,
        review:
            "These wedges are a game-changer! Stylish yet comfortable enough for long walks. Highly recommend!",
        product: "Peep Toe Wedge Sandals",
        date: "3 weeks ago",
    },
]

const DotButton = ({
    selected,
    onClick,
}: {
    selected: boolean
    onClick: () => void
}) => (
    <button
        type="button"
        aria-label="Go to slide"
        onClick={onClick}
        className={[
            "h-2 w-2 rounded-full transition-all",
            selected ? "w-6 bg-[#ee7fde]" : "bg-gray-300 hover:bg-gray-400",
        ].join(" ")}
    />
)

const ArrowButton = ({
    direction,
    onClick,
    disabled,
}: {
    direction: "prev" | "next"
    onClick: () => void
    disabled: boolean
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={direction === "prev" ? "Previous slide" : "Next slide"}
        className={[
            "absolute top-1/2 -translate-y-1/2 z-10",
            direction === "prev" ? "left-2" : "right-2",
            "rounded-full border bg-white/90 backdrop-blur px-2 py-2 shadow",
            "hover:bg-white disabled:opacity-40",
        ].join(" ")}
    >
        {direction === "prev" ? (
            <ChevronLeft className="h-5 w-5" />
        ) : (
            <ChevronRight className="h-5 w-5" />
        )}
    </button>
)

const UserFeedback = () => {
    // embla setup
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        align: "start", // keep slides left-aligned
        dragFree: false,
    })

    const [selectedIndex, setSelectedIndex] = useState(0)
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

    const onSelect = useCallback(() => {
        if (!emblaApi) return
        setSelectedIndex(emblaApi.selectedScrollSnap())
    }, [emblaApi])

    const scrollTo = useCallback(
        (index: number) => emblaApi && emblaApi.scrollTo(index),
        [emblaApi]
    )

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

    useEffect(() => {
        if (!emblaApi) return
        setScrollSnaps(emblaApi.scrollSnapList())
        emblaApi.on("select", onSelect)
        emblaApi.on("reInit", () => {
            setScrollSnaps(emblaApi.scrollSnapList())
            onSelect()
        })
        onSelect()
    }, [emblaApi, onSelect])

    return (
        <Container className="py-12">

            <div className="text-center mb-12">
                <h2 className="text-2xl font-medium text-black mb-4">What Our Customers Say</h2>
                <p className="text-gray-600 text-sm max-w-2xl mx-auto">
                    Don&apos;t just take our word for it - hear from our satisfied customers who love their premium footwear
                </p>
            </div>

            <div className="relative">
                <ArrowButton direction="prev" onClick={scrollPrev} disabled={!emblaApi} />
                <ArrowButton direction="next" onClick={scrollNext} disabled={!emblaApi} />

                <div className="overflow-hidden" ref={emblaRef}>

                    <div className="flex">
                        {reviews.map((review) => (

                            <div
                                key={review.id}
                                className="min-w-0 flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] xl:flex-[0_0_25%] px-2"
                            >
                                <div className="h-full bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:border-[#ee7fde]/20 group">
                                    {/* Quote Icon */}
                                    <div className="flex justify-center mb-4">
                                        <Quote className="w-8 h-8 text-[#ee7fde] opacity-50" />
                                    </div>

                                    {/* Rating */}
                                    <div className="flex items-center justify-center gap-1 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                                    }`}
                                            />
                                        ))}
                                    </div>

                                    {/* Review Text */}
                                    <p className="text-gray-700 text-sm text-center mb-6 line-clamp-4 leading-relaxed">
                                        &quot;{review.review}&quot;
                                    </p>

                                    {/* Customer Info */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage src={review.avatar || "/placeholder.svg"} alt={review.name} />
                                            <AvatarFallback className="bg-[#ee7fde] text-white">
                                                {review.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="font-semibold text-[#0e012d] text-sm">{review.name}</h4>
                                            <p className="text-xs text-gray-500">{review.date}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dots */}
                <div className="mt-6 flex items-center justify-center gap-2">
                    {scrollSnaps.map((_, index) => (
                        <DotButton
                            key={index}
                            selected={index === selectedIndex}
                            onClick={() => scrollTo(index)}
                        />
                    ))}
                </div>
            </div>
        </Container>
    )
}

export default UserFeedback

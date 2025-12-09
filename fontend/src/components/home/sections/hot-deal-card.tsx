import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

type HotDealCardProps = {
    product: any;
    onWishlistToggle: (id: string | number) => void;
    isInWishlist: boolean;
    onAddToCart?: (p: any) => void;
};


const HotDealCard = ({ product, }: HotDealCardProps) => {
    const minPrice: number = useMemo(() => {
        const variants = product?.variants || [];
        if (!variants.length) return Number(product?.price) || 0;
        return Math.min(...variants.map((v: any) => Number(v.sale_price ?? v.regular_price ?? 0)));
    }, [product]);

    const originalMinPrice: number | undefined = useMemo(() => {
        const variants = product?.variants || [];
        if (!variants.length) return undefined;
        const vals = variants.map((v: any) => Number(v.regular_price ?? v.sale_price ?? 0));
        return Math.min(...vals);
    }, [product]);

    const hasDiscount = !!originalMinPrice && originalMinPrice > minPrice;
    const maxDiscount = hasDiscount
        ? Math.round(((Number(originalMinPrice) - Number(minPrice)) / Number(originalMinPrice)) * 100)
        : 0;

    return (
        <Link href={`/product/${product?.slug ?? "#"}`} className="block">
            <div className="group relative rounded-md border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="absolute  left-1 top-0 z-10">
                    <span className="bg-red-600 text-white text-[10px] md:text-[10px] font-medium px-2 py-0.5 rounded-full">
                        LIMITED TIME
                    </span>
                </div>

                {/* wishlist */}
                {/* <button
                    aria-label="Toggle wishlist"
                    className="absolute top-1 right-1 z-10 rounded-full bg-white/90 p-1.5 shadow-sm hover:scale-110 transition"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onWishlistToggle(product?._id);
                    }}
                >
                    <Heart className={`size-3 ${isInWishlist ? "text-primary fill-primary" : "text-gray-500"}`} />
                </button> */}

                <div className="relative aspect-[1/1] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                    <Image
                        src={product?.thumbnail || "/placeholder.svg?height=280&width=280"}
                        alt={product?.name || "Product"}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 12vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>

                <div className="p-2">
                    <h3 className="text-[12px] font-medium text-gray-900 leading-snug line-clamp-1 ">
                        {product?.name}
                    </h3>

                    <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="flex  md:items-center md:gap-1 flex-col">
                            <span className="text-[12px] font-medium tracking-wide">Tk {Number(minPrice).toLocaleString()}</span>
                            {hasDiscount && (
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-gray-500 line-through"> {Number(originalMinPrice).toLocaleString()}</span>
                                    <span className="text-[10px] text-red-600 font-medium">-{maxDiscount}%</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-500" />
            </div>
        </Link>
    );
}
export default HotDealCard;
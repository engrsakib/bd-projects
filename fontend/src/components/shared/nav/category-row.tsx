import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";

export default function CategoryRow({ subcategory }: { subcategory: any }) {
    const href = subcategory?.slug
        ? `/shop/${subcategory?.slug}`
        : subcategory?._id
            ? `/shop/${subcategory?._id}`
            : "#";

    return (
        <Link
            href={href}
            className="group flex items-center gap-3 py-2 rounded-md hover:bg-gray-50"
            aria-label={subcategory?.name || "subcategory"}
        >
            <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                {subcategory?.image ? (
                    <Image
                        src={subcategory.image}
                        alt={subcategory?.name || "subcategory"}
                        fill
                        sizes="40px"
                        className="object-cover"
                    />
                ) : (
                    <Package className="h-5 w-5 text-gray-400" />
                )}
            </div>
            <span className="text-sm text-gray-800 font-medium group-hover:text-gray-900 truncate">
                {subcategory?.name || "Unnamed"}
            </span>
        </Link>
    );
}

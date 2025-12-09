import { Skeleton } from "../ui/skeleton";

export default function OrderSkeleton() {
    return (
        <div className="rounded-lg border border-[#e5e7eb] bg-white overflow-hidden">
            <div className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="flex-1">
                                <Skeleton className="h-6 w-32 rounded  " />
                                <Skeleton className="mt-2 h-4 w-40 rounded  " />
                            </div>
                            <Skeleton className="h-8 w-24 rounded-full   flex-shrink-0" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i}>
                                    <Skeleton className="h-3 w-16 rounded  " />
                                    <Skeleton className="mt-2 h-5 w-20 rounded  " />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Price Section Skeleton */}
                    <div className="flex flex-col items-end gap-1 sm:ml-6">
                        <Skeleton className="h-3 w-20 rounded  " />
                        <Skeleton className="h-8 w-32 rounded  " />
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-300" />

            {/* Items Section Skeleton */}
            <div className="px-6 py-4">
                <div className="h-5 w-32 rounded  " />
            </div>
        </div>
    )
}

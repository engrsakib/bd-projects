import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const ProductCardSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("group cursor-pointer transform transition-all duration-300", className)}>
      <div className="relative bg-white rounded-sm border border-gray-100 overflow-hidden">
        <div className="absolute top-3 left-3 z-10">
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>

        <div className="absolute top-3 right-3 z-10">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          <Skeleton className="w-full h-full" />
        </div>

        <div className="p-4">
          <Skeleton className="h-3 w-16 mb-1" />

          <div className="mb-2">
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-3/4" />
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1">
              <Skeleton className="w-3 h-3 rounded" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="w-3 h-3 rounded" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>

          <Skeleton className="h-3 w-12 mb-2" />

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-3 w-12" />
            </div>

            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-200"></div>
      </div>
    </div>
  )
}

export default ProductCardSkeleton;
import { Skeleton } from "@/components/ui/skeleton";

export default function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-10 w-10 rounded-xl overflow-hidden bg-gray-100" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

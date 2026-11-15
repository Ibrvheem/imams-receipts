import { Skeleton } from "@/components/ui/skeleton";
import { RowsSkeleton, TitleSkeleton } from "../_components/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-7">
      <TitleSkeleton />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="col-span-2 h-[7.5rem]" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <RowsSkeleton rows={4} />
      </div>
    </div>
  );
}

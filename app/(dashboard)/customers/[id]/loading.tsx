import { Skeleton } from "@/components/ui/skeleton";
import { RowsSkeleton, TitleSkeleton } from "../../_components/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <TitleSkeleton />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
      <Skeleton className="h-[4.5rem]" />
      <RowsSkeleton rows={3} />
    </div>
  );
}

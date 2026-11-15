import { Skeleton } from "@/components/ui/skeleton";
import { TitleSkeleton } from "../../_components/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-6 lg:max-w-6xl lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div className="space-y-4">
        <TitleSkeleton />
        <Skeleton className="h-24" />
        <Skeleton className="h-12" />
      </div>
      <Skeleton className="aspect-[1/1.414] w-full" />
    </div>
  );
}

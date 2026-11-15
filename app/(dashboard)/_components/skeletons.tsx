import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder rows shaped like ReceiptRows / customer rows. */
export function RowsSkeleton({ rows = 5, avatar = false }: { rows?: number; avatar?: boolean }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex min-h-16 items-center gap-3 px-4 py-3">
          {avatar && <Skeleton className="size-10 shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TitleSkeleton({ sub = true }: { sub?: boolean }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-7 w-40" />
      {sub && <Skeleton className="h-4 w-56" />}
    </div>
  );
}

export function ListPageSkeleton({ filters = true, avatar = false }: { filters?: boolean; avatar?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <TitleSkeleton />
      <Skeleton className="h-11 w-full" />
      {filters && (
        <div className="flex gap-1.5">
          {[48, 60, 48, 56, 84].map((w, i) => (
            <Skeleton key={i} className="h-10" style={{ width: w }} />
          ))}
        </div>
      )}
      <RowsSkeleton rows={6} avatar={avatar} />
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 lg:max-w-7xl">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-14 lg:hidden" />
      <Skeleton className="h-11" />
      <Skeleton className="h-56" />
      <Skeleton className="h-40" />
    </div>
  );
}

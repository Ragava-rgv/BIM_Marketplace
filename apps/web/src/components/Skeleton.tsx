export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-paper-2 ${className}`} />;
}

/** Mirrors ListingCard's box model so grids don't reflow when real cards swap in. */
export function ListingCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[#E4E7EC] bg-white">
      <Skeleton className="h-[168px] w-full rounded-none" />
      <div className="flex flex-1 flex-col p-[14px] pb-4">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mb-3 mt-[7px] h-3 w-3/5" />
        <div className="mb-3 grid grid-cols-3 gap-px overflow-hidden rounded-[9px] border border-[#E4E7EC] bg-[#E4E7EC]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-[#FCFCFD] px-2.5 py-2">
              <Skeleton className="mb-[6px] h-2 w-8" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
        <Skeleton className="mb-3.5 h-3 w-2/5" />
        <div className="mt-auto flex items-center justify-between border-t border-[#E4E7EC] pt-[13px]">
          <div>
            <Skeleton className="mb-[6px] h-2 w-10" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-[38px] w-[90px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </>
  );
}

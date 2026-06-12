import { Skeleton } from "@/components/ui/skeleton";

export default function BlogPostLoading() {
  return (
    <div
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
      aria-busy="true"
      aria-label="Carregando artigo"
    >
      <Skeleton className="h-4 w-64 max-w-full" />

      <div className="mx-auto mt-6 max-w-3xl lg:mx-0 lg:max-w-none">
        <Skeleton className="mx-auto h-6 w-24 rounded-full lg:mx-0" />
        <Skeleton className="mx-auto mt-4 h-12 w-full max-w-2xl lg:mx-0" />
        <Skeleton className="mx-auto mt-3 h-6 w-full max-w-xl lg:mx-0" />
        <Skeleton className="mt-6 h-20 w-full rounded-2xl" />
      </div>

      <Skeleton className="mt-8 aspect-[4/3] w-full rounded-2xl sm:aspect-[21/9]" />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div>
          <Skeleton className="h-12 w-full rounded-2xl lg:hidden" />
          <Skeleton className="mt-6 h-12 w-full rounded-2xl" />
          <div className="mt-8 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ width: `${85 - (i % 3) * 12}%` }}>
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden space-y-6 lg:block">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

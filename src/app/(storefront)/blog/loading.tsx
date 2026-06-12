import { Skeleton } from "@/components/ui/skeleton";

export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8" aria-busy="true" aria-label="Carregando blog">
      <div className="text-center">
        <Skeleton className="mx-auto h-4 w-32" />
        <Skeleton className="mx-auto mt-3 h-10 w-48" />
        <Skeleton className="mx-auto mt-3 h-5 w-96 max-w-full" />
      </div>
      <Skeleton className="mt-10 aspect-[2/1] w-full rounded-2xl" />
      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-8 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-4" style={{ animationDelay: `${i * 80}ms` }}>
              <Skeleton className="aspect-[4/3] rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

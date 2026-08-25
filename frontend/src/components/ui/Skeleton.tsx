import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center space-x-4 w-full", className)}>
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}

/**
 * SkeletonTable is optimized for a fixed 4-column layout.
 * Do not use this if your actual table has different columns or dynamic widths,
 * as it will cause a layout shift when data loads. Compose from base Skeleton instead.
 */
export function SkeletonTable({ rows = 5, className }: { rows?: number, className?: string }) {
  return (
    <div className={cn("space-y-4 w-full", className)}>
      <div className="flex space-x-4 border-b pb-4">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-6 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 pt-2">
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col space-y-3 p-4 border rounded-xl shadow-sm", className)}>
      <Skeleton className="h-[125px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px] max-w-full" />
        <Skeleton className="h-4 w-[200px] max-w-full" />
      </div>
    </div>
  );
}

export { Skeleton };

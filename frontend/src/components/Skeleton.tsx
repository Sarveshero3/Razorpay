import React from "react";

export const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`animate-pulse bg-slate-800/60 border border-slate-700/30 rounded-sm ${className}`} />
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between border-b border-carbon-border pb-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-8 w-1/12" />
        <Skeleton className="h-8 w-1/12" />
        <Skeleton className="h-8 w-2/12" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-800/40">
            <Skeleton className="h-6 w-2/12" />
            <Skeleton className="h-6 w-3/12" />
            <Skeleton className="h-6 w-1/12" />
            <Skeleton className="h-6 w-2/12" />
            <Skeleton className="h-6 w-1/12" />
          </div>
        ))}
      </div>
    </div>
  );
};

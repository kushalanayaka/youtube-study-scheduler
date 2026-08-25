"use client";

import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200/80 rounded-xl ${className}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 py-2">
      <Skeleton className="h-28 w-full rounded-3xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function CourseSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Skeleton className="h-44 rounded-2xl" />
      <Skeleton className="h-44 rounded-2xl" />
      <Skeleton className="h-44 rounded-2xl" />
    </div>
  );
}

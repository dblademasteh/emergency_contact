"use client";

import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
  variant?: "default" | "rounded" | "circle";
  animate?: boolean;
};

const baseClasses =
  "bg-slate-200 dark:bg-slate-800 text-transparent";

const variants = {
  default: "rounded-xl",
  rounded: "rounded-xl",
  circle: "rounded-full",
};

const animations = {
  active: "animate-pulse",
  none: "",
};

export function Skeleton({ className, variant = "default", animate = true }: SkeletonProps) {
  return (
    <span
      className={cn(
        baseClasses,
        variants[variant],
        animate ? animations.active : animations.none,
        className
      )}
    />
  );
}

// Pre-built skeleton components for common UI patterns

export function ContactCardSkeleton() {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Skeleton variant="circle" className="h-12 w-12 shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Skeleton variant="circle" className="h-11 w-11" />
        <Skeleton variant="circle" className="h-9 w-9" />
        <Skeleton variant="circle" className="h-9 w-9" />
      </div>
    </article>
  );
}

export function GroupCardSkeleton() {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Skeleton variant="circle" className="h-12 w-12 shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton variant="circle" className="h-10 w-10 shrink-0" />
    </article>
  );
}

export function ContactListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ContactCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function AdminContentSkeleton() {
  return (
    <div className="space-y-4">
      {/* Contacts section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <ContactListSkeleton count={3} />
      </section>

      {/* Groups section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <GroupCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Types section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <ul className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/60"
            >
              <Skeleton variant="circle" className="h-9 w-9" />
              <div className="min-w-0 flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton variant="circle" className="h-9 w-9" />
              <Skeleton variant="circle" className="h-9 w-9" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
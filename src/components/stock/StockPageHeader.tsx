"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

type Crumb = { label: string; href?: string };

export function StockPageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  secondaryActions,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
  secondaryActions?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      {breadcrumbs?.length ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {breadcrumbs.map((c, idx) => (
            <div key={`${c.label}-${idx}`} className="flex items-center gap-2">
              {c.href ? (
                <Link href={c.href} className="hover:text-foreground transition-colors">
                  {c.label}
                </Link>
              ) : (
                <span className="text-foreground/80">{c.label}</span>
              )}
              {idx < breadcrumbs.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">{description}</p>
          ) : null}
        </div>

        {(actions || secondaryActions) && (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
            {secondaryActions}
            {actions}
          </div>
        )}
      </div>

      <div className={cn("border-b")} />
    </div>
  );
}

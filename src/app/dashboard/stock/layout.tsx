// app/dashboard/stock/layout.tsx
import type { ReactNode } from "react";
import { StockShell } from "@/components/stock/StockShell";

export default function StockLayout({ children }: { children: ReactNode }) {
  return <StockShell>{children}</StockShell>;
}

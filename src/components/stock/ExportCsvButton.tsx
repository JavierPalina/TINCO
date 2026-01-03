"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

function escapeCsv(v: unknown) {
  const s = String(v ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function ExportCsvButton<T>({
  filename,
  rows,
  columns,
  disabled,
}: {
  filename: string;
  rows: T[];
  columns: Array<{ header: string; value: (row: T) => unknown }>;
  disabled?: boolean;
}) {
  const onExport = () => {
    const head = columns.map((c) => escapeCsv(c.header)).join(",");
    const body = rows
      .map((r) => columns.map((c) => escapeCsv(c.value(r))).join(","))
      .join("\n");
    const csv = `${head}\n${body}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={onExport} disabled={disabled || rows.length === 0} className="gap-2">
      <Download className="h-4 w-4" />
      Exportar CSV
    </Button>
  );
}

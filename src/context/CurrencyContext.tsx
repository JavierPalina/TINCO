"use client";

import React, { createContext, useContext, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export type Moneda = "ARS" | "USD";

type CurrencyContextValue = {
  moneda: Moneda;
  setCurrency: (m: Moneda) => Promise<void>;
  formatMoney: (n: unknown) => string;
  currencySymbol: string;
};

const CurrencyContext = createContext<CurrencyContextValue>({
  moneda: "ARS",
  setCurrency: async () => {},
  formatMoney: (n) => `$${Number(n ?? 0).toLocaleString("es-AR")}`,
  currencySymbol: "$",
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data } = useQuery<{ moneda: Moneda }>({
    queryKey: ["settings", "moneda"],
    queryFn: async () => {
      const res = await axios.get<{ success: boolean; data: { moneda: Moneda } }>(
        "/api/settings/moneda"
      );
      return res.data.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const moneda: Moneda = data?.moneda ?? "ARS";

  const formatMoney = useCallback(
    (n: unknown) => {
      const num = typeof n === "number" ? n : Number(n ?? 0);
      const safe = Number.isFinite(num) ? num : 0;
      if (moneda === "USD") {
        return `US$ ${safe.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
      }
      return `$ ${safe.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
    },
    [moneda]
  );

  const setCurrency = useCallback(
    async (m: Moneda) => {
      await axios.put("/api/settings/moneda", { moneda: m });
      queryClient.setQueryData(["settings", "moneda"], { moneda: m });
    },
    [queryClient]
  );

  const currencySymbol = moneda === "USD" ? "US$" : "$";

  return (
    <CurrencyContext.Provider value={{ moneda, setCurrency, formatMoney, currencySymbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

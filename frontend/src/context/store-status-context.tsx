import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

export type StoreStatus = "open" | "pickup_only" | "closed";

interface StoreStatusContextType {
  status: StoreStatus;
  isLoading: boolean;
}

const StoreStatusContext = createContext<StoreStatusContextType>({ status: "open", isLoading: false });

async function fetchStoreStatus(): Promise<StoreStatus> {
  const res = await fetch("/api/settings/store-status");
  if (!res.ok) return "open";
  const data = await res.json();
  return data.status ?? "open";
}

export function StoreStatusProvider({ children }: { children: ReactNode }) {
  const { data: status = "open", isLoading } = useQuery<StoreStatus>({
    queryKey: ["store-status"],
    queryFn: fetchStoreStatus,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return (
    <StoreStatusContext.Provider value={{ status, isLoading }}>
      {children}
    </StoreStatusContext.Provider>
  );
}

export function useStoreStatus() {
  return useContext(StoreStatusContext);
}

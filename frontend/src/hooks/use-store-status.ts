import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type StoreStatus = "open" | "pickup_only" | "closed";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchStoreStatus(): Promise<StoreStatus> {
  const res = await fetch(`${API_BASE}/api/store-status`, { credentials: "include" });
  if (!res.ok) return "open";
  const data = await res.json();
  return data.status as StoreStatus;
}

async function setStoreStatus(status: StoreStatus): Promise<StoreStatus> {
  const res = await fetch(`${API_BASE}/api/admin/store-status`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update store status");
  const data = await res.json();
  return data.status as StoreStatus;
}

export function useStoreStatus() {
  return useQuery({
    queryKey: ["store-status"],
    queryFn: fetchStoreStatus,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

export function useSetStoreStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setStoreStatus,
    onSuccess: (status) => {
      qc.setQueryData(["store-status"], status);
    },
  });
}

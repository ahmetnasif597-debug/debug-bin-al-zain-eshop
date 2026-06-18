import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getListOrdersQueryKey, getGetAdminStatsQueryKey } from "@/lib/api-client";

interface NewOrderAlert {
  count: number;
  orders: { id: number; customerName: string | null; createdAt: string }[];
}

interface Options {
  enabled: boolean;
  onNewOrders: (alert: NewOrderAlert) => void;
  intervalMs?: number;
}

export function useAdminOrderAlerts({ enabled, onNewOrders, intervalMs = 15000 }: Options) {
  const lastCheckedAt = useRef<string>(new Date().toISOString());
  const queryClient = useQueryClient();

  const check = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/new-since?since=${encodeURIComponent(lastCheckedAt.current)}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data: NewOrderAlert = await res.json();
      const prevSince = lastCheckedAt.current;
      lastCheckedAt.current = new Date().toISOString();
      if (data.count > 0) {
        // Only alert if we already did the first check (avoid alerting on page load)
        if (prevSince !== new Date(0).toISOString()) {
          onNewOrders(data);
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        }
      }
    } catch {
      // Silently ignore network errors during polling
    }
  }, [onNewOrders, queryClient]);

  useEffect(() => {
    if (!enabled) return;
    // Set start time so we don't alert for existing orders
    lastCheckedAt.current = new Date().toISOString();
    const timer = setInterval(check, intervalMs);
    return () => clearInterval(timer);
  }, [enabled, check, intervalMs]);
}

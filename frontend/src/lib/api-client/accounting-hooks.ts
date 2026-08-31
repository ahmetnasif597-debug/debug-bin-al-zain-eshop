import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api";

async function fetchJson(path: string, opts?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", ...opts });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `HTTP ${res.status}`); }
  return res.json();
}

// ========== ACCOUNTING ==========
export function useAccountingDashboard() {
  return useQuery({ queryKey: ["accounting-dashboard"], queryFn: () => fetchJson("/admin/accounting/dashboard") });
}
export function useAccounts() {
  return useQuery({ queryKey: ["accounts"], queryFn: () => fetchJson("/admin/accounting/accounts") });
}
export function useJournalEntries() {
  return useQuery({ queryKey: ["journal-entries"], queryFn: () => fetchJson("/admin/accounting/journal-entries") });
}
export function useJournalEntry(id: number) {
  return useQuery({ queryKey: ["journal-entry", id], queryFn: () => fetchJson(`/admin/accounting/journal-entries/${id}`), enabled: !!id });
}

// ========== SUPPLIERS ==========
export function useSuppliers() {
  return useQuery({ queryKey: ["suppliers"], queryFn: () => fetchJson("/admin/suppliers") });
}
export function useSupplierStatement(id: number) {
  return useQuery({ queryKey: ["supplier-statement", id], queryFn: () => fetchJson(`/admin/suppliers/${id}/statement`), enabled: !!id });
}
export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetchJson("/admin/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}
export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetchJson(`/admin/suppliers/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

// ========== PURCHASES ==========
export function usePurchases() {
  return useQuery({ queryKey: ["purchases"], queryFn: () => fetchJson("/admin/purchases") });
}
export function usePurchase(id: number) {
  return useQuery({ queryKey: ["purchase", id], queryFn: () => fetchJson(`/admin/purchases/${id}`), enabled: !!id });
}
export function useCreatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetchJson("/admin/purchases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["purchases"] }); qc.invalidateQueries({ queryKey: ["inventory"] }); qc.invalidateQueries({ queryKey: ["suppliers"] }); },
  });
}
export function useDeletePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetchJson(`/admin/purchases/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["purchases"] }); qc.invalidateQueries({ queryKey: ["inventory"] }); qc.invalidateQueries({ queryKey: ["suppliers"] }); },
  });
}

// ========== EXPENSES ==========
export function useExpenses() {
  return useQuery({ queryKey: ["expenses"], queryFn: () => fetchJson("/admin/expenses") });
}
export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetchJson("/admin/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}
export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetchJson(`/admin/expenses/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

// ========== CASH ==========
export function useCashBalance() {
  return useQuery({ queryKey: ["cash-balance"], queryFn: () => fetchJson("/admin/cash/balance") });
}
export function useCashTransactions() {
  return useQuery({ queryKey: ["cash-transactions"], queryFn: () => fetchJson("/admin/cash/transactions") });
}
export function usePayments() {
  return useQuery({ queryKey: ["payments"], queryFn: () => fetchJson("/admin/cash/payments") });
}

// ========== INVENTORY ==========
export function useInventory() {
  return useQuery({ queryKey: ["inventory"], queryFn: () => fetchJson("/admin/inventory") });
}
export function useInventoryMovements() {
  return useQuery({ queryKey: ["inventory-movements"], queryFn: () => fetchJson("/admin/inventory/movements") });
}

// ========== PRODUCTS (admin select) ==========
export function useAdminProducts() {
  return useQuery({ queryKey: ["admin-products"], queryFn: () => fetchJson("/products") });
}

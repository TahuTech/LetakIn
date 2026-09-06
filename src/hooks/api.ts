import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

// ---- Types ----

export type ItemSummary = {
  id: string;
  name: string;
  quantity: number;
  minStock: number;
  unit: string;
  categoryId?: string | null;
  binId?: string | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  category?: { id: string; name: string } | null;
  bin?: {
    id: string;
    label: string;
    rack: { id: string; name: string };
  } | null;
};

export type Transaction = {
  id: string;
  itemId: string;
  type: string;
  quantity: number;
  note: string | null;
  createdAt: string;
  item: ItemSummary & {
    bin?: { label: string; rack: { name: string } } | null;
  };
};

export type GridBin = {
  id: string;
  label: string;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  color?: string | null;
  items?: {
    id: string;
    name: string;
    quantity: number;
    minStock: number;
    unit: string;
    category?: { name: string } | null;
  }[];
};

export type GridRack = {
  id: string;
  name: string;
  code: string;
  rows: number;
  cols: number;
  bins: GridBin[];
};

export type Category = { id: string; name: string };

export type ItemDetail = ItemSummary & {
  transactions: Transaction[];
};

// ---- Hooks ----

export function useRacks() {
  return useQuery({
    queryKey: ["racks"],
    queryFn: () => api.get<GridRack[]>("/racks"),
  });
}

export function useRack(id: string) {
  return useQuery({
    queryKey: ["racks", id],
    queryFn: () => api.get<GridRack>(`/racks/${id}`),
    enabled: !!id,
  });
}

export function useCreateRack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; code: string; rows: number; cols: number }) =>
      api.post<GridRack>("/racks", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["racks"] }),
  });
}

export function useUpdateRack(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; rows?: number; cols?: number }) =>
      api.put<GridRack>(`/racks/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["racks"] });
      qc.invalidateQueries({ queryKey: ["racks", id] });
    },
  });
}

export function useDeleteRack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/racks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["racks"] }),
  });
}

export function useItems() {
  return useQuery({
    queryKey: ["items"],
    queryFn: () => api.get<ItemSummary[]>("/items"),
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ["items", id],
    queryFn: () => api.get<ItemDetail>(`/items/${id}`),
    enabled: !!id,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description: string;
      categoryId: string | null;
      binId: string | null;
      quantity: number;
      minStock: number;
      unit: string;
    }) => api.post<ItemSummary>("/items", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["racks"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useUpdateItem(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<{
      name: string;
      description: string | null;
      categoryId: string | null;
      binId: string | null;
      minStock: number;
      unit: string;
    }>) => api.put<ItemSummary>(`/items/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["items", id] });
      qc.invalidateQueries({ queryKey: ["racks"] });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/items/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["racks"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: () => api.get<Transaction[]>("/transactions"),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { itemId: string; type: string; quantity: number; note: string }) =>
      api.post<Transaction>("/transactions", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["racks"] });
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/categories"),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<Category>("/categories", { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useCreateBin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      rackId: string;
      row: number;
      col: number;
      label: string;
      rowSpan: number;
      colSpan: number;
      color: string;
    }) => api.post<GridBin>("/bins", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["racks"] }),
  });
}

export function useUpdateBin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; label?: string; row?: number; col?: number; rowSpan?: number; colSpan?: number; color?: string }) =>
      api.put<GridBin>(`/bins/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["racks"] }),
  });
}

export function useDeleteBin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/bins/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["racks"] }),
  });
}

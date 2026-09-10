import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { downloadBlob, filenameFromDisposition } from "../lib/utils";

// ---- Types ----

export type JenisBarang = "pribadi" | "dijual";

export type ItemSummary = {
  id: string;
  name: string;
  jenis: JenisBarang;
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

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type DashboardSummary = {
  totalItems: number;
  totalUnits: number;
  lowStockCount: number;
  lowStockItems: ItemSummary[];
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

export type RackTemplate = "fill" | "rows" | "cols";

export function useCreateRack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; code: string; rows: number; cols: number; template?: RackTemplate }) =>
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

export function useResetGrid(rackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ ok: boolean; deleted: number }>(`/racks/${rackId}/reset`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["racks"] }),
  });
}

export function useAutofillGrid(rackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ created: number }>(`/racks/${rackId}/autofill`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["racks"] }),
  });
}

export function useAreaCheck(rackId: string) {
  return useMutation({
    mutationFn: (area: { row: number; col: number; rowSpan: number; colSpan: number }) =>
      api.post<{ ok: boolean }>(`/racks/${rackId}/area-check`, area),
  });
}

export function useItems({
  page,
  pageSize = 25,
  q,
  categoryId,
  rackId,
  lowStock,
}: {
  page: number;
  pageSize?: number;
  q?: string;
  categoryId?: string;
  rackId?: string;
  lowStock?: boolean;
}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (q) params.set("q", q);
  if (categoryId) params.set("categoryId", categoryId);
  if (rackId) params.set("rackId", rackId);
  if (lowStock) params.set("lowStock", "true");

  return useQuery({
    queryKey: ["items", { page, pageSize, q, categoryId, rackId, lowStock }],
    queryFn: () => api.get<Paginated<ItemSummary>>(`/items?${params}`),
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
      jenis: JenisBarang;
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
      jenis: JenisBarang;
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

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["items", "summary"],
    queryFn: () => api.get<DashboardSummary>("/items/summary"),
  });
}

export function useTransactions({
  page,
  pageSize = 25,
  type,
}: {
  page: number;
  pageSize?: number;
  type?: "in" | "out" | "adjust";
}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (type) params.set("type", type);

  return useQuery({
    queryKey: ["transactions", { page, pageSize, type }],
    queryFn: () => api.get<Paginated<Transaction>>(`/transactions?${params}`),
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

// ---- Backup (export/import) ----

export type ImportResult = {
  ok: boolean;
  restored: {
    racks: number;
    bins: number;
    categories: number;
    items: number;
    transactions: number;
  };
};

/** Unduh file dari endpoint export (JSON atau CSV). */
async function downloadFile(path: string, fallbackName: string) {
  const res = await fetch(`/api${path}`);
  if (!res.ok) throw new Error("Gagal mengunduh data");
  const text = await res.text();
  const header = res.headers.get("Content-Disposition");
  const filename = filenameFromDisposition(header, fallbackName);
  const type = path.endsWith(".csv") ? "text/csv" : "application/json";
  downloadBlob(text, filename, type);
}

export function useExportJson() {
  return useMutation({
    mutationFn: () => downloadFile("/export", "letakin-backup.json"),
  });
}

export function useExportCsv() {
  return useMutation({
    mutationFn: () => downloadFile("/export/items.csv", "letakin-barang.csv"),
  });
}

export function useImportData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (backup: unknown) =>
      api.post<ImportResult>("/import", backup),
    onSuccess: () => {
      // Semua data berubah total — invalidate semua
      qc.invalidateQueries();
    },
  });
}

export type BulkItemRow = {
  name: string;
  description?: string;
  jenis?: JenisBarang;
  categoryId?: string;
  binId?: string;
  quantity?: number;
  minStock?: number;
  unit?: string;
};

export function useBulkCreateItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: BulkItemRow[]) =>
      api.post<{ created: number }>("/items/bulk", { items }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["racks"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export type BulkTextResult = {
  created: number;
  categoriesCreated: string[];
  warnings: string[];
};

export function useBulkCreateItemsText() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lines: string[]) =>
      api.post<BulkTextResult>("/items/bulk-text", { lines }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["racks"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
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

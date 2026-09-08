import { useState } from "react";
import {
  useBulkCreateItems,
  useRacks,
  type Category,
  type BulkItemRow,
} from "../hooks/api";

type Row = BulkItemRow & { _key: number };

let keySeq = 0;
const emptyRow = (): Row => ({
  _key: keySeq++,
  name: "",
  description: "",
  categoryId: "",
  binId: "",
  quantity: 0,
  minStock: 5,
  unit: "pcs",
});

/**
 * Form tambah banyak barang sekaligus — tabel multi-baris.
 */
export default function BulkItemForm({
  categories,
  onDone,
  onCancel,
}: {
  categories: Category[];
  onDone: (created: number) => void;
  onCancel: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [error, setError] = useState("");
  const bulkCreate = useBulkCreateItems();
  const { data: racks = [] } = useRacks();

  const bins: { id: string; label: string; rackName: string }[] = [];
  for (const rack of racks) {
    for (const bin of rack.bins) {
      bins.push({ id: bin.id, label: bin.label, rackName: rack.name });
    }
  }

  function updateRow(key: number, field: keyof BulkItemRow, value: string | number) {
    setRows((rs) =>
      rs.map((r) => (r._key === key ? { ...r, [field]: value } : r))
    );
  }

  function removeRow(key: number) {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r._key !== key) : rs));
  }

  const namedRows = rows.filter((r) => r.name.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (namedRows.length === 0) {
      setError("Isi minimal 1 baris dengan nama barang");
      return;
    }
    try {
      const res = await bulkCreate.mutateAsync(
        namedRows.map((r) => ({
          name: r.name.trim(),
          description: r.description?.trim() || undefined,
          categoryId: r.categoryId || undefined,
          binId: r.binId || undefined,
          quantity: Number(r.quantity) || 0,
          minStock: Number(r.minStock) || 5,
          unit: r.unit?.trim() || "pcs",
        }))
      );
      onDone(res.created);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    }
  }

  return (
    <form onSubmit={submit} className="card-retro p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg">📋 Tambah Banyak Barang</h2>
        <span className="badge-retro bg-retro-teal text-white">
          {namedRows.length} barang siap disimpan
        </span>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left">
              <th className="label-retro !mb-0 pb-1">Nama *</th>
              <th className="label-retro !mb-0 pb-1">Kategori</th>
              <th className="label-retro !mb-0 pb-1">Lokasi</th>
              <th className="label-retro !mb-0 pb-1 w-20">Stok</th>
              <th className="label-retro !mb-0 pb-1 w-20">Min</th>
              <th className="label-retro !mb-0 pb-1 w-20">Satuan</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="space-y-2">
            {rows.map((r) => (
              <tr key={r._key}>
                <td className="pr-2 py-1">
                  <input
                    value={r.name}
                    onChange={(e) => updateRow(r._key, "name", e.target.value)}
                    placeholder="Nama barang"
                    className="input-retro !py-1.5"
                  />
                </td>
                <td className="pr-2 py-1">
                  <select
                    value={r.categoryId}
                    onChange={(e) => updateRow(r._key, "categoryId", e.target.value)}
                    className="input-retro !py-1.5"
                  >
                    <option value="">—</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="pr-2 py-1">
                  <select
                    value={r.binId}
                    onChange={(e) => updateRow(r._key, "binId", e.target.value)}
                    className="input-retro !py-1.5"
                  >
                    <option value="">—</option>
                    {bins.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.rackName} → {b.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="pr-2 py-1">
                  <input
                    type="number"
                    min={0}
                    value={r.quantity}
                    onChange={(e) => updateRow(r._key, "quantity", Number(e.target.value))}
                    className="input-retro !py-1.5"
                  />
                </td>
                <td className="pr-2 py-1">
                  <input
                    type="number"
                    min={0}
                    value={r.minStock}
                    onChange={(e) => updateRow(r._key, "minStock", Number(e.target.value))}
                    className="input-retro !py-1.5"
                  />
                </td>
                <td className="pr-2 py-1">
                  <input
                    value={r.unit}
                    onChange={(e) => updateRow(r._key, "unit", e.target.value)}
                    className="input-retro !py-1.5"
                  />
                </td>
                <td className="py-1">
                  <button
                    type="button"
                    onClick={() => removeRow(r._key)}
                    disabled={rows.length <= 1}
                    title="Hapus baris"
                    className="btn-ghost !px-2 !py-1 !min-h-[36px] disabled:opacity-30"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() => setRows((rs) => [...rs, emptyRow()])}
        className="btn-yellow !py-1.5"
      >
        ＋ Tambah baris
      </button>

      <div className="flex gap-2 items-center flex-wrap pt-1 border-t-2 border-ink/10">
        <button
          disabled={bulkCreate.isPending || namedRows.length === 0}
          className="btn-primary"
        >
          {bulkCreate.isPending
            ? "Menyimpan..."
            : `Simpan ${namedRows.length} Barang`}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Batal
        </button>
        {error && (
          <span className="badge-retro bg-retro-pink text-white">⚠️ {error}</span>
        )}
      </div>
      <p className="text-xs text-ink/40 font-semibold">
        Baris tanpa nama akan dilewati. Maksimal 200 barang per submit.
      </p>
    </form>
  );
}

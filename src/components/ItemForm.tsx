import { useEffect, useState } from "react";
import { useCreateItem, useRacks, type Category } from "../hooks/api";
import CategorySelect from "./CategorySelect";

type BinOption = {
  id: string;
  label: string;
  rackName: string;
};

export default function ItemForm({
  categories,
  onDone,
  onCancel,
}: {
  categories: Category[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [binId, setBinId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [minStock, setMinStock] = useState(5);
  const [unit, setUnit] = useState("pcs");
  const [bins, setBins] = useState<BinOption[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const createItem = useCreateItem();
  const { data: racks } = useRacks();

  useEffect(() => {
    if (!racks) return;
    const opts: BinOption[] = [];
    for (const rack of racks) {
      for (const bin of rack.bins) {
        opts.push({ id: bin.id, label: bin.label, rackName: rack.name });
      }
    }
    setBins(opts);
  }, [racks]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await createItem.mutateAsync({
        name,
        description,
        categoryId: categoryId || null,
        binId: binId || null,
        quantity,
        minStock,
        unit,
      });
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card-retro p-4 space-y-3">
      <h2 className="text-lg">📦 Tambah Barang Baru</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="label-retro">Nama Barang *</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="cth: Resistor 10k 1/4W"
            className="input-retro"
          />
        </label>
        <label className="text-sm">
          <span className="label-retro">Deskripsi</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="opsional"
            className="input-retro"
          />
        </label>
        <label className="text-sm">
          <span className="label-retro">Kategori</span>
          <CategorySelect
            value={categoryId}
            onChange={setCategoryId}
            categories={categories}
          />
        </label>
        <label className="text-sm">
          <span className="label-retro">Lokasi (Rak → Bin)</span>
          <select
            value={binId}
            onChange={(e) => setBinId(e.target.value)}
            className="input-retro"
          >
            <option value="">— Belum ditempatkan —</option>
            {bins.map((b) => (
              <option key={b.id} value={b.id}>
                {b.rackName} → {b.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="label-retro">Jumlah Awal</span>
          <input
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="input-retro"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="label-retro">Stok Minimum</span>
            <input
              type="number"
              min={0}
              value={minStock}
              onChange={(e) => setMinStock(Number(e.target.value))}
              className="input-retro"
            />
          </label>
          <label className="text-sm">
            <span className="label-retro">Satuan</span>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="input-retro"
            />
          </label>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <button disabled={busy} className="btn-primary">
          {busy ? "Menyimpan..." : "Simpan"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Batal
        </button>
        {error && <p className="badge-retro bg-retro-pink text-white">{error}</p>}
      </div>
    </form>
  );
}

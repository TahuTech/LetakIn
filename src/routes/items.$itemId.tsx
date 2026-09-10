import { useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import TransactionForm from "../components/TransactionForm";
import CategorySelect from "../components/CategorySelect";
import JenisSelect from "../components/JenisSelect";
import { useItem, useCategories, useRacks, useUpdateItem, useDeleteItem, type JenisBarang } from "../hooks/api";

export function ItemDetailPage() {
  const { itemId } = useParams({ from: "/items/$itemId" });
  const navigate = useNavigate();
  const { data: item, isLoading, error: loadError } = useItem(itemId);
  const { data: categories = [] } = useCategories();
  const { data: racks = [] } = useRacks();
  const updateItem = useUpdateItem(itemId);
  const deleteItem = useDeleteItem();

  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  // edit fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [jenis, setJenis] = useState<JenisBarang>("pribadi");
  const [categoryId, setCategoryId] = useState("");
  const [binId, setBinId] = useState("");
  const [minStock, setMinStock] = useState(0);
  const [unit, setUnit] = useState("pcs");

  // Populate form when item loads
  if (item && !name) {
    setName(item.name);
    setDescription(item.description ?? "");
    setJenis(item.jenis ?? "pribadi");
    setCategoryId(item.category?.id ?? "");
    setBinId(item.bin?.id ?? "");
    setMinStock(item.minStock);
    setUnit(item.unit);
  }

  const bins: { id: string; label: string; rackName: string }[] = [];
  for (const rack of racks) {
    for (const bin of rack.bins) {
      bins.push({ id: bin.id, label: bin.label, rackName: rack.name });
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await updateItem.mutateAsync({
        name,
        description: description || null,
        jenis,
        categoryId: categoryId || null,
        binId: binId || null,
        minStock: jenis === "pribadi" ? 0 : minStock,
        unit,
      });
      setEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    }
  }

  async function handleDelete() {
    if (!confirm(`Hapus barang "${item?.name}"?`)) return;
    try {
      await deleteItem.mutateAsync(itemId);
      navigate({ to: "/items" });
    } catch {
      setError("Gagal menghapus barang");
    }
  }

  if (loadError && !item)
    return (
      <div className="text-center py-12">
        <p className="badge-retro bg-retro-pink text-white mb-4">
          {(loadError as Error).message}
        </p>
        <div>
          <Link to="/items" search={{}} className="link-retro">
            ← Kembali
          </Link>
        </div>
      </div>
    );
  if (isLoading || !item)
    return <p className="text-ink/50 py-12 text-center font-bold">Memuat... ⏳</p>;

  const isPribadi = item.jenis === "pribadi";
  // Barang pribadi (minStock 0) tidak pernah "menipis"
  const low = !isPribadi && item.quantity <= item.minStock;

  return (
    <div className="space-y-4">
      <Link to="/items" search={{}} className="link-retro text-sm">
        ← Semua Barang
      </Link>

      <div className="grid md:grid-cols-2 gap-5 items-start">
        <div className="card-retro p-4 space-y-3">
          <div className="flex justify-between items-start gap-3">
            <div>
              <h1 className="text-2xl">{item.name}</h1>
              {item.description && (
                <p className="text-sm text-ink/50 font-semibold">{item.description}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className={`badge-retro ${isPribadi ? "bg-retro-teal text-white" : "bg-retro-yellow text-ink"}`}
              >
                {isPribadi ? "🏠 Pribadi" : "🏷️ Dijual"}
              </span>
              <span
                className={`font-display text-3xl whitespace-nowrap ${
                  low ? "text-retro-pink" : "text-retro-teal"
                }`}
              >
                {item.quantity}{" "}
                <span className="text-sm font-body font-bold">{item.unit}</span>
              </span>
            </div>
          </div>

          {low && (
            <div className="border-2 border-retro-pink bg-retro-pink/10 text-retro-pink rounded-xl px-3 py-2 text-sm font-bold">
              ⚠️ Stok menipis (min {item.minStock} {item.unit})
            </div>
          )}

          <dl className="text-sm space-y-1.5">
            <div className="flex gap-2">
              <dt className="text-ink/50 font-bold w-28">Kategori</dt>
              <dd className="font-semibold">{item.category?.name ?? "-"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink/50 font-bold w-28">Lokasi</dt>
              <dd>
                {item.bin ? (
                  <Link
                    to="/racks/$rackId"
                    params={{ rackId: item.bin.rack.id }}
                    className="link-retro"
                  >
                    {item.bin.rack.name} → {item.bin.label}
                  </Link>
                ) : (
                  "Belum ditempatkan"
                )}
              </dd>
            </div>
            {!isPribadi && (
              <div className="flex gap-2">
                <dt className="text-ink/50 font-bold w-28">Stok minimum</dt>
                <dd className="font-semibold">
                  {item.minStock} {item.unit}
                </dd>
              </div>
            )}
          </dl>

          <div className="flex gap-2 pt-3 border-t-2 border-ink/10">
            <button onClick={() => setEditing(!editing)} className="btn-teal !py-1.5">
              ✏️ Edit
            </button>
            <button onClick={handleDelete} className="btn-danger !py-1.5">
              Hapus
            </button>
          </div>

          {editing && (
            <form onSubmit={saveEdit} className="border-t-2 border-ink/10 pt-3 space-y-3">
              <div>
                <span className="label-retro">Nama</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input-retro"
                  placeholder="Nama"
                />
              </div>
              <div>
                <span className="label-retro">Deskripsi</span>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-retro"
                  placeholder="Deskripsi"
                />
              </div>
              <JenisSelect value={jenis} onChange={setJenis} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="label-retro">Kategori</span>
                  <CategorySelect
                    value={categoryId}
                    onChange={setCategoryId}
                    categories={categories}
                  />
                </div>
                <div>
                  <span className="label-retro">Lokasi</span>
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
                </div>
                {jenis === "dijual" && (
                  <>
                    <div>
                      <span className="label-retro">Min stok</span>
                      <input
                        type="number"
                        min={0}
                        value={minStock}
                        onChange={(e) => setMinStock(Number(e.target.value))}
                        className="input-retro"
                      />
                    </div>
                    <div>
                      <span className="label-retro">Satuan</span>
                      <input
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="input-retro"
                      />
                    </div>
                  </>
                )}
              </div>
              <button className="btn-primary">Simpan Perubahan</button>
              {error && (
                <p className="badge-retro bg-retro-pink text-white">{error}</p>
              )}
            </form>
          )}

          {isPribadi ? (
            <div className="border-t-2 border-ink/10 pt-3">
              <p className="text-sm text-ink/50 font-semibold">
                🏠 Barang pribadi — stok selalu 1, tidak ada transaksi masuk/keluar.
              </p>
            </div>
          ) : (
            <details className="border-t-2 border-ink/10 pt-3">
              <summary className="text-sm link-retro cursor-pointer font-bold">
                + Transaksi (masuk/keluar)
              </summary>
              <TransactionForm
                items={[
                  { id: item.id, name: item.name, quantity: item.quantity, unit: item.unit },
                ]}
                onDone={() => {}}
              />
            </details>
          )}
        </div>

        {!isPribadi && (
          <div className="card-retro p-4">
            <h2 className="text-lg mb-3">🧾 Riwayat Transaksi</h2>
            {item.transactions.length === 0 ? (
              <p className="text-ink/50 text-sm">Belum ada transaksi.</p>
            ) : (
              <ul className="divide-y divide-ink/10 text-sm">
                {item.transactions.map((tx) => (
                  <li key={tx.id} className="py-2 flex justify-between gap-2">
                    <div>
                      <span
                        className={`badge-retro ${
                          tx.type === "in"
                            ? "bg-retro-teal text-white"
                            : tx.type === "out"
                              ? "bg-retro-orange text-white"
                              : "bg-retro-sky text-white"
                        }`}
                      >
                        {tx.type.toUpperCase()}
                      </span>{" "}
                      {tx.note && (
                        <span className="text-ink/50 text-xs">· {tx.note}</span>
                      )}
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className="font-display">
                        {tx.type === "out" ? "−" : "+"}
                        {tx.quantity}
                      </span>
                      <div className="text-xs text-ink/40">
                        {new Date(tx.createdAt).toLocaleString("id-ID", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { Suspense, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import ItemForm from "../components/ItemForm";
import { useItems, useCategories } from "../hooks/api";
import { isLowStock } from "../lib/utils";

function ItemsPageInner() {
  const { data: items = [] } = useItems();
  const { data: categories = [] } = useCategories();
  const [q, setQ] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  // Baca ?filter=low dari URL secara manual (lebih sederhana)
  const [filterLow, setFilterLow] = useState(
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("filter") === "low"
  );
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (q && !i.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (filterCategory && i.category?.id !== filterCategory) return false;
      if (filterLow && i.quantity > i.minStock) return false;
      return true;
    });
  }, [items, q, filterCategory, filterLow]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl">📦 Barang</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          + Tambah Barang
        </button>
      </div>

      {showForm && (
        <ItemForm
          categories={categories}
          onDone={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="card-retro p-4 flex flex-wrap gap-3 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Cari nama barang..."
          className="input-retro flex-1 min-w-48"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="input-retro w-auto"
        >
          <option value="">Semua kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm font-bold cursor-pointer select-none min-h-[40px]">
          <input
            type="checkbox"
            checked={filterLow}
            onChange={(e) => setFilterLow(e.target.checked)}
            className="w-5 h-5 accent-retro-pink"
          />
          <span className={filterLow ? "text-retro-pink" : ""}>
            Hanya stok menipis
          </span>
        </label>
      </div>

      <div className="card-retro overflow-hidden overflow-x-auto">
        <table className="table-retro">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Kategori</th>
              <th>Lokasi</th>
              <th className="!text-right">Stok</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="!py-8 text-center text-ink/40 font-semibold">
                  Tidak ada barang yang cocok. 🤷
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const low = isLowStock(item);
                return (
                  <tr key={item.id}>
                    <td>
                      <Link
                        to="/items/$itemId"
                        params={{ itemId: item.id }}
                        className="link-retro"
                      >
                        {item.name}
                      </Link>
                      {item.description && (
                        <div className="text-xs text-ink/40">{item.description}</div>
                      )}
                    </td>
                    <td className="text-ink/60 font-semibold">
                      {item.category?.name ?? "-"}
                    </td>
                    <td>
                      {item.bin ? (
                        <Link
                          to="/racks/$rackId"
                          params={{ rackId: item.bin.rack.id }}
                          className="link-retro"
                        >
                          {item.bin.rack.name} → <b>{item.bin.label}</b>
                        </Link>
                      ) : (
                        <span className="text-ink/40">Belum ditempatkan</span>
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <span className={`font-display ${low ? "text-retro-pink" : ""}`}>
                        {item.quantity} {item.unit}
                      </span>
                      {low && (
                        <span className="badge-retro bg-retro-pink text-white ml-2">
                          Menipis
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink/40 font-semibold">
        {filtered.length} dari {items.length} barang
      </p>
    </div>
  );
}

export function ItemsPage() {
  return (
    <Suspense fallback={<p className="text-ink/50 py-12 text-center font-bold">Memuat... ⏳</p>}>
      <ItemsPageInner />
    </Suspense>
  );
}

import { Suspense, useState } from "react";
import { Link } from "@tanstack/react-router";
import ItemForm from "../components/ItemForm";
import { useItems, useCategories, useRacks } from "../hooks/api";
import { isLowStock } from "../lib/utils";

function ItemsPageInner() {
  const [q, setQ] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterRack, setFilterRack] = useState("");
  // Baca ?filter=low dari URL secara manual (lebih sederhana)
  const [filterLow, setFilterLow] = useState(
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("filter") === "low"
  );
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const { data: itemPage } = useItems({
    page,
    q,
    categoryId: filterCategory,
    rackId: filterRack,
    lowStock: filterLow,
  });
  const { data: categories = [] } = useCategories();
  const { data: racks = [] } = useRacks();
  const items = itemPage?.items ?? [];
  const total = itemPage?.total ?? 0;
  const totalPages = itemPage?.totalPages ?? 0;

  function resetPage() {
    setPage(1);
  }

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
          onChange={(e) => {
            setQ(e.target.value);
            resetPage();
          }}
          placeholder="🔍 Cari nama barang..."
          className="input-retro flex-1 min-w-48"
        />
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            resetPage();
          }}
          className="input-retro w-auto"
        >
          <option value="">Semua kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filterRack}
          onChange={(e) => {
            setFilterRack(e.target.value);
            resetPage();
          }}
          className="input-retro w-auto"
        >
          <option value="">Semua rak</option>
          {racks.map((rack) => (
            <option key={rack.id} value={rack.id}>
              {rack.code} - {rack.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm font-bold cursor-pointer select-none min-h-[40px]">
          <input
            type="checkbox"
            checked={filterLow}
            onChange={(e) => {
              setFilterLow(e.target.checked);
              resetPage();
            }}
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
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="!py-8 text-center text-ink/40 font-semibold">
                  Tidak ada barang yang cocok. 🤷
                </td>
              </tr>
            ) : (
              items.map((item) => {
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
        Menampilkan {items.length} dari {total} barang
      </p>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            className="btn-ghost"
            disabled={page === 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Sebelumnya
          </button>
          <span className="text-sm font-bold">
            Halaman {page} dari {totalPages}
          </span>
          <button
            className="btn-ghost"
            disabled={page === totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Berikutnya
          </button>
        </div>
      )}
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

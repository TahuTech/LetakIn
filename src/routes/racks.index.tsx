import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import RackGrid from "../components/RackGrid";
import { useRacks, useCreateRack, type GridRack } from "../hooks/api";

export function RacksPage() {
  const { data: racks = [] } = useRacks();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(3);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const createRack = useCreateRack();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const data = await createRack.mutateAsync({ name, code, rows, cols });
      setShowForm(false);
      setName("");
      setCode("");
      navigate({ to: `/racks/${data.id}/edit` });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal membuat rak");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl">🗄️ Rak Penyimpanan</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          + Rak Baru
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="card-retro p-4 flex flex-wrap items-end gap-3"
        >
          <label className="text-sm">
            <span className="label-retro">Nama Rak</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Rak C - Perkakas"
              className="input-retro w-52"
            />
          </label>
          <label className="text-sm">
            <span className="label-retro">Kode</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="C"
              className="input-retro w-20"
            />
          </label>
          <label className="text-sm">
            <span className="label-retro">Baris (grid)</span>
            <input
              type="number"
              min={1}
              max={20}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
              className="input-retro w-24"
            />
          </label>
          <label className="text-sm">
            <span className="label-retro">Kolom (grid)</span>
            <input
              type="number"
              min={1}
              max={20}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
              className="input-retro w-24"
            />
          </label>
          <button className="btn-yellow">Buat & Atur Layout</button>
          {error && (
            <p className="badge-retro bg-retro-pink text-white w-full">{error}</p>
          )}
        </form>
      )}

      {racks.length === 0 ? (
        <div className="card-retro p-8 text-center text-ink/50">
          Belum ada rak. Buat rak pertama Anda! 🚀
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {racks.map((rack: GridRack) => {
            const totalItems = rack.bins.reduce(
              (s, b) => s + (b.items?.length ?? 0),
              0
            );
            const lowCount = rack.bins.reduce(
              (s, b) =>
                s + (b.items?.filter((i) => i.quantity <= i.minStock).length ?? 0),
              0
            );
            return (
              <Link
                key={rack.id}
                to="/racks/$rackId"
                params={{ rackId: rack.id }}
                className="card-retro p-4 block transition-all duration-100
                  hover:shadow-retro-lg hover:-translate-x-0.5 hover:-translate-y-0.5
                  active:shadow-retro-sm active:translate-x-0.5 active:translate-y-0.5"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="text-base">{rack.name}</h2>
                    <p className="text-xs text-ink/50 font-semibold mt-0.5">
                      Grid {rack.rows}×{rack.cols} · {rack.bins.length} bin ·{" "}
                      {totalItems} barang
                    </p>
                  </div>
                  {lowCount > 0 && (
                    <span className="badge-retro bg-retro-pink text-white">
                      {lowCount} menipis
                    </span>
                  )}
                </div>
                <div className="max-h-48 overflow-hidden">
                  <RackGrid rack={rack} mini />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

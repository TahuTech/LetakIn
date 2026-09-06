import { useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import RackGridEditor from "../components/RackGridEditor";
import BinEditDialog, { type BinFormData } from "../components/BinEditDialog";
import { useRack, useUpdateRack, useDeleteRack, useCreateBin, useUpdateBin, useDeleteBin, type GridBin } from "../hooks/api";

export function RackEditPage() {
  const { rackId } = useParams({ from: "/racks/$rackId/edit" });
  const navigate = useNavigate();
  const { data: rack, isLoading } = useRack(rackId);

  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(3);
  const [name, setName] = useState("");

  // Dialog state
  const [editingBin, setEditingBin] = useState<GridBin | null>(null);
  const [newBinPos, setNewBinPos] = useState<{ row: number; col: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Mode pindah: klik sel kosong untuk memindahkan bin ini
  const [movingBinId, setMovingBinId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const updateRack = useUpdateRack(rackId);
  const deleteRack = useDeleteRack();
  const createBin = useCreateBin();
  const updateBin = useUpdateBin();
  const deleteBinMut = useDeleteBin();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function saveGridSize() {
    setError("");
    try {
      await updateRack.mutateAsync({ name, rows, cols });
      showToast("Layout grid disimpan ✓");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    }
  }

  function handleCellClick(row: number, col: number) {
    if (movingBinId) {
      moveBin(movingBinId, row, col);
      return;
    }
    setEditingBin(null);
    setNewBinPos({ row, col });
    setDialogOpen(true);
  }

  function handleBinClick(bin: GridBin) {
    setNewBinPos(null);
    setEditingBin(bin);
    setDialogOpen(true);
  }

  async function moveBin(binId: string, row: number, col: number) {
    setError("");
    try {
      await updateBin.mutateAsync({ id: binId, row, col });
      setMovingBinId(null);
      showToast("Bin dipindahkan ✓");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memindahkan");
      setMovingBinId(null);
    }
  }

  async function saveBin(form: BinFormData) {
    setError("");
    try {
      if (editingBin) {
        await updateBin.mutateAsync({ id: editingBin.id, ...form });
        showToast("Bin disimpan ✓");
      } else if (newBinPos) {
        await createBin.mutateAsync({
          rackId,
          row: newBinPos.row,
          col: newBinPos.col,
          ...form,
        });
        showToast("Bin dibuat ✓");
      }
      setDialogOpen(false);
      setEditingBin(null);
      setNewBinPos(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan bin");
    }
  }

  async function deleteBin() {
    if (!editingBin) return;
    setError("");
    try {
      await deleteBinMut.mutateAsync(editingBin.id);
      setDialogOpen(false);
      setEditingBin(null);
      showToast("Bin dihapus ✓");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menghapus");
      setDialogOpen(false);
    }
  }

  async function handleDeleteRack() {
    if (!confirm(`Hapus rak "${rack?.name}"? Semua bin di dalamnya ikut terhapus.`)) return;
    try {
      await deleteRack.mutateAsync(rackId);
      navigate({ to: "/racks" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menghapus rak");
    }
  }

  if (isLoading) return <p className="text-ink/50 py-12 text-center font-bold">Memuat... ⏳</p>;
  if (!rack) return null;

  const dialogMaxRowSpan = editingBin
    ? rows - editingBin.row
    : newBinPos
      ? rows - newBinPos.row
      : 1;
  const dialogMaxColSpan = editingBin
    ? cols - editingBin.col
    : newBinPos
      ? cols - newBinPos.col
      : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link to="/racks/$rackId" params={{ rackId: rack.id }} className="link-retro text-sm">
            ← Mode Lihat
          </Link>
          <h1 className="text-3xl">✏️ Edit Layout Rak</h1>
        </div>
        <button onClick={handleDeleteRack} className="btn-danger">
          Hapus Rak
        </button>
      </div>

      {/* Form ukuran grid */}
      <div className="card-retro p-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="label-retro">Nama Rak</span>
          <input
            value={name || rack.name}
            onChange={(e) => setName(e.target.value)}
            className="input-retro w-56"
          />
        </label>
        <label className="text-sm">
          <span className="label-retro">Baris</span>
          <input
            type="number"
            min={1}
            max={20}
            value={rows || rack.rows}
            onChange={(e) => setRows(Number(e.target.value))}
            className="input-retro w-24"
          />
        </label>
        <label className="text-sm">
          <span className="label-retro">Kolom</span>
          <input
            type="number"
            min={1}
            max={20}
            value={cols || rack.cols}
            onChange={(e) => setCols(Number(e.target.value))}
            className="input-retro w-24"
          />
        </label>
        <button onClick={saveGridSize} className="btn-teal">
          Simpan Ukuran Grid
        </button>
        <p className="text-xs text-ink/40 w-full font-semibold">
          Ukuran grid hanya disimpan setelah klik tombol. Klik sel kosong untuk menambah bin, klik bin untuk mengedit.
        </p>
      </div>

      {error && (
        <div className="card-retro border-retro-pink bg-retro-pink/10 px-4 py-2 text-sm font-bold text-retro-pink">
          ⚠️ {error}
        </div>
      )}

      {movingBinId && (
        <div className="card-retro bg-retro-yellow px-4 py-2.5 text-sm font-bold flex justify-between items-center">
          <span>
            🚚 Mode pindah aktif — klik sel kosong tujuan untuk memindahkan bin.
          </span>
          <button
            onClick={() => setMovingBinId(null)}
            className="underline hover:no-underline"
          >
            Batalkan
          </button>
        </div>
      )}

      <div className="card-retro p-4">
        <RackGridEditor
          rackId={rack.id}
          rows={rows || rack.rows}
          cols={cols || rack.cols}
          bins={rack.bins}
          movingBinId={movingBinId}
          onCellClick={handleCellClick}
          onBinClick={handleBinClick}
        />
      </div>

      {dialogOpen && (
        <BinEditDialog
          bin={editingBin}
          position={newBinPos}
          maxRowSpan={dialogMaxRowSpan}
          maxColSpan={dialogMaxColSpan}
          itemCount={editingBin?.items?.length ?? 0}
          onSave={saveBin}
          onDelete={editingBin ? deleteBin : undefined}
          onMove={
            editingBin
              ? () => {
                  setMovingBinId(editingBin.id);
                  setDialogOpen(false);
                }
              : undefined
          }
          onClose={() => {
            setDialogOpen(false);
            setEditingBin(null);
            setNewBinPos(null);
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-retro-yellow border-2 border-ink rounded-xl shadow-retro px-4 py-2 font-bold text-sm animate-bounce z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

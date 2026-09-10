import { useEffect, useState } from "react";
import type { GridBin } from "./RackGrid";

const COLORS = [
  { label: "Default (krem)", value: "" },
  { label: "Oranye", value: "#FF6B35" },
  { label: "Teal", value: "#2EC4B6" },
  { label: "Kuning", value: "#FFD23F" },
  { label: "Pink", value: "#EF476F" },
  { label: "Biru langit", value: "#4D96FF" },
  { label: "Ungu", value: "#a855f7" },
];

export type BinFormData = {
  label: string;
  rowSpan: number;
  colSpan: number;
  color: string;
};

export default function BinEditDialog({
  bin,
  position,
  initialSpan,
  maxRowSpan,
  maxColSpan,
  itemCount,
  onSave,
  onDelete,
  onMove,
  onClose,
}: {
  bin: GridBin | null; // null = mode buat baru
  position: { row: number; col: number } | null; // posisi untuk bin baru
  initialSpan?: { rowSpan: number; colSpan: number }; // span awal dari drag-select
  maxRowSpan: number;
  maxColSpan: number;
  itemCount: number;
  onSave: (data: BinFormData) => void;
  onDelete?: () => void;
  onMove?: () => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(bin?.label ?? "");
  const [rowSpan, setRowSpan] = useState(bin?.rowSpan ?? initialSpan?.rowSpan ?? 1);
  const [colSpan, setColSpan] = useState(bin?.colSpan ?? initialSpan?.colSpan ?? 1);
  const [color, setColor] = useState(bin?.color ?? "");

  useEffect(() => {
    setLabel(bin?.label ?? "");
    setRowSpan(bin?.rowSpan ?? initialSpan?.rowSpan ?? 1);
    setColSpan(bin?.colSpan ?? initialSpan?.colSpan ?? 1);
    setColor(bin?.color ?? "");
  }, [bin, position, initialSpan]);

  const isFromDrag = !bin && initialSpan && (initialSpan.rowSpan > 1 || initialSpan.colSpan > 1);
  const title = bin
    ? `Edit Bin: ${bin.label}`
    : isFromDrag
      ? `Bin Baru ${initialSpan.rowSpan}×${initialSpan.colSpan}`
      : `Bin Baru di baris ${(position?.row ?? 0) + 1}, kolom ${(position?.col ?? 0) + 1}`;

  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="card-retro shadow-retro-lg w-full max-w-sm p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg">{title}</h3>

        <label className="block text-sm">
          <span className="label-retro">Label</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            autoFocus
            placeholder="cth: A1, Kotak Resistor"
            className="input-retro"
          />
        </label>

        <div className="flex gap-3">
          <label className="block text-sm flex-1">
            <span className="label-retro">Span Baris</span>
            <input
              type="number"
              min={1}
              max={maxRowSpan}
              value={rowSpan}
              onChange={(e) =>
                setRowSpan(Math.min(maxRowSpan, Math.max(1, Number(e.target.value))))
              }
              className="input-retro"
            />
          </label>
          <label className="block text-sm flex-1">
            <span className="label-retro">Span Kolom</span>
            <input
              type="number"
              min={1}
              max={maxColSpan}
              value={colSpan}
              onChange={(e) =>
                setColSpan(Math.min(maxColSpan, Math.max(1, Number(e.target.value))))
              }
              className="input-retro"
            />
          </label>
        </div>

        <div className="text-sm">
          <span className="label-retro">Warna</span>
          <div className="flex gap-2 mt-1 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => setColor(c.value)}
                className={`w-9 h-9 rounded-lg border-2 border-ink transition-all
                  ${
                    color === c.value
                      ? "ring-4 ring-retro-yellow shadow-retro-sm -translate-y-0.5"
                      : "hover:-translate-y-0.5 shadow-retro-sm"
                  }`}
                style={{
                  backgroundColor: c.value || "#FFFDF8",
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2 flex-wrap">
          <button
            onClick={() => onSave({ label, rowSpan, colSpan, color })}
            className="btn-primary flex-1"
          >
            {bin ? "Simpan" : "Buat Bin"}
          </button>
          {bin && onMove && (
            <button
              onClick={onMove}
              className="btn-teal"
              title="Pindahkan ke sel lain"
            >
              Pindah
            </button>
          )}
          {bin && onDelete && (
            <button
              onClick={onDelete}
              disabled={itemCount > 0}
              title={itemCount > 0 ? `Bin berisi ${itemCount} barang` : "Hapus bin"}
              className="btn-danger"
            >
              Hapus
            </button>
          )}
          <button onClick={onClose} className="btn-ghost">
            Batal
          </button>
        </div>
        {bin && itemCount > 0 && (
          <p className="text-xs text-ink/50 font-semibold">
            ⚠️ Bin berisi {itemCount} barang — kosongkan dulu sebelum menghapus.
          </p>
        )}
      </div>
    </div>
  );
}

import { useRef, useState } from "react";
import type { GridBin } from "./RackGrid";

type Props = {
  rackId: string;
  rows: number;
  cols: number;
  bins: GridBin[];
  movingBinId: string | null;
  onCellClick: (row: number, col: number) => void;
  onBinClick: (bin: GridBin) => void;
  /** Dipanggil saat drag-select selesai dengan area persegi yang valid. */
  onAreaSelect: (area: {
    row: number;
    col: number;
    rowSpan: number;
    colSpan: number;
  }) => void;
};

type Cell = { row: number; col: number };

/** Bangun peta sel terisi: key "r,c" -> bin */
function buildOccupancy(bins: GridBin[]) {
  const map = new Map<string, GridBin>();
  for (const b of bins) {
    for (let r = b.row; r < b.row + b.rowSpan; r++) {
      for (let c = b.col; c < b.col + b.colSpan; c++) {
        map.set(`${r},${c}`, b);
      }
    }
  }
  return map;
}

/**
 * Editor grid interaktif: klik sel kosong = tambah bin,
 * drag di sel kosong = pilih area untuk bin multi-sel,
 * klik bin existing = edit.
 */
export default function RackGridEditor({
  rows,
  cols,
  bins,
  movingBinId,
  onCellClick,
  onBinClick,
  onAreaSelect,
}: Props) {
  const occupancy = buildOccupancy(bins);
  const [hoverCell, setHoverCell] = useState<string | null>(null);

  // Drag-select state
  const [dragStart, setDragStart] = useState<Cell | null>(null);
  const [dragEnd, setDragEnd] = useState<Cell | null>(null);
  const dragging = dragStart !== null;
  // Ref agar handler pointerup di window membaca state terbaru
  const dragRef = useRef<{ start: Cell; end: Cell } | null>(null);

  function inDragRange(r: number, c: number): boolean {
    if (!dragStart || !dragEnd) return false;
    const rMin = Math.min(dragStart.row, dragEnd.row);
    const rMax = Math.max(dragStart.row, dragEnd.row);
    const cMin = Math.min(dragStart.col, dragEnd.col);
    const cMax = Math.max(dragStart.col, dragEnd.col);
    return r >= rMin && r <= rMax && c >= cMin && c <= cMax;
  }

  /** Cek apakah rentang drag menutupi bin existing. */
  function dragCoversBin(): boolean {
    if (!dragStart || !dragEnd) return false;
    const rMin = Math.min(dragStart.row, dragEnd.row);
    const rMax = Math.max(dragStart.row, dragEnd.row);
    const cMin = Math.min(dragStart.col, dragEnd.col);
    const cMax = Math.max(dragStart.col, dragEnd.col);
    for (let r = rMin; r <= rMax; r++) {
      for (let c = cMin; c <= cMax; c++) {
        if (occupancy.has(`${r},${c}`)) return true;
      }
    }
    return false;
  }

  function startDrag(r: number, c: number, e: React.PointerEvent) {
    // Hanya tombol kiri / sentuhan; nonaktif saat mode pindah
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (movingBinId) return;
    setDragStart({ row: r, col: c });
    setDragEnd({ row: r, col: c });
    dragRef.current = { start: { row: r, col: c }, end: { row: r, col: c } };
  }

  function extendDrag(r: number, c: number, e: React.PointerEvent) {
    if (!dragging) return;
    // e.buttons === 0 berarti tombol sudah dilepas (mis. pointerup terlewat)
    if (e.buttons === 0) {
      finishDrag();
      return;
    }
    setDragEnd({ row: r, col: c });
    if (dragRef.current) dragRef.current.end = { row: r, col: c };
  }

  function finishDrag() {
    const d = dragRef.current;
    dragRef.current = null;
    setDragStart(null);
    setDragEnd(null);
    if (!d) return;

    const rMin = Math.min(d.start.row, d.end.row);
    const rMax = Math.max(d.start.row, d.end.row);
    const cMin = Math.min(d.start.col, d.end.col);
    const cMax = Math.max(d.start.col, d.end.col);
    const rowSpan = rMax - rMin + 1;
    const colSpan = cMax - cMin + 1;

    // Klik biasa (1x1 tanpa geser) → perilaku klik sel seperti sebelumnya
    if (rowSpan === 1 && colSpan === 1 && d.start.row === d.end.row && d.start.col === d.end.col) {
      onCellClick(rMin, cMin);
      return;
    }

    // Area lebih besar → tolak jika menutupi bin existing
    let coversBin = false;
    for (let r = rMin; r <= rMax && !coversBin; r++) {
      for (let c = cMin; c <= cMax && !coversBin; c++) {
        if (occupancy.has(`${r},${c}`)) coversBin = true;
      }
    }
    if (coversBin) return; // halaman menampilkan error sendiri via onAreaSelect validation

    onAreaSelect({ row: rMin, col: cMin, rowSpan, colSpan });
  }

  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const occupant = occupancy.get(key);
      // Hanya render sel kosong — bin dirender terpisah sebagai overlay grid
      if (!occupant) {
        const selected = inDragRange(r, c);
        const invalid = selected && dragCoversBin();
        cells.push(
          <button
            key={key}
            type="button"
            onPointerDown={(e) => startDrag(r, c, e)}
            onPointerEnter={(e) => extendDrag(r, c, e)}
            onPointerUp={finishDrag}
            onMouseEnter={() => setHoverCell(key)}
            onMouseLeave={() => setHoverCell(null)}
            className={`
              border-2 border-dashed rounded-lg flex items-center justify-center
              transition-colors min-h-16 text-xl font-bold select-none touch-none
              ${
                selected
                  ? invalid
                    ? "border-retro-pink bg-retro-pink/30 text-retro-pink"
                    : "border-retro-orange bg-retro-yellow/50 text-retro-orange"
                  : "border-ink/30 text-ink/30 hover:border-retro-orange hover:text-retro-orange hover:bg-retro-yellow/20"
              }
              ${movingBinId ? "animate-pulse border-retro-teal text-retro-teal hover:bg-retro-teal/20" : ""}
              ${!selected && hoverCell === key ? "bg-retro-yellow/20" : ""}
            `}
            style={{
              gridRowStart: r + 1,
              gridColumnStart: c + 1,
            }}
            title={
              movingBinId
                ? "Klik untuk pindahkan bin ke sini"
                : "Klik untuk tambah bin, atau seret untuk area lebih besar"
            }
          >
            {selected && !invalid ? "▣" : "+"}
          </button>
        );
      }
    }
  }

  return (
    <div
      className="grid gap-1.5 w-full"
      style={{
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        aspectRatio: `${cols} / ${rows}`,
      }}
      onPointerUp={finishDrag}
      onPointerLeave={finishDrag}
    >
      {cells}
      {bins.map((bin) => {
        const itemCount = bin.items?.length ?? 0;
        const isMoving = movingBinId === bin.id;
        return (
          <button
            key={bin.id}
            type="button"
            onClick={() => onBinClick(bin)}
            className={`
              relative rounded-lg border-2 border-ink flex flex-col items-center justify-center p-1
              transition-all duration-100 cursor-pointer font-bold shadow-retro-sm
              hover:-translate-y-0.5 hover:shadow-retro active:translate-y-0 active:shadow-none
              ${isMoving ? "bg-retro-teal/30 ring-4 ring-retro-teal animate-pulse" : "bg-paper"}
            `}
            style={{
              gridRowStart: bin.row + 1,
              gridColumnStart: bin.col + 1,
              gridRowEnd: `span ${bin.rowSpan}`,
              gridColumnEnd: `span ${bin.colSpan}`,
              ...(bin.color && !isMoving
                ? { backgroundColor: bin.color + "30" }
                : {}),
            }}
          >
            <span className="text-xs text-center break-words leading-tight">
              {bin.label}
            </span>
            <span className="text-[10px] text-ink/50 font-semibold">
              {itemCount} barang
            </span>
            {(bin.rowSpan > 1 || bin.colSpan > 1) && (
              <span className="text-[9px] text-ink/40">
                {bin.rowSpan}×{bin.colSpan}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

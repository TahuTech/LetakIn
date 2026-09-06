import { useState } from "react";
import type { GridBin } from "./RackGrid";

type Props = {
  rackId: string;
  rows: number;
  cols: number;
  bins: GridBin[];
  movingBinId: string | null;
  onCellClick: (row: number, col: number) => void;
  onBinClick: (bin: GridBin) => void;
};

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
 * Editor grid interaktif: menampilkan sel kosong yang bisa diklik
 * + bin existing yang bisa diklik untuk edit.
 */
export default function RackGridEditor({
  rows,
  cols,
  bins,
  movingBinId,
  onCellClick,
  onBinClick,
}: Props) {
  const occupancy = buildOccupancy(bins);
  const [hoverCell, setHoverCell] = useState<string | null>(null);

  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const occupant = occupancy.get(key);
      // Hanya render sel kosong — bin dirender terpisah sebagai overlay grid
      if (!occupant) {
        cells.push(
          <button
            key={key}
            type="button"
            onClick={() => onCellClick(r, c)}
            onMouseEnter={() => setHoverCell(key)}
            onMouseLeave={() => setHoverCell(null)}
            className={`
              border-2 border-dashed border-ink/30 rounded-lg flex items-center justify-center
              text-ink/30 hover:border-retro-orange hover:text-retro-orange hover:bg-retro-yellow/20
              transition-colors min-h-16 text-xl font-bold
              ${movingBinId ? "animate-pulse border-retro-teal text-retro-teal hover:bg-retro-teal/20" : ""}
              ${hoverCell === key ? "bg-retro-yellow/20" : ""}
            `}
            style={{
              gridRowStart: r + 1,
              gridColumnStart: c + 1,
            }}
            title={movingBinId ? "Klik untuk pindahkan bin ke sini" : "Klik untuk tambah bin"}
          >
            +
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

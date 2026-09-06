import { isLowStock } from "../lib/utils";
import type { GridBin, GridRack } from "../hooks/api";

export type { GridBin, GridRack };

/**
 * Renderer grid rak murni CSS Grid.
 * Dipakai di overview (mini) dan detail rak (full).
 */
export default function RackGrid({
  rack,
  mini = false,
  selectedBinId,
  onBinClick,
}: {
  rack: GridRack;
  mini?: boolean;
  selectedBinId?: string | null;
  onBinClick?: (bin: GridBin) => void;
}) {
  return (
    <div
      className="grid gap-1.5 w-full"
      style={{
        gridTemplateRows: `repeat(${rack.rows}, minmax(0, 1fr))`,
        gridTemplateColumns: `repeat(${rack.cols}, minmax(0, 1fr))`,
        aspectRatio: mini ? undefined : `${rack.cols} / ${rack.rows}`,
      }}
    >
      {rack.bins.map((bin) => {
        const itemCount = bin.items?.length ?? 0;
        const hasLow = bin.items?.some(isLowStock) ?? false;
        const selected = selectedBinId === bin.id;

        return (
          <button
            key={bin.id}
            type="button"
            onClick={() => onBinClick?.(bin)}
            className={`
              relative rounded-lg border-2 border-ink flex flex-col items-center justify-center
              overflow-hidden transition-all duration-100 font-bold
              ${mini ? "min-h-0 p-0.5 border" : "min-h-16 p-1 shadow-retro-sm hover:-translate-y-0.5 hover:shadow-retro active:translate-y-0 active:shadow-none"}
              ${selected ? "ring-4 ring-retro-yellow bg-retro-yellow/30" : ""}
              ${!selected && !bin.color ? "bg-paper" : ""}
            `}
            style={{
              gridRowStart: bin.row + 1,
              gridColumnStart: bin.col + 1,
              gridRowEnd: `span ${bin.rowSpan}`,
              gridColumnEnd: `span ${bin.colSpan}`,
              ...(bin.color && !selected
                ? { borderColor: "#3E2F23", backgroundColor: bin.color + "30" }
                : {}),
            }}
          >
            <span
              className={`leading-tight text-center break-words w-full ${
                mini ? "text-[8px] truncate px-0.5" : "text-xs"
              }`}
            >
              {bin.label}
            </span>
            {!mini && (
              <span className="text-[10px] text-ink/50 font-semibold">
                {itemCount} barang
              </span>
            )}
            {hasLow && (
              <span
                className={`absolute top-1 right-1 rounded-full bg-retro-pink border border-ink
                  text-white font-bold flex items-center justify-center animate-bounce
                  ${mini ? "w-2.5 h-2.5 text-[6px]" : "w-4 h-4 text-[9px]"}`}
                title="Ada stok menipis"
              >
                {!mini && "!"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

import type { JenisBarang } from "../hooks/api";

/**
 * Pemilih jenis barang: Pribadi (stok terkunci 1) atau Dijual (stok bebas).
 * Segmented buttons bergaya retro.
 */
export default function JenisSelect({
  value,
  onChange,
}: {
  value: JenisBarang;
  onChange: (v: JenisBarang) => void;
}) {
  return (
    <div>
      <span className="label-retro">Jenis Barang</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange("pribadi")}
          aria-pressed={value === "pribadi"}
          className={`flex-1 !min-h-[44px] ${
            value === "pribadi" ? "btn-teal" : "btn-ghost"
          }`}
        >
          🏠 Pribadi
        </button>
        <button
          type="button"
          onClick={() => onChange("dijual")}
          aria-pressed={value === "dijual"}
          className={`flex-1 !min-h-[44px] ${
            value === "dijual" ? "btn-yellow" : "btn-ghost"
          }`}
        >
          🏷️ Dijual
        </button>
      </div>
      <p className="text-xs text-ink/50 font-semibold mt-1">
        {value === "pribadi"
          ? "🏠 Barang pribadi selalu berjumlah 1 dan tidak bisa ditransaksikan."
          : "🏷️ Barang dijual punya stok bebas dengan transaksi masuk/keluar."}
      </p>
    </div>
  );
}

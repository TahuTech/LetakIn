import { useMemo, useState } from "react";
import { useBulkCreateItemsText } from "../hooks/api";

type ParsedLine = {
  raw: string;
  name: string;
  category?: string;
  bin?: string;
};

/** Parse sintaks: nama [@ kategori] [> bin]. Komentar (#) & baris kosong → null. */
function parseLine(raw: string): ParsedLine | null {
  const line = raw.trim();
  if (!line || line.startsWith("#")) return null;
  const [beforeLoc, ...locParts] = line.split(">");
  const bin = locParts.length > 0 ? locParts.join(">").trim() || undefined : undefined;
  const [namePart, ...catParts] = beforeLoc.split("@");
  const name = namePart.trim();
  const category = catParts.length > 0 ? catParts.join("@").trim() || undefined : undefined;
  if (!name) return null;
  return { raw, name, category, bin };
}

/**
 * Input cepat banyak barang pribadi via teks satu per baris.
 * Sintaks: nama [@ kategori] [> labelBin]
 */
export default function QuickTextItemForm({
  onDone,
  onCancel,
}: {
  onDone: (created: number) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    categoriesCreated: string[];
    warnings: string[];
  } | null>(null);
  const [error, setError] = useState("");

  const bulkText = useBulkCreateItemsText();

  const parsed = useMemo(
    () => text.split("\n").map(parseLine).filter((p): p is ParsedLine => p !== null),
    [text]
  );

  async function submit() {
    setError("");
    setResult(null);
    if (parsed.length === 0) {
      setError("Tulis minimal 1 baris dengan nama barang");
      return;
    }
    try {
      // Kirim baris mentah — server yang parse & resolve authoritative
      const res = await bulkText.mutateAsync(text.split("\n"));
      setResult(res);
      if (res.warnings.length === 0) {
        // Semua bersih → langsung selesai
        setTimeout(() => onDone(res.created), 1200);
      }
      // Jika ada warning, biarkan user baca dulu lalu klik Selesai
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    }
  }

  // Tampilan hasil setelah submit
  if (result) {
    return (
      <div className="card-retro p-4 space-y-3">
        <h2 className="text-lg">✓ Selesai</h2>
        <p className="badge-retro bg-retro-teal text-white">
          {result.created} barang pribadi ditambahkan
        </p>

        {result.categoriesCreated.length > 0 && (
          <div className="border-2 border-ink rounded-xl bg-cream p-3">
            <p className="text-xs font-bold uppercase text-ink/60 mb-1">
              🏷️ Kategori baru dibuat
            </p>
            <div className="flex flex-wrap gap-1">
              {result.categoriesCreated.map((c) => (
                <span key={c} className="badge-retro bg-retro-yellow text-ink">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {result.warnings.length > 0 && (
          <div className="border-2 border-retro-orange rounded-xl bg-retro-orange/10 p-3 space-y-1">
            <p className="text-xs font-bold uppercase text-retro-orange mb-1">
              ⚠️ Perhatian ({result.warnings.length})
            </p>
            <ul className="text-xs font-semibold text-ink/70 space-y-0.5 list-disc pl-4">
              {result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <button onClick={() => onDone(result.created)} className="btn-primary">
          Selesai
        </button>
      </div>
    );
  }

  return (
    <div className="card-retro p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg">⌨️ Teks Cepat — Barang Pribadi</h2>
        <span className="badge-retro bg-retro-teal text-white">
          {parsed.length} barang terdeteksi
        </span>
      </div>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setShowPreview(false);
        }}
        rows={9}
        placeholder={
          "Satu barang per baris. Semua jadi 🏠 pribadi (jumlah 1).\n\nContoh:\n  Obeng Phillips\n  Solder 60W @ Peralatan\n  Multimeter > A1\n  Bor Listrik @ Perkakas > B2\n\n# diawali # = komentar, diabaikan"
        }
        className="input-retro font-mono text-[13px] leading-relaxed"
        autoFocus
      />

      <p className="text-xs text-ink/50 font-semibold">
        Sintaks: <code className="bg-cream px-1 rounded">nama</code>{" "}
        <code className="bg-cream px-1 rounded">@ kategori</code>{" "}
        <code className="bg-cream px-1 rounded">&gt; label-bin</code> — kategori dibuat otomatis
        jika belum ada; bin yang tidak ditemukan diberi peringatan tapi barang tetap dibuat.
      </p>

      {showPreview && parsed.length > 0 && (
        <div className="border-2 border-ink rounded-xl overflow-hidden">
          <table className="table-retro">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kategori</th>
                <th>Lokasi</th>
              </tr>
            </thead>
            <tbody>
              {parsed.map((p, i) => (
                <tr key={i}>
                  <td className="font-semibold">{p.name}</td>
                  <td>{p.category ?? <span className="text-ink/40">—</span>}</td>
                  <td>{p.bin ?? <span className="text-ink/40">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-center pt-1 border-t-2 border-ink/10">
        <button
          onClick={submit}
          disabled={bulkText.isPending || parsed.length === 0}
          className="btn-primary"
        >
          {bulkText.isPending ? "Menyimpan..." : `Simpan ${parsed.length} Barang`}
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          disabled={parsed.length === 0}
          className="btn-ghost"
        >
          {showPreview ? "🙈 Sembunyikan" : "👁️ Preview"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Batal
        </button>
        {error && (
          <span className="badge-retro bg-retro-pink text-white">⚠️ {error}</span>
        )}
      </div>
    </div>
  );
}
